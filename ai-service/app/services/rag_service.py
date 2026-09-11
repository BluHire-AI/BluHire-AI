import os
import time
from typing import List, Dict, Any
from app.services.knowledge_ingestion import KnowledgeIngestionService
from app.services.openrouter import open_router_client
from pymongo import MongoClient

class RAGService:
    _mongo_client = None
    _db = None

    @classmethod
    def get_mongo_db(cls):
        """Resolves MongoDB connection for direct query retrieval if configured."""
        if cls._db is not None:
            return cls._db
        
        mongo_uri = os.getenv("MONGO_URI")
        if not mongo_uri:
            # Node Knowledge Service handles retrieval directly and sends chunks to FastAPI.
            # Direct DB retrieval in FastAPI is intentionally optional.
            # print("[RAG Service] [DEBUG] MONGO_URI env var not found, direct DB retrieval disabled.")
            return None
            
        try:
            print("[RAG Service] Connecting to MongoDB...")
            cls._mongo_client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
            
            # Parse DB name from URI or default to 'test'
            # URI format: mongodb://host/dbname?auth...
            db_name = "test"
            parsed_uri = mongo_uri.split("/")
            if len(parsed_uri) > 3:
                db_part = parsed_uri[3].split("?")[0]
                if db_part:
                    db_name = db_part
            
            cls._db = cls._mongo_client[db_name]
            print(f"[RAG Service] MongoDB connected successfully to database: '{db_name}'")
            return cls._db
        except Exception as e:
            print(f"[RAG Service] Failed to connect to MongoDB directly: {e}")
            return None

    @classmethod
    def retrieve_chunks_direct(cls, query_embedding: List[float], limit: int = 5, is_approved_only: bool = False) -> List[Dict[str, Any]]:
        """
        Retrieves top K chunks directly from MongoDB using Atlas Vector Search or in-memory fallback.
        """
        db = cls.get_mongo_db()
        if db is None:
            return []

        chunks_col = db["knowledgechunks"]
        docs_col = db["knowledgedocuments"]

        # If Employee role, retrieve approved documents first
        approved_doc_ids = []
        if is_approved_only:
            approved_docs = docs_col.find({"isApprovedForEmployees": True}, {"_id": 1})
            approved_doc_ids = [doc["_id"] for doc in approved_docs]
            if not approved_doc_ids:
                return [] # No approved docs

        # Attempt Atlas Vector Search
        try:
            pipeline = []
            search_stage = {
                "$vectorSearch": {
                    "index": "vector_index",
                    "path": "embedding",
                    "queryVector": query_embedding,
                    "numCandidates": limit * 10,
                    "limit": limit
                }
            }
            pipeline.append(search_stage)
            
            # Filter if role restricted
            if is_approved_only:
                pipeline.append({
                    "$match": {"documentId": {"$in": approved_doc_ids}}
                })

            results = list(chunks_col.aggregate(pipeline))
            if results:
                print(f"[RAG Service] Retrieved {len(results)} chunks using Atlas Vector Search.")
                return results
        except Exception as atlas_err:
            print(f"[RAG Service] Atlas Vector Search aggregator failed: {atlas_err}. Falling back to cosine similarity calculation.")

        # Fallback to local cosine similarity
        try:
            filter_query = {}
            if is_approved_only:
                filter_query["documentId"] = {"$in": approved_doc_ids}

            # Fetch chunks candidates
            candidates = list(chunks_col.find(filter_query, {"embedding": 1, "content": 1, "documentId": 1, "pageNumber": 1, "sectionTitle": 1}))
            if not candidates:
                return []

            # Calculate similarity in-memory
            import numpy as np
            q_vec = np.array(query_embedding)
            
            scored_candidates = []
            for cand in candidates:
                if "embedding" in cand and cand["embedding"]:
                    c_vec = np.array(cand["embedding"])
                    # Cosine Similarity
                    dot_product = np.dot(q_vec, c_vec)
                    norm_q = np.linalg.norm(q_vec)
                    norm_c = np.linalg.norm(c_vec)
                    if norm_q > 0 and norm_c > 0:
                        sim = dot_product / (norm_q * norm_c)
                        scored_candidates.append((sim, cand))

            # Sort by similarity score descending
            scored_candidates.sort(key=lambda x: x[0], reverse=True)
            top_matches = scored_candidates[:limit]
            
            formatted_chunks = []
            for score, cand in top_matches:
                cand["score"] = float(score)
                # Convert MongoDB ObjectId to string for JSON serialization
                cand["_id"] = str(cand["_id"])
                cand["documentId"] = str(cand["documentId"])
                formatted_chunks.append(cand)
            
            return formatted_chunks
        except Exception as fallback_err:
            print(f"[RAG Service] Cosine Similarity Fallback failed: {fallback_err}")
            return []

    @classmethod
    def assemble_context(cls, chunks: List[Dict[str, Any]], db = None) -> str:
        """Formats retrieved chunks into a unified string context."""
        context_parts = []
        
        # We can map document titles if db is available
        doc_cache = {}
        
        for idx, chunk in enumerate(chunks):
            doc_id = str(chunk.get("documentId", ""))
            doc_title = "Document"
            
            if doc_id:
                if doc_id in doc_cache:
                    doc_title = doc_cache[doc_id]
                elif db is not None:
                    try:
                        from bson import ObjectId
                        doc = db["knowledgedocuments"].find_one({"_id": ObjectId(doc_id)}, {"title": 1, "fileName": 1})
                        if doc:
                            doc_title = doc.get("title", doc.get("fileName", "Document"))
                            doc_cache[doc_id] = doc_title
                    except Exception:
                        pass
            
            page = chunk.get("pageNumber", "N/A")
            section = chunk.get("sectionTitle", "General Section")
            content = chunk.get("content", "").strip()
            
            part = (
                f"Source [{idx+1}]: {doc_title} (Page {page}, Section: {section})\n"
                f"Content: {content}\n"
                f"---"
            )
            context_parts.append(part)
            
        return "\n\n".join(context_parts)

    @classmethod
    def construct_system_prompt(cls, context: str) -> str:
        """Builds prompt instructing the LLM to answer using injected context and cite sources."""
        return (
            "You are HR Copilot, an enterprise AI assistant for the HRMinds AI platform.\n"
            "You must answer the user's question using ONLY the provided document context below.\n\n"
            "CRITICAL GUIDELINES:\n"
            "1. ADAPT ANSWER LENGTH TO THE QUESTION:\n"
            "   - Specific factual questions (e.g., 'What are the working hours?', 'How many annual leaves are employees entitled to?'): Provide a direct, concise answer in 1-3 sentences or a few bullets. Do NOT generate an extensive report or include unrelated policy sections.\n"
            "   - Broad overview questions (e.g., 'Tell me the company policies', 'Tell me about Dhanush'): Provide a clean, structured summary grouped by topic or section.\n"
            "   - Comparison questions: Provide a clear, concise comparison.\n"
            "2. NEVER COPY VERBATIM OR DUMP DOCUMENTS: Synthesize and summarize the relevant information in your own clear words. Never reproduce raw context blocks or full documents.\n"
            "3. NO STANDALONE OR EMPTY BULLETS: Never output empty bullet points ('-', '*', or '•' with no text or only whitespace). Every bullet must contain substantive content. Do not insert bullet markers between headings or sections.\n"
            "4. CITATION ATTRIBUTION (AVOID REPETITION):\n"
            "   - Do NOT repeat '[Source 1]' at the end of every individual sentence or bullet point when all information comes from the same source.\n"
            "   - If all or most information comes from a single source, state the answer naturally and include the attribution at the end in a clean 'Sources:' section (e.g., 'Source: HR Employee Handbook, Page 1').\n"
            "   - Only use inline source tags (e.g. [Source 2]) if multiple distinct sources support different facts in the same answer and distinction is necessary.\n"
            "5. GROUNDING & SAFETY:\n"
            "   - Use ONLY retrieved context. Never invent details, dates, numbers, or extrapolate outside the context.\n"
            "   - If the answer cannot be found in the context, say: 'I could not find the answer in the uploaded company policies or documentation. Please consult HR.'\n"
            "   - Be professional, direct, and structured. Use Markdown formatting cleanly.\n\n"
            "Here is the context documentation:\n"
            "==============================\n"
            f"{context}\n"
            "==============================\n"
        )

    @classmethod
    async def generate_rag_answer(cls, query: str, chunks: List[Dict[str, Any]] = None, is_approved_only: bool = False) -> Dict[str, Any]:
        """
        Executes the full RAG pipeline:
        1. Embed query (if chunks not provided)
        2. Retrieve top chunks (if chunks not provided)
        3. Assemble context
        4. Query OpenRouter
        """
        from app.services.knowledge_ingestion import KnowledgeIngestionService
        t_rag_start = time.perf_counter()
        
        db = cls.get_mongo_db()
        t_db = time.perf_counter()
        
        # 1 & 2. If chunks are not provided, generate embedding and perform retrieval
        if chunks is None:
            t_direct_start = time.perf_counter()
            embedding = KnowledgeIngestionService.generate_embeddings([query])[0]
            chunks = cls.retrieve_chunks_direct(embedding, limit=5, is_approved_only=is_approved_only)
            print(f"[RAG Service Timing] Direct retrieval: {(time.perf_counter() - t_direct_start)*1000:.2f} ms")
        
        # 3. Assemble Context
        t_ctx_start = time.perf_counter()
        context_str = cls.assemble_context(chunks, db)
        t_ctx_end = time.perf_counter()
        
        # 4. Construct prompts
        t_prompt_start = time.perf_counter()
        system_prompt = cls.construct_system_prompt(context_str)
        user_prompt = f"Question: {query}"
        t_prompt_end = time.perf_counter()
        
        # 5. Get LLM response
        t_llm_start = time.perf_counter()
        answer = await open_router_client.get_completion(
            system_prompt=system_prompt,
            user_prompt=user_prompt
        )
        t_llm_end = time.perf_counter()
        
        # Format sources citation metadata to return to client
        t_cite_start = time.perf_counter()
        citations = []
        doc_cache = {}
        for chunk in chunks:
            doc_id = str(chunk.get("documentId", ""))
            doc_title = "Document"
            file_name = "document.pdf"
            
            if doc_id:
                if doc_id in doc_cache:
                    doc_title, file_name = doc_cache[doc_id]
                elif db is not None:
                    try:
                        from bson import ObjectId
                        doc = db["knowledgedocuments"].find_one({"_id": ObjectId(doc_id)}, {"title": 1, "fileName": 1})
                        if doc:
                            doc_title = doc.get("title", "Document")
                            file_name = doc.get("fileName", "document.pdf")
                            doc_cache[doc_id] = (doc_title, file_name)
                    except Exception:
                        pass
                        
            citations.append({
                "title": doc_title,
                "fileName": file_name,
                "pageNumber": chunk.get("pageNumber", 1),
                "sectionTitle": chunk.get("sectionTitle", "General Section"),
                "score": chunk.get("score", 1.0)
            })
        t_cite_end = time.perf_counter()

        print(
            f"[RAG Service Timing Breakdown]\n"
            f"  DB Check:         {(t_db - t_rag_start)*1000:.2f} ms\n"
            f"  Context Assembly: {(t_ctx_end - t_ctx_start)*1000:.2f} ms\n"
            f"  Prompt Construct: {(t_prompt_end - t_prompt_start)*1000:.2f} ms\n"
            f"  OpenRouter LLM:   {(t_llm_end - t_llm_start)*1000:.2f} ms\n"
            f"  Citations Build:  {(t_cite_end - t_cite_start)*1000:.2f} ms\n"
            f"  Total RAG Serv:   {(t_cite_end - t_rag_start)*1000:.2f} ms"
        )

        return {
            "query": query,
            "answer": answer,
            "chunks": [{
                "content": c.get("content"),
                "pageNumber": c.get("pageNumber"),
                "sectionTitle": c.get("sectionTitle")
            } for c in chunks],
            "citations": citations
        }
