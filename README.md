# Customer Churn Prediction

A full-stack machine-learning application that predicts whether a telecom customer is likely to churn. It combines a **scikit-learn** model served by a **FastAPI** service, a **NestJS** API gateway, and a **Next.js** dashboard — wired together with **Docker Compose** and a **GitHub Actions** CI pipeline.

## Architecture

```
┌──────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Next.js     │ HTTP │   NestJS         │ HTTP │   FastAPI       │
│  frontend    ├─────►│   API gateway    ├─────►│   ML API        │
│  :3000       │      │   :4000          │      │   :8000         │
│              │      │  - validation    │      │  - model serving│
│  - predictor │      │  - CORS          │      │  - /predict     │
│  - dashboard │      │  - request log   │      │  - /health      │
└──────────────┘      └──────────────────┘      └─────────────────┘
```

| Service | Directory | Stack | Port |
| ------- | --------- | ----- | ---- |
| Frontend | [`churn-frontend/`](churn-frontend) | Next.js 16, React 19, Tailwind CSS 4 | `3000` |
| API gateway | [`churn-backend/`](churn-backend) | NestJS 11, class-validator | `4000` |
| ML service | [`ml-api/`](ml-api) | FastAPI, scikit-learn, pandas | `8000` |

The frontend talks only to the NestJS gateway, which validates input, forwards prediction requests to the ML service, and appends every prediction to a JSONL log that powers the dashboard's history view.

## The model

