from fastapi.testclient import TestClient

from app.main import app
from scripts.config import MODEL_PATH

client = TestClient(app)

def test_health():
    response = client.get("/health")

    assert response.status_code == 200

    body = response.json()

    assert body['status'] == 'ok'
    assert body['model_status'] == 'loaded'
    return

def test_model_file_exists():
    assert MODEL_PATH.exists(), f"Model not found: {MODEL_PATH}"

def test_predict_valid_request():
    payload = {
        "tenure": 12.0,
        "MonthlyCharges": 65.0,
        "TotalCharges": 780.0,
        "Contract": "Month-to-month",
        "PaymentMethod": "Electronic check",
    }

    response = client.post("/predict", json=payload)
    print(response.json())

    assert response.status_code == 200

    data = response.json()

    assert "churn_probability" in data
    assert "churn_prediction" in data
    assert "prediction_label" in data

    assert 0 <= data["churn_probability"] <= 1
    assert data["churn_prediction"] in [0, 1]
    assert data["prediction_label"] in ["Yes", "No"]

def test_predict_with_missing_total_charges():
    payload = {
        "tenure": 0.0,
        "MonthlyCharges": 20.0,
        "TotalCharges": None,
        "Contract": "One year",
        "PaymentMethod": "Electronic check",
    }

    response = client.post("/predict", json=payload)
    print(response.json())

    assert response.status_code == 200

    data = response.json()

    assert 0 <= data["churn_probability"] <= 1


def test_invalid_contract_rejected():
    payload = {
        "tenure": 12.0,
        "MonthlyCharges": 65.0,
        "TotalCharges": 780.0,
        "Contract": "Invalid contract",
        "PaymentMethod": "Electronic check",
    }

    response = client.post("/predict", json=payload)

    assert response.status_code == 422


def test_invalid_payment_method_rejected():
    payload = {
        "tenure": 12.0,
        "MonthlyCharges": 65.0,
        "TotalCharges": 780.0,
        "Contract": "Month-to-month",
        "PaymentMethod": "Cash",
    }

    response = client.post("/predict", json=payload)

    assert response.status_code == 422


def test_negative_monthly_charges_rejected():
    payload = {
        "tenure": 12.0,
        "MonthlyCharges": -10.0,
        "TotalCharges": 780.0,
        "Contract": "Month-to-month",
        "PaymentMethod": "Electronic check",
    }

    response = client.post("/predict", json=payload)

    assert response.status_code == 422
