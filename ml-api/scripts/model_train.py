import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    classification_report,
    roc_auc_score,
    precision_score,
    recall_score,
    confusion_matrix
)

from config import (
    BASE_DIR, MODELS_DIR, FEATURES, NUMERICAL_FEATURES, CATEGORICAL_FEATURES, MODEL_VER, ID_COLUMN, TARGET_COLUMN, MODEL_PATH
)

DATA_PATH = BASE_DIR / "data" / "Downloaded" / "WA_Fn-UseC_-Telco-Customer-Churn.csv"

def load_data(data_path: Path) -> pd.DataFrame | None:
    """
    Load churn dataset from the specified path. Do minimal cleaning
    """
    if not data_path.exists():
        print(f"Data file {data_path} does not exist.")
        return None

    df = pd.read_csv(data_path)

    if ID_COLUMN in df.columns:
        # Dont need the ID column for training, drop it
        df.drop(columns=[ID_COLUMN], inplace=True)

    TOTALCHARGES_COLUMN = "TotalCharges"
    df[TOTALCHARGES_COLUMN] = pd.to_numeric(df[TOTALCHARGES_COLUMN], errors="coerce")

    print(f"Data loaded successfully. Shape: {df.shape}. Columns: {df.columns.tolist()}")
    print (f"Target column unique values: {df[TARGET_COLUMN].unique()}")
    df[TARGET_COLUMN] = df[TARGET_COLUMN].map({"Yes": 1, "No": 0})

    df = df[FEATURES + [TARGET_COLUMN]]
    df = df.dropna(subset=[TARGET_COLUMN])

    print(f"Data after cleaning. Shape: {df.shape}. Columns: {df.columns.tolist()}")
    print(f"Target distribution:\n{df[TARGET_COLUMN].value_counts(normalize=True)}")
    return df

def build_pipeline(classifier) -> Pipeline:
    numeric_pipeline = Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="mean")),
                ("scaler", StandardScaler())
                ]
            )

    categorical_pipeline = Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="most_frequent")),
                ("onehot", OneHotEncoder(handle_unknown="ignore"))
                ]
            )

    preprocessor = ColumnTransformer(
            transformers=[
                ("num", numeric_pipeline, NUMERICAL_FEATURES),
                ("cat", categorical_pipeline, CATEGORICAL_FEATURES)
                ]
            )

    pipeline = Pipeline(
            steps=[
                ("preprocessor", preprocessor),
                ("classifier", classifier)
                ]
            )

    return pipeline

def evaluate_model(model, features_test: pd.DataFrame, label_test: pd.Series) -> dict:
    features_predict = model.predict(features_test)
    label_proba = model.predict_proba(features_test)[:, 1]

    metrics = {
        "accuracy": round(float(accuracy_score(label_test, features_predict)), 6),
        "precision": round(float(precision_score(label_test, features_predict)), 6),
        "recall": round(float(recall_score(label_test, features_predict)), 6),
        "f1": round(float(f1_score(label_test, features_predict)), 6),
        "roc_auc": round(float(roc_auc_score(label_test, label_proba)), 6),
        "confusion_matrix": confusion_matrix(label_test, features_predict).tolist(),
        "classification_report": classification_report(label_test, features_predict)
    }

    return metrics

def save_model_card(selected_model_name: str, metrics: dict):
    """
    Save a model card with the selected model and its metrics.
    """

    model_card = f"""
## Model Card for {selected_model_name}

model_version: {MODEL_VER}
selected_model: {selected_model_name}
task: Binary Classification (Customer Churn Prediction)
target: {TARGET_COLUMN}

## Features

{json.dumps(FEATURES, indent=2)}

## Numeric Features

{json.dumps(NUMERICAL_FEATURES, indent=2)}

## Categorical Features

{json.dumps(CATEGORICAL_FEATURES, indent=2)}


## Preprocessing

Numeric features:
- SimpleImputer(strategy="median")
- StandardScaler()

Categorical features:
- SimpleImputer(strategy="most_frequent")
- OneHotEncoder(handle_unknown="ignore")

## Model Evaluation Metrics

accuracy: {metrics['accuracy']}
precision: {metrics['precision']}
recall: {metrics['recall']}
f1: {metrics['f1']}
roc_auc: {metrics['roc_auc']}

## Confusion Matrix

{metrics['confusion_matrix']}

## Classification Report

{metrics['classification_report']}
"""
    
    model_card_path = MODELS_DIR / f"model_card_{MODEL_VER}.md"
    model_card_path.write_text(model_card, encoding="utf-8")
    print(f"Model card saved to {model_card_path}")

