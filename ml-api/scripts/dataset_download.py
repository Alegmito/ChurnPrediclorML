import kagglehub
from pathlib import Path
from config import *

path = kagglehub.dataset_download(
        "blastchar/telco-customer-churn",
        #cwd as output dir
        output_dir=f"{BASE_DIR}/data/Downloaded",  # You can specify a different output directory if needed
        )

print(f"Dataset downloaded to: {path}")
