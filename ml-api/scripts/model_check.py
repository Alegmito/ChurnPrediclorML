from pathlib import Path

import joblib
import pandas as pd
from config import (
    BASE_DIR,
    MODEL_PATH
)



def main():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model file {MODEL_PATH} does not exist. Run model_train.py to train the model first.")

    model = joblib.load(MODEL_PATH)

    sample = pd.DataFrame([
        {
            "tenure": 12,
            "MonthlyCharges": 65.0,
            "TotalCharges": 780.0,
            "Contract": "Month-to-month",
            "PaymentMethod": "Electronic check"
        },
        {
            "tenure": 48,
            "MonthlyCharges": 20.0,
            "TotalCharges": 100000.0,
            "Contract": "Two year",
            "PaymentMethod": "Credit card (automatic)"
        },
    ])

    probabilities = model.predict_proba(sample)[:, 1]
    predictions = model.predict(sample)

    print("Model loaded successfully.")

    print("Sample probabilities:", probabilities.tolist())
    print("Sample predictions:", predictions.tolist())

if __name__ == "__main__":
    main()