def smoke_test_model(model : Pipeline):
    """
    Run a smoke test on the model to ensure it can make predictions on a sample input.
    """
    sample = pd.DataFrame([
        {
            "tenure": 0.0,
            "MonthlyCharges": 20.0,
            "TotalCharges": None,
            "Contract": "Month-to-month",
            "PaymentMethod": "Electronic check"
        }, 
        {
            "tenure": 48.0,
            "MonthlyCharges": 80.0,
            "TotalCharges": 4000.0,
            "Contract": "Two year",
            "PaymentMethod": "Credit card (automatic)"
        }, 
    ])

    probabilities = model.predict_proba(sample)[:, 1]

    assert len(probabilities) == len(sample), "Number of predictions does not match number of samples."
    assert all(0.0 <= p <= 1.0 for p in probabilities), "Predicted probabilities are not in the range [0, 1]."

    print ("Smoke test passed. Model can make predictions on sample input.")
    print(f"Predicted probabilities: {probabilities.tolist()}")

    return sample

def main():
    print(f"base dir {BASE_DIR}")
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Loading data from {DATA_PATH}")

    df = load_data(DATA_PATH)


    if df is None:
        print("Failed to load dataset. Exiting.")
        return
    
    customer_features = df[FEATURES]
    churn_label = df[TARGET_COLUMN]

    print("Splitting data into training and testing sets...")
    features_train, features_test, label_train, label_test = train_test_split(
        customer_features, churn_label, test_size=0.2, stratify=churn_label, random_state=42
    )

    candidate_models = {
        "RandomForestClassifier": RandomForestClassifier(n_estimators=300, random_state=42, n_jobs=-1),
        "LogisticRegression": LogisticRegression(max_iter=1000, random_state=42),
        "GradientBoosting": GradientBoostingClassifier(n_estimators=300, random_state=42),
    }

    all_metrics = {}
    best_model_name : str | None = None
    best_model = None
    best_roc_auc = -1.0

    for name, classifier in candidate_models.items():
        print(f"Training model: {name}")
        pipeline = build_pipeline(classifier)
        pipeline.fit(features_train, label_train)

        metrics = evaluate_model(pipeline, features_test, label_test)
        all_metrics[name] = metrics

        # Evaluate the model
        print(f"Model: {name}, ROC AUC: {metrics['roc_auc']}")
        print(f"{name} F1: {metrics['f1']}")
        print(f"{name} Recall: {metrics['recall']}")

        if metrics['roc_auc'] > best_roc_auc:
            best_roc_auc = metrics['roc_auc']
            best_model_name = name
            best_model = pipeline 

    if best_model is None:
        raise ValueError("No suitable model found.")

    print("Best model:", best_model_name)

    joblib.dump(best_model, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")


    metrics_payload = {
        "model_version": MODEL_VER,
        "selected_model": best_model_name,
        "selection_metric": "roc_auc",
        "features": FEATURES,
        "numerical_features": NUMERICAL_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "models": all_metrics,
        "target_column": TARGET_COLUMN
    }

    metrics_path = MODELS_DIR / f"metrics_{MODEL_VER}.json"
    metrics_path.write_text(json.dumps(metrics_payload, indent=2), encoding="utf-8")
    print(f"Metrics saved to {metrics_path}")

    save_model_card(best_model_name, all_metrics[best_model_name])

    print("\nRunning smoke test...")
    sample = smoke_test_model(best_model)

    sample_request_path = MODELS_DIR / f"sample_request_{MODEL_VER}.json"
    sample_request_path.write_text(json.dumps(sample.to_dict(orient="records"), indent=2), encoding="utf-8")

    print(f"Sample request saved to {sample_request_path}")

if __name__ == "__main__":
    main()
