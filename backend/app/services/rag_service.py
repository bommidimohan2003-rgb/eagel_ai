from typing import List, Optional


class RAGService:
    """
    Modular RAG Service.
    Prepared for chunking, embedding generation, and vector retrieval.
    """

    @staticmethod
    def chunk_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 100) -> List[str]:
        if not text:
            return []
        
        chunks = []
        start = 0
        text_length = len(text)

        while start < text_length:
            end = start + chunk_size
            chunk = text[start:end]
            chunks.append(chunk)
            start += chunk_size - chunk_overlap

        return chunks

    @staticmethod
    async def retrieve_relevant_context(
        query: str,
        document_texts: List[str],
        top_k: int = 3,
    ) -> List[str]:
        """
        Simple keyword/similarity ranking ready to be swapped with pgvector embeddings.
        """
        if not document_texts:
            return []

        # Return top matching chunks based on term occurrence
        query_terms = [q.lower() for q in query.split() if len(q) > 3]
        if not query_terms:
            return document_texts[:top_k]

        scored_docs = []
        for doc in document_texts:
            score = sum(doc.lower().count(term) for term in query_terms)
            scored_docs.append((score, doc))

        scored_docs.sort(key=lambda x: x[0], reverse=True)
        return [doc for score, doc in scored_docs[:top_k]]
