import os
import re
from typing import List, Dict, Any
from app.parsers.resume_parser import ResumeParser

class KnowledgeIngestionService:
    _model = None

    @classmethod
    def get_model(cls):
        """Lazy-load the SentenceTransformer model to save memory during startup."""
        if cls._model is None:
            from sentence_transformers import SentenceTransformer
            # Using all-MiniLM-L6-v2 which has 384 dimensions and is very fast
            model_name = os.getenv("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")
            print(f"Loading SentenceTransformer model: {model_name}...")
            cls._model = SentenceTransformer(model_name)
            print("Embedding model loaded")
        return cls._model

    @classmethod
    def clean_text(cls, text: str) -> str:
        """
        Cleans the extracted text by:
        1. Removing typical header/footer artifacts (like page numbers on single lines)
        2. Normalizing whitespace and line breaks
        """
        if not text:
            return ""

        # Remove lone numbers on lines (likely page numbers)
        lines = text.split("\n")
        cleaned_lines = []
        for line in lines:
            line_strip = line.strip()
            # If the line is just a number (page number), skip it
            if re.match(r"^\d+$", line_strip):
                continue
            # Skip empty lines that are just repeated headers or footers
            if re.match(r"^Page \d+ of \d+$", line_strip, re.IGNORECASE):
                continue
            cleaned_lines.append(line)

        text = "\n".join(cleaned_lines)

        # Replace repeated whitespaces and tabs with a single space
        text = re.sub(r"[ \t]+", " ", text)
        # Standardize empty lines: collapse multiple empty lines into at most double newlines
        text = re.sub(r"\n\s*\n", "\n\n", text)
        
        return text.strip()

    @classmethod
    def generate_chunks(cls, text: str, chunk_size_words: int = 500, overlap_words: int = 100) -> List[Dict[str, Any]]:
        """
        Splits clean text into chunks based on word counts.
        Averages ~500-1000 tokens (1 word ~ 1.3 tokens, so 500 words is ~650 tokens).
        """
        if not text:
            return []

        # Split text into paragraphs first to avoid cutting sentences/paragraphs mid-way where possible
        paragraphs = text.split("\n\n")
        chunks = []
        current_chunk_words = []
        current_word_count = 0
        chunk_index = 0

        # Simple sliding window approach using paragraphs and fallback to word splitting
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            para_words = para.split(" ")
            para_word_count = len(para_words)

            # If a single paragraph is larger than the chunk size, split it into smaller pieces
            if para_word_count > chunk_size_words:
                # Flush existing chunk if it exists
                if current_chunk_words:
                    content = " ".join(current_chunk_words)
                    chunks.append({
                        "chunkIndex": chunk_index,
                        "content": content,
                        "pageNumber": 1, # Default placeholder
                        "sectionTitle": cls._detect_section_title(content)
                    })
                    chunk_index += 1
                    # Implement overlap by keeping last N words
                    current_chunk_words = current_chunk_words[-overlap_words:] if len(current_chunk_words) > overlap_words else []
                    current_word_count = len(current_chunk_words)

                # Split the large paragraph into parts
                for i in range(0, para_word_count, chunk_size_words - overlap_words):
                    part_words = para_words[i:i + chunk_size_words]
                    content = " ".join(part_words)
                    chunks.append({
                        "chunkIndex": chunk_index,
                        "content": content,
                        "pageNumber": 1,
                        "sectionTitle": cls._detect_section_title(content)
                    })
                    chunk_index += 1
                continue

            # Check if adding this paragraph exceeds the chunk size
            if current_word_count + para_word_count > chunk_size_words:
                # Save the current chunk
                content = " ".join(current_chunk_words)
                chunks.append({
                    "chunkIndex": chunk_index,
                    "content": content,
                    "pageNumber": 1,
                    "sectionTitle": cls._detect_section_title(content)
                })
                chunk_index += 1
                
                # Implement overlap (keep some words from the end of the current chunk)
                flat_words = " ".join(current_chunk_words).split(" ")
                current_chunk_words = flat_words[-overlap_words:] if len(flat_words) > overlap_words else []
                current_word_count = len(current_chunk_words)

            current_chunk_words.append(para)
            current_word_count += para_word_count

        # Flush any remaining text in the buffer
        if current_chunk_words:
            content = " ".join(current_chunk_words)
            chunks.append({
                "chunkIndex": chunk_index,
                "content": content,
                "pageNumber": 1,
                "sectionTitle": cls._detect_section_title(content)
            })

        return chunks

    @classmethod
    def _detect_section_title(cls, text: str) -> str:
        """Helper to extract a potential section title from a text chunk."""
        # Look at the first 3 lines of text
        lines = [line.strip() for line in text.split("\n") if line.strip()][:3]
        for line in lines:
            # If line is short and uppercase/title case, it might be a header
            if len(line) < 60 and (line.isupper() or line.istitle() or ":" in line):
                return line
        return "General Content"

    @classmethod
    def generate_embeddings(cls, texts: List[str]) -> List[List[float]]:
        """Generates dense vector embeddings for list of texts."""
        if not texts:
            return []
        model = cls.get_model()
        embeddings = model.encode(texts, show_progress_bar=False)
        return embeddings.tolist()

    @classmethod
    def ingest_document(cls, filename: str, file_bytes: bytes) -> List[Dict[str, Any]]:
        """
        Parses a document, cleans text, splits into chunks, and generates vector embeddings.
        Returns a list of chunks with content, embeddings, and metadata.
        """
        print("File received")
        # 1. Parse document text using the existing parser
        raw_text = ResumeParser.parse(filename, file_bytes)
        if not raw_text or not raw_text.strip():
            raise ValueError(f"No text could be extracted from {filename}")

        # 2. Clean text
        clean_text = cls.clean_text(raw_text)

        # 3. Generate Chunks
        chunks = cls.generate_chunks(clean_text)
        print("Chunk count:", len(chunks))

        # 4. Generate Embeddings for each chunk
        chunk_contents = [chunk["content"] for chunk in chunks]
        embeddings = cls.generate_embeddings(chunk_contents)
        print("Embedding count:", len(embeddings))

        # 5. Populate embeddings back to the chunks structure
        for idx, chunk in enumerate(chunks):
            chunk["embedding"] = embeddings[idx]
            # Try to estimate page number or add basic metadata
            chunk["metadata"] = {
                "fileName": filename,
                "estimatedLength": len(chunk["content"])
            }

        return chunks
