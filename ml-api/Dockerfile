# Churn ML API — FastAPI + scikit-learn
# Requires the trained model to exist at ./models (run `python scripts/model_train.py` first).

FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install dependencies first for better layer caching
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Application code (both `app` and `scripts` packages are importable from /app)
COPY app ./app
COPY scripts ./scripts

# Pre-trained model artifact (gitignored — train before building)
COPY models ./models

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
