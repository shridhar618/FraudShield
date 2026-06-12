"""
=============================================================
  FraudShield AI — Model Training  (train.py)
  Dataset: Credit Card Transactions Fraud Detection
  Kaggle: https://www.kaggle.com/datasets/kartik2112/fraud-detection
=============================================================

BEGINNER GUIDE — READ FIRST
-----------------------------
This script trains an AI model that learns the difference
between a NORMAL and a FRAUDULENT credit card transaction.

The dataset has columns any beginner can understand:
  trans_date  → When did the transaction happen?
  merchant    → Which shop/website was used?
  category    → What type of purchase? (grocery, travel, …)
  amt         → How much money was spent?
  gender      → Male or Female customer?
  city_pop    → How big is the customer's city?
  age         → How old is the customer?
  job         → What does the customer do for work?
  hour        → What time of day (0–23)?
  is_fraud    → 0 = Normal, 1 = Fraud  ← This is what we predict!

WHY THIS DATASET IS BETTER THAN THE OLD ONE:
  Old dataset had columns called V1, V2, … V28 — meaningless!
  This dataset has REAL column names everyone can understand.

HOW TO RUN:
  python backend/model/train.py
"""

import os, sys, json, joblib, warnings
warnings.filterwarnings('ignore')

import numpy  as np
import pandas as pd

from sklearn.model_selection   import train_test_split
from sklearn.preprocessing     import StandardScaler, LabelEncoder
from sklearn.linear_model      import LogisticRegression
from sklearn.ensemble          import RandomForestClassifier
from sklearn.metrics           import (
    classification_report, confusion_matrix,
    precision_score, recall_score, f1_score, roc_auc_score
)
from imblearn.over_sampling    import SMOTE

# ── Paths ─────────────────────────────────────────────────
BASE   = os.path.dirname(os.path.abspath(__file__))
DATA   = os.path.join(BASE, '..', '..', 'data', 'fraudTrain.csv')
OUT    = BASE   # save .pkl files here


# ═══════════════════════════════════════════════════════════
# STEP 1 — LOAD DATA
# ═══════════════════════════════════════════════════════════
def load_data():
    print("\n" + "="*58)
    print("  STEP 1 — Load Dataset")
    print("="*58)

    if not os.path.exists(DATA):
        print(f"  ❌ File not found: {DATA}")
        print("  Download fraudTrain.csv from Kaggle and place in data/")
        sys.exit(1)

    df = pd.read_csv(DATA)
    print(f"  ✅ Loaded {len(df):,} rows × {df.shape[1]} columns")

    fraud  = df['is_fraud'].sum()
    normal = len(df) - fraud
    print(f"  Normal transactions : {normal:,}  ({normal/len(df)*100:.2f}%)")
    print(f"  Fraud  transactions : {fraud:,}   ({fraud/len(df)*100:.2f}%)")
    print(f"\n  Columns: {list(df.columns)}")
    return df


# ═══════════════════════════════════════════════════════════
# STEP 2 — PREPROCESSING
#
# WHAT WE DO:
# 1. Extract useful features from trans_date (day, month)
# 2. Label-encode text columns (category, gender, job, merchant)
#    so the model can work with numbers
# 3. Scale 'amt' (and other numeric cols) to same range
# 4. Train-test split 80/20
# ═══════════════════════════════════════════════════════════
def preprocess(df):
    print("\n" + "="*58)
    print("  STEP 2 — Preprocessing")
    print("="*58)

    df = df.copy()

    # ── 2a. Handle missing values ────────────────────────
    missing = df.isnull().sum().sum()
    print(f"\n  Missing values: {missing}")
    if missing > 0:
        df = df.dropna()

    # ── 2b. Feature engineering from date ───────────────
    # Extract month and day_of_week from the date string.
    # Month matters → holiday season has different fraud patterns.
    # Day of week matters → weekends vs weekdays differ.
    if 'trans_date' in df.columns:
        df['trans_date'] = pd.to_datetime(df['trans_date'], errors='coerce')
        df['month']       = df['trans_date'].dt.month        # 1–12
        df['day_of_week'] = df['trans_date'].dt.dayofweek   # 0=Mon … 6=Sun
        df.drop(columns=['trans_date'], inplace=True)
        print("  Created 'month' and 'day_of_week' from trans_date")

    # ── 2c. Drop columns that are not useful features ────
    # cc_num  → just a unique ID, not a pattern
    # merchant→ too many unique values → label-encode only if manageable
    drop_cols = [c for c in ['cc_num','trans_num','unix_time','merch_lat',
                              'merch_long','first','last','street','zip',
                              'lat','long','dob'] if c in df.columns]
    if drop_cols:
        df.drop(columns=drop_cols, inplace=True)
        print(f"  Dropped non-predictive columns: {drop_cols}")

    # ── 2d. Encode text (categorical) columns ────────────
    # ML models need NUMBERS, not text like "grocery_pos".
    # LabelEncoder converts each unique category to an integer:
    #   "entertainment" → 0, "food_dining" → 1, "gas_transport" → 2 …
    encoders = {}
    cat_cols = df.select_dtypes(include='object').columns.tolist()
    cat_cols = [c for c in cat_cols if c != 'is_fraud']

    for col in cat_cols:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        encoders[col] = le
    print(f"  Label-encoded columns: {cat_cols}")

    # ── 2e. Separate X (features) and y (target) ─────────
    X = df.drop(columns=['is_fraud'])
    y = df['is_fraud']
    feature_names = X.columns.tolist()
    print(f"\n  Features ({len(feature_names)}): {feature_names}")
    print(f"  Target: is_fraud  (0=Normal, 1=Fraud)")

    # ── 2f. Scale numeric features ───────────────────────
    # amt ranges 1–9000; city_pop 500–800000; age 18–75 …
    # StandardScaler brings all to mean=0, std=1 so no single
    # feature dominates just because of its large range.
    scaler = StandardScaler()
    X_scaled = pd.DataFrame(
        scaler.fit_transform(X),
        columns=feature_names
    )

    # ── 2g. Train-test split (80 / 20) ───────────────────
    # stratify=y ensures fraud ratio is preserved in both splits
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"\n  Train: {len(X_train):,}  |  Test: {len(X_test):,}")
    print(f"  Train fraud: {y_train.sum():,}  |  Test fraud: {y_test.sum():,}")

    return X_train, X_test, y_train, y_test, scaler, encoders, feature_names


