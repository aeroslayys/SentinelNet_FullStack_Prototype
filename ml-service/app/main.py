import os
import re
from datetime import datetime, timezone
from functools import lru_cache
from typing import List, Optional

from fastapi import FastAPI
from pydantic import BaseModel, Field

from .nlp import analyze_text, engine_status

app = FastAPI(
    title="SentinelNet NLP Service",
    version="0.1.0",
    description="Multilingual NLP inference service used by the SentinelNet API."
)


class AnalyzeRequest(BaseModel):
    id: Optional[str] = None
    handle: Optional[str] = None
    text: str = Field(min_length=1, max_length=10000)


class BatchRequest(BaseModel):
    posts: List[AnalyzeRequest] = Field(min_length=1, max_length=250)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "sentinelnet-nlp",
        "engine": engine_status(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/analyze")
def analyze(payload: AnalyzeRequest):
    return analyze_text(payload.text, payload.id, payload.handle)


@app.post("/analyze/batch")
def analyze_batch(payload: BatchRequest):
    return {
        "items": [
            analyze_text(item.text, item.id, item.handle)
            for item in payload.posts
        ],
        "engine": engine_status(),
        "analyzedAt": datetime.now(timezone.utc).isoformat(),
    }
