# SentinelNet NLP Service

FastAPI microservice for multilingual text analysis.

## Current milestone

The service performs:
- language detection,
- multilingual transformer sentiment inference when the configured Hugging Face model is available,
- deterministic urgency/manipulation/claim-signal extraction,
- lightweight narrative classification,
- batch inference for the Node/Express API.

The default transformer is `cardiffnlp/twitter-xlm-roberta-base-sentiment`. It is used as a practical multilingual baseline while the project prepares a domain-specific IndicBERT fine-tune. If the transformer cannot be loaded, the service reports `heuristic-fallback` instead of pretending model inference succeeded.

## Run

```bash
cd ml-service
python -m venv .venv
```

Windows:

```powershell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Linux/macOS:

```bash
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Health: http://localhost:8000/health
