import os
from typing import List, Dict, Any
from app.services.knowledge_ingestion import KnowledgeIngestionService # Wait, the module name is knowledge_ingestion
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
            # Check parent environment or config
            print("[RAG Service] MONGO_URI env var not found, direct DB retrieval disabled.")
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
            "You are HR Copilot, an enterprise AI assistant for the HRMinds AI platform. "
            "You must answer the user's question using ONLY the provided document context below. "
            "If the answer cannot be found in the context, say: 'I could not find the answer in the uploaded company policies or documentation. Please consult HR.' "
            "Never invent details or extrapolate outside the context. "
            "Be professional, direct, and structured. Use bullet points and clean formatting.\n\n"
            "CRITICAL CITATION REQUIREMENT:\n"
            "For every assertion or rule you state, you MUST immediately cite the source number or filename at the end of the sentence. "
            "At the end of your response, you must add a 'Sources:' list referencing the document names and page numbers of the files you retrieved.\n\n"
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
        
        db = cls.get_mongo_db()
        
        # 1 & 2. If chunks are not provided, generate embedding and perform retrieval
        if chunks is None:
            embedding = KnowledgeIngestionService.generate_embeddings([query])[0]
            chunks = cls.retrieve_chunks_direct(embedding, limit=5, is_approved_only=is_approved_only)
        
        # 3. Assemble Context
        context_str = cls.assemble_context(chunks, db)
        
        # 4. Construct prompts
        system_prompt = cls.construct_system_prompt(context_str)
        user_prompt = f"Question: {query}"
        
        # 5. Get LLM response
        answer = await open_router_client.get_completion(
            system_prompt=system_prompt,
            user_prompt=user_prompt
        )
        
        # Format sources citation metadata to return to client
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
