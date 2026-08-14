from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]

MODELS_DIR = BASE_DIR / "models"

# the list of features in the dataset
#customerID,gender,SeniorCitizen,Partner,Dependents,tenure,
#PhoneService,MultipleLines,InternetService,OnlineSecurity,OnlineBackup,
#DeviceProtection,TechSupport,StreamingTV,StreamingMovies,Contract,
#PaperlessBilling,PaymentMethod,MonthlyCharges,TotalCharges,Churn
NUMERICAL_FEATURES = [
    "tenure",
    "MonthlyCharges",
    "TotalCharges"
]

CATEGORICAL_FEATURES = [
    "Contract",
    "PaymentMethod",
]

FEATURES = NUMERICAL_FEATURES + CATEGORICAL_FEATURES

MODEL_VER = "v1.0"

ID_COLUMN = "customerID"
TARGET_COLUMN = "Churn"

MODEL_PATH = MODELS_DIR / f"churn_model_{MODEL_VER}.joblib"
