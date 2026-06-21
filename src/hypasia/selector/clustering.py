"""
Hypasia AI — Semantic Diversity Selector.
Uses sentence-transformers to embed dataset rows and FAISS KMeans 
to select the most semantically diverse subset.
"""
from __future__ import annotations

import logging
from typing import Optional

from hypasia.schema import HypasiaRow

logger = logging.getLogger("hypasia.clustering")

try:
    from sentence_transformers import SentenceTransformer
    import faiss
    import numpy as np
    HAS_CLUSTERING = True
except ImportError:
    HAS_CLUSTERING = False


def select_diverse(rows: list[HypasiaRow], target_count: int, model_name: str = "all-MiniLM-L6-v2") -> list[HypasiaRow]:
    """
    Selects a diverse subset of rows using KMeans clustering.
    Returns `target_count` rows that represent the centroids of clusters.
    If dependencies are missing or `target_count >= len(rows)`, returns original rows.
    """
    if not rows or target_count >= len(rows):
        return rows

    if not HAS_CLUSTERING:
        logger.warning("faiss-cpu or sentence-transformers not installed. Skipping diversity selection.")
        # Fallback: Just return the top `target_count` rows (assuming they are pre-sorted by score)
        return rows[:target_count]

    logger.info(f"Encoding {len(rows)} rows for diversity selection...")
    try:
        model = SentenceTransformer(model_name)
        # We embed the instruction since that dictates the variety of the dataset
        texts = [r.instruction for r in rows]
        embeddings = model.encode(texts, show_progress_bar=False)
        embeddings = np.array(embeddings, dtype=np.float32)

        # Normalize for spherical k-means
        faiss.normalize_L2(embeddings)

        dim = embeddings.shape[1]
        kmeans = faiss.Kmeans(dim, target_count, niter=20, verbose=False, spherical=True)
        kmeans.train(embeddings)

        # Find the closest data point to each centroid
        # D: distances, I: indices of the nearest neighbors
        # For each centroid, find the 1 nearest neighbor
        centroids = kmeans.centroids
        faiss.normalize_L2(centroids)
        index = faiss.IndexFlatIP(dim)
        index.add(embeddings)
        
        # Search the index with centroids to find the closest original rows
        distances, indices = index.search(centroids, 1)
        
        selected_indices = [i[0] for i in indices]
        
        # Deduplicate indices in case multiple centroids hit the same point
        selected_indices = list(dict.fromkeys(selected_indices))

        diverse_rows = [rows[i] for i in selected_indices]
        
        # If we somehow got fewer than target_count, fill the rest with unselected highest scored
        if len(diverse_rows) < target_count:
            remaining = target_count - len(diverse_rows)
            unselected = [r for i, r in enumerate(rows) if i not in selected_indices]
            diverse_rows.extend(unselected[:remaining])

        return diverse_rows

    except Exception as e:
        logger.error(f"Clustering failed: {e}. Falling back to top-K selection.")
        return rows[:target_count]
