import os
import re
from datetime import datetime, timezone
from functools import lru_cache

from langdetect import DetectorFactory, detect

DetectorFactory.seed = 0

MODEL_NAME = os.getenv(
    "SENTIMENT_MODEL",
    "cardiffnlp/twitter-xlm-roberta-base-sentiment",
)
REQUESTED_ENGINE = os.getenv("NLP_ENGINE", "transformer").lower()
LOCAL_ONLY = os.getenv("MODEL_LOCAL_FILES_ONLY", "false").lower() == "true"
_MODEL_ERROR = None

_URGENCY_TERMS = {
    "urgent", "breaking", "immediately", "now", "emergency", "alert",
    "share fast", "forward", "reshare", "stock essentials", "before they delete"
}
_MANIPULATION_TERMS = {
    "before they delete", "media won't tell", "share fast", "forward this",
    "reshare to every group", "official notice will follow", "they are hiding"
}
_CLAIM_TERMS = {
    "confirmed", "will shut", "will close", "closed", "shutdown", "curfew",
    "suspended", "shortage", "band hone", "நிறுத்தம்"
}


@lru_cache(maxsize=1)
def _sentiment_pipeline():
    global _MODEL_ERROR
    _MODEL_ERROR = None
    if REQUESTED_ENGINE != "transformer":
        return None
    try:
        from transformers import pipeline
        return pipeline(
            "sentiment-analysis",
            model=MODEL_NAME,
            tokenizer=MODEL_NAME,
            top_k=None,
            local_files_only=LOCAL_ONLY,
        )
    except Exception as exc:
        _MODEL_ERROR = f"{type(exc).__name__}: {exc}"
        return None


def engine_status():
    model = _sentiment_pipeline()
    if model is not None:
        return {
            "mode": "transformer",
            "model": MODEL_NAME,
            "fallback": False,
        }
    return {
        "mode": "heuristic-fallback",
        "model": MODEL_NAME if REQUESTED_ENGINE == "transformer" else None,
        "fallback": REQUESTED_ENGINE == "transformer",
        "error": _MODEL_ERROR,
    }


def _clamp(value):
    return max(0.0, min(1.0, float(value)))


def _detect_language(text):
    if re.search(r"[\u0B80-\u0BFF]", text):
        return "ta"
    try:
        return detect(text)
    except Exception:
        return "unknown"


def _term_score(text, vocabulary):
    lower = text.lower()
    hits = sum(1 for term in vocabulary if term in lower)
    if not vocabulary:
        return 0.0
    return _clamp(hits / 3)


def _normalize_sentiment(raw):
    if not raw:
        return {"label": "neutral", "score": 0.5}

    # pipeline(top_k=None) can return [[...]] or [...]
    if isinstance(raw, list) and raw and isinstance(raw[0], list):
        raw = raw[0]
    if not isinstance(raw, list):
        raw = [raw]

    scores = {}
    for item in raw:
        label = str(item.get("label", "")).lower()
        score = float(item.get("score", 0))
        if "negative" in label or label.endswith("0"):
            scores["negative"] = max(scores.get("negative", 0), score)
        elif "neutral" in label or label.endswith("1"):
            scores["neutral"] = max(scores.get("neutral", 0), score)
        elif "positive" in label or label.endswith("2"):
            scores["positive"] = max(scores.get("positive", 0), score)

    if not scores:
        return {"label": "neutral", "score": 0.5}

    label = max(scores, key=scores.get)
    return {"label": label, "score": round(scores[label], 4)}


def _heuristic_sentiment(text):
    lower = text.lower()
    negative_words = [
        "shortage", "shutdown", "curfew", "suspended", "hate", "fear",
        "urgent", "emergency", "band", "நிறுத்தம்"
    ]
    positive_words = ["safe", "normal", "verified", "resolved", "open"]
    neg = sum(1 for word in negative_words if word in lower)
    pos = sum(1 for word in positive_words if word in lower)

    if neg > pos:
        return {"label": "negative", "score": round(min(0.95, 0.55 + neg * 0.08), 4)}
    if pos > neg:
        return {"label": "positive", "score": round(min(0.9, 0.55 + pos * 0.08), 4)}
    return {"label": "neutral", "score": 0.6}


def _emotion(sentiment, urgency):
    if sentiment["label"] == "negative" and urgency >= 0.5:
        return {"label": "alarm", "score": round(max(sentiment["score"], urgency), 4)}
    if sentiment["label"] == "negative":
        return {"label": "concern", "score": sentiment["score"]}
    if sentiment["label"] == "positive":
        return {"label": "positive", "score": sentiment["score"]}
    return {"label": "neutral", "score": sentiment["score"]}


def _narrative(text):
    lower = text.lower()
    if any(term in lower for term in ["petrol", "fuel", "pump", "shortage"]):
        return "Fuel shortage"
    if any(term in lower for term in ["curfew", "18:00"]):
        return "Emergency curfew"
    if any(term in lower for term in ["transport", "city services", "shutdown", "நிறுத்தம்"]):
        return "Transport shutdown"
    if any(term in lower for term in ["verify", "unverified", "official channels"]):
        return "Verification response"
    if any(term in lower for term in ["coordinated", "same wording", "same image"]):
        return "Coordinated campaign"
    return "General discussion"


def analyze_text(text, post_id=None, handle=None):
    model = _sentiment_pipeline()
    if model is not None:
        try:
            sentiment = _normalize_sentiment(model(text[:2000]))
            engine = f"transformer:{MODEL_NAME}"
        except Exception:
            sentiment = _heuristic_sentiment(text)
            engine = "heuristic-fallback"
    else:
        sentiment = _heuristic_sentiment(text)
        engine = "heuristic-fallback"

    urgency = _term_score(text, _URGENCY_TERMS)
    manipulation = _term_score(text, _MANIPULATION_TERMS)
    claim_signal = _term_score(text, _CLAIM_TERMS)

    return {
        "id": post_id,
        "handle": handle,
        "language": _detect_language(text),
        "sentiment": sentiment,
        "emotion": _emotion(sentiment, urgency),
        "urgency": round(urgency, 4),
        "manipulation": round(manipulation, 4),
        "claimSignal": round(claim_signal, 4),
        "narrative": _narrative(text),
        "engine": engine,
        "analyzedAt": datetime.now(timezone.utc).isoformat(),
    }