Trained on the [Telco Customer Churn](https://www.kaggle.com/datasets/blastchar/telco-customer-churn) dataset (`blastchar/telco-customer-churn`). The training script evaluates three candidates and keeps the one with the highest ROC AUC.

| Feature | Value |
| ------- | ----- |
| Task | Binary classification (churn: `Yes` / `No`) |
| Selected model | `GradientBoosting` (best ROC AUC) |
| Numerical features | `tenure`, `MonthlyCharges`, `TotalCharges` |
| Categorical features | `Contract`, `PaymentMethod` |
| Model version | `v1.0` |

Best-model performance on the held-out test split:

| Metric | GradientBoosting | RandomForest | LogisticRegression |
| ------ | ---------------- | ------------ | ------------------ |
| Accuracy | 0.789 | 0.775 | 0.777 |
| Precision | 0.634 | 0.589 | 0.600 |
| Recall | 0.481 | 0.505 | 0.481 |
| F1 | 0.547 | 0.544 | 0.534 |
| ROC AUC | **0.829** | 0.801 | 0.828 |

Full metrics, the confusion matrix, and a classification report are written to [`ml-api/models/metrics_v1.0.json`](ml-api/models/metrics_v1.0.json) and [`ml-api/models/model_card_v1.0.md`](ml-api/models/model_card_v1.0.md) after training.

## Repository layout

```
churn-predictor-ml/
├── ml-api/                 # FastAPI + scikit-learn model service
│   ├── app/                #   FastAPI app, schemas, inference
│   ├── scripts/            #   config, dataset download, train, model check
│   ├── tests/              #   pytest suite
│   ├── models/             #   trained artifacts (gitignored)
│   ├── data/               #   dataset (gitignored)
│   └── requirements.txt
├── churn-backend/          # NestJS API gateway
│   ├── src/                #   controllers, services, DTOs
│   └── test/               #   e2e specs
├── churn-frontend/         # Next.js UI
│   ├── app/                #   routes (/ and /dashboard)
│   ├── components/         #   ChurnForm, Dashboard
│   └── lib/                #   API client, types, risk helpers
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Prerequisites

- **Docker** and **Docker Compose** (for the containerized quickstart), or
- **Python 3.12+**, **Node.js 22+** (for running services directly)
- The trained model artifact (see [Train the model](#train-the-model) below) — it is gitignored, so it must be produced locally before building the ML image.

## Quickstart (Docker Compose)

1. Train the model so the artifact exists (see [Train the model](#train-the-model)).
2. Start the whole stack:

   ```bash
   docker compose up --build
   ```

3. Open the app:

   - Predictor: <http://localhost:3000>
   - Dashboard: <http://localhost:3000/dashboard>
   - NestJS health: <http://localhost:4000/health>
   - ML API health: <http://localhost:8000/health>

The ML image bakes in `ml-api/models/`, so re-run `docker compose build ml-api` after retraining.

## Running services manually

### 1. ML API (`ml-api/`)

```bash
cd ml-api
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# train the model first (see below), then serve
uvicorn app.main:app --reload --port 8000
```

### 2. Backend gateway (`churn-backend/`)

```bash
cd churn-backend
npm install
npm run start:dev               # http://localhost:4000
```

### 3. Frontend (`churn-frontend/`)

```bash
cd churn-frontend
npm install
npm run dev                     # http://localhost:3000
```

## Train the model

The dataset and trained model are gitignored. Train before running the ML service (or before building its image).

```bash
cd ml-api

# Option A — download via Kaggle (requires Kaggle API credentials)
python scripts/dataset_download.py

# Option B — download directly from the public IBM mirror
mkdir -p data/Downloaded
curl -sSL -o data/Downloaded/WA_Fn-UseC_-Telco-Customer-Churn.csv \
  https://raw.githubusercontent.com/IBM/telco-customer-churn-on-icp4d/master/data/Telco-Customer-Churn.csv

# Train and evaluate; writes model, metrics, model card, and a sample request
python scripts/model_train.py

# Optional: sanity-check the saved model
python scripts/model_check.py
```

Artifacts written to `ml-api/models/`:

- `churn_model_v1.0.joblib` — the serialized scikit-learn pipeline
- `metrics_v1.0.json` — per-model metrics
- `model_card_v1.0.md` — human-readable model card
- `sample_request_v1.0.json` — an example request body

## API reference

### ML service (`:8000`)

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/health` | Returns `200` with `model_status: loaded`, or `503` if the model can't be loaded |
| `POST` | `/predict` | Predicts churn probability for a customer |

`POST /predict` body:

```json
{
  "tenure": 12,
  "MonthlyCharges": 65.0,
  "TotalCharges": 780.0,
  "Contract": "Month-to-month",
  "PaymentMethod": "Electronic check"
}
```

Response:

```json
{
  "churn_probability": 0.68,
  "churn_prediction": 1,
  "prediction_label": "Yes"
}
```

### Gateway (`:4000`)

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/health` | Gateway + ML service status |
| `POST` | `/api/v1/churn/predict` | Forwards a prediction to the ML API (validated) |
| `GET` | `/api/v1/churn/history` | Recent prediction history (from the JSONL log) |
| `DELETE` | `/api/v1/churn/history` | Clears the prediction history |

## Environment variables

| Service | Variable | Default | Description |
| ------- | -------- | ------- | ----------- |
| Backend | `ML_API_URL` | `http://localhost:8000` | Base URL of the ML service |
| Backend | `FRONTEND_URL` | `http://localhost:3000` | Allowed CORS origin |
| Backend | `PORT` | `4000` | Gateway listen port |
| Frontend | `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Base URL of the gateway (inlined at build time) |

See [`churn-backend/.env.example`](churn-backend/.env.example) and [`churn-frontend/.env.example`](churn-frontend/.env.example).

## Testing

Each service has its own test runner:

| Service | Command | Runner |
| ------- | ------- | ------ |
| ML API | `cd ml-api && pytest` | pytest |
| Backend | `cd churn-backend && npm test` | Jest |
| Backend e2e | `cd churn-backend && npm run test:e2e` | Jest + supertest |
| Frontend | `cd churn-frontend && npm test` | Vitest |

Run everything at once with the CI workflow (below) or:

```bash
(cd ml-api && .venv/Scripts/python -m pytest)   # Windows; use bin/ on macOS/Linux
(cd churn-backend && npm test)
(cd churn-frontend && npm test)

```

You can also run `npm run check` to check linter and build project
> The ML API tests load the trained model, so run [Train the model](#train-the-model) before `pytest`.

## CI/CD

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push and pull request:

1. **ml-api** — installs dependencies, downloads the dataset from the public mirror, trains the model, and runs pytest (then publishes the model as an artifact).
2. **backend** — `npm ci`, lint, build, and Jest tests.
3. **frontend** — `npm ci`, lint, Vitest tests, and a production build.
4. **docker** — builds all three images (consuming the model artifact) to validate the Dockerfiles.

## Notes

- Model artifacts (`ml-api/models/`, `*.joblib`) and datasets (`data/`, `*.csv`) are intentionally gitignored — they are reproduced by the training step above.
- The gateway logs predictions to `churn-backend/logs/predictions.jsonl` (JSON Lines); the dashboard reads them via the history endpoint.