# ═══════════════════════════════════════════════════════════
# STEP 3 — SMOTE (Balance the classes)
# ═══════════════════════════════════════════════════════════
def apply_smote(X_train, y_train):
    print("\n" + "="*58)
    print("  STEP 3 — SMOTE (Fix Class Imbalance)")
    print("="*58)
    print(f"  Before → Normal: {(y_train==0).sum():,}  Fraud: {y_train.sum():,}")

    smote = SMOTE(random_state=42)
    X_bal, y_bal = smote.fit_resample(X_train, y_train)

    print(f"  After  → Normal: {(y_bal==0).sum():,}  Fraud: {y_bal.sum():,}")
    print(f"  ✅ Classes perfectly balanced!")
    return X_bal, y_bal


# ═══════════════════════════════════════════════════════════
# STEP 4 & 5 — TRAIN MODELS
# ═══════════════════════════════════════════════════════════
def train_models(X_train, y_train):
    print("\n" + "="*58)
    print("  STEP 4 — Train Logistic Regression")
    print("="*58)
    lr = LogisticRegression(max_iter=1000, random_state=42, n_jobs=-1)
    lr.fit(X_train, y_train)
    print("  ✅ Logistic Regression trained")

    print("\n" + "="*58)
    print("  STEP 5 — Train Random Forest (100 trees)")
    print("="*58)
    rf = RandomForestClassifier(
        n_estimators=100, max_depth=12,
        random_state=42, n_jobs=-1,
        class_weight='balanced'
    )
    rf.fit(X_train, y_train)
    print("  ✅ Random Forest trained")

    return lr, rf


# ═══════════════════════════════════════════════════════════
# STEP 6 — EVALUATE
# ═══════════════════════════════════════════════════════════
def evaluate(model, X_test, y_test, name):
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    m = {
        'name':      name,
        'precision': round(precision_score(y_test, y_pred), 4),
        'recall':    round(recall_score(y_test, y_pred),    4),
        'f1':        round(f1_score(y_test, y_pred),        4),
        'auc':       round(roc_auc_score(y_test, y_prob),   4),
    }
    print(f"\n  [{name}]")
    print(f"  Precision : {m['precision']*100:.2f}%")
    print(f"  Recall    : {m['recall']*100:.2f}%")
    print(f"  F1-Score  : {m['f1']*100:.2f}%")
    print(f"  ROC-AUC   : {m['auc']:.4f}")
    print(classification_report(y_test, y_pred, target_names=['Normal','Fraud']))
    return m


# ═══════════════════════════════════════════════════════════
# STEP 7 — RISK LEVEL
# ═══════════════════════════════════════════════════════════
def get_risk_level(prob: float) -> dict:
    score = round(prob * 100, 2)
    if prob < 0.30:
        return {'risk_score': score, 'risk_level': 'Low Risk',    'risk_color': '#06d6a0'}
    elif prob < 0.70:
        return {'risk_score': score, 'risk_level': 'Medium Risk', 'risk_color': '#fbbf24'}
    else:
        return {'risk_score': score, 'risk_level': 'High Risk',   'risk_color': '#f75757'}


# ═══════════════════════════════════════════════════════════
# STEP 8 — SAVE ARTIFACTS
# ═══════════════════════════════════════════════════════════
def save(model, scaler, encoders, feature_names, metrics_list):
    print("\n" + "="*58)
    print("  STEP 8 — Save Model Artifacts")
    print("="*58)
    os.makedirs(OUT, exist_ok=True)
    joblib.dump(model,        os.path.join(OUT, 'fraud_model.pkl'))
    joblib.dump(scaler,       os.path.join(OUT, 'scaler.pkl'))
    joblib.dump(encoders,     os.path.join(OUT, 'encoders.pkl'))
    joblib.dump(feature_names,os.path.join(OUT, 'feature_names.pkl'))
    with open(os.path.join(OUT, 'metrics.json'), 'w') as f:
        json.dump(metrics_list, f, indent=2)
    print("  ✅ fraud_model.pkl, scaler.pkl, encoders.pkl,")
    print("     feature_names.pkl, metrics.json — all saved!")


# ═══════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════
if __name__ == '__main__':
    df = load_data()
    X_train, X_test, y_train, y_test, scaler, encoders, feat_names = preprocess(df)
    X_bal, y_bal = apply_smote(X_train, y_train)
    lr_model, rf_model = train_models(X_bal, y_bal)

    print("\n" + "="*58)
    print("  STEP 6 — Evaluate Both Models")
    print("="*58)
    lr_m = evaluate(lr_model, X_test, y_test, 'Logistic Regression')
    rf_m = evaluate(rf_model, X_test, y_test, 'Random Forest')

    best = rf_model if rf_m['f1'] >= lr_m['f1'] else lr_model
    print(f"\n  🏆 Best Model: {'Random Forest' if rf_m['f1']>=lr_m['f1'] else 'LR'}")
    save(best, scaler, encoders, feat_names, [lr_m, rf_m])
    print("\n  ✅ Done! Run: python backend/app.py")
