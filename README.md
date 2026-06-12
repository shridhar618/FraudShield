# 🛡️ FraudShield AI — Professional Credit Card Fraud Detection
### MCA Final Year Project · React + Flask + Random Forest

---

## 📁 Project Structure

```
fraudshield_pro/
├── data/
│   └── fraudTrain.csv              ← Dataset (included!)
│
├── backend/
│   ├── app.py                      ← Flask API (run this)
│   └── model/
│       ├── train.py                ← ML training script
│       ├── fraud_model.pkl         ← Pre-trained Random Forest ✅
│       ├── scaler.pkl              ← Saved StandardScaler ✅
│       ├── encoders.pkl            ← Saved LabelEncoders ✅
│       ├── feature_names.pkl       ← Feature column order ✅
│       └── metrics.json            ← Model performance ✅
│
├── src/                            ← React frontend
│   ├── App.jsx                     ← Root + routing
│   ├── api.js                      ← Centralised API client
│   ├── index.css                   ← Glassmorphism design system
│   └── components/
│       ├── NavBar.jsx
│       ├── Analyzer.jsx            ← Transaction form + predictions
│       ├── Dashboard.jsx           ← Live charts + model stats
│       ├── History.jsx             ← Prediction log + CSV export
│       ├── Learn.jsx               ← Beginner guide + viva cheat sheet
│       ├── UseCases.jsx            ← Real-world applications
│       └── useToast.js             ← Reusable toast notifications
│
├── index.html
├── package.json
├── vite.config.js
├── requirements.txt
└── README.md
```

---

## 🚀 Quick Start (3 steps)

### Step 1 — Install Python dependencies
```bash
pip install -r requirements.txt
```

### Step 2 — Start Flask API
```bash
python backend/app.py
```
The model is already pre-trained! You'll see:
```
✅ Model loaded — features: ['merchant', 'category', 'amt', ...]
🚀 FraudShield AI API starting...
 * Running on http://0.0.0.0:5000
```

### Step 3 — Start React frontend (new terminal)
```bash
npm install
npm run dev
```
Open: **http://localhost:5173**

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/predict` | Predict fraud for a transaction |
| GET  | `/metrics` | Model performance metrics |
| GET  | `/history` | Last 50 predictions |
| DELETE | `/history` | Clear prediction history |
| GET  | `/options` | Valid dropdown values |
| GET  | `/demo` | Sample transactions |
| GET  | `/stats` | Dataset statistics |
| GET  | `/health` | API health check |

### POST /predict — Request body:
```json
{
  "merchant": "merchant_5",
  "category": "shopping_net",
  "amt": 2300.00,
  "gender": "M",
  "city_pop": 8500,
  "age": 28,
  "job": "Driver",
  "hour": 2,
  "month": 11,
  "day_of_week": 6
}
```

### Response:
```json
{
  "fraud_prediction": 1,
  "fraud_label": "FRAUD DETECTED",
  "probability": 0.9412,
  "risk_score": 94.1,
  "risk_level": "High Risk",
  "risk_color": "#ef4444",
  "model_used": "Random Forest (100 trees)",
  "top_features": [{"name": "amt", "importance": 32.5}, ...],
  "timestamp": "2024-11-14T02:13:45.123456"
}
```

---

## 🎨 UI Features

| Tab | What it does |
|-----|-------------|
| **Analyzer** | Form with validation, fraud hints, animated gauge, feature importance |
| **Dashboard** | Live charts: class distribution, model comparison, fraud by hour, fraud by category |
| **History** | Table of all session predictions with filter, refresh, CSV export, clear |
| **Learn** | Accordion guide covering every ML concept with viva cheat sheet |
| **Use Cases** | 6 real-world applications with feature-to-fraud mapping |

---

## 🌐 Deploy on PythonAnywhere (Free)

```bash
# 1. Upload project files
# 2. Bash console:
pip install --user flask flask-cors scikit-learn imbalanced-learn pandas numpy joblib

# 3. Build React (optional, Flask can serve the pre-built dist)
npm install && npm run build

# 4. Web tab → Manual config → Python 3.10
# WSGI file:
import sys
sys.path.insert(0, '/home/USERNAME/fraudshield_pro/backend')
from app import app as application

# 5. Reload → live at USERNAME.pythonanywhere.com
```

---

## 📊 Model Performance

| Model | Precision | Recall | F1-Score | ROC-AUC |
|-------|-----------|--------|----------|---------|
| Logistic Regression | 58.58% | 99.00% | 73.61% | 0.9932 |
| **Random Forest ★** | **100%** | **100%** | **100%** | **1.0000** |

---

## 🧠 Viva Quick Reference

| Q | A |
|---|---|
| Dataset? | kartik2112/fraud-detection — 10,000 rows, readable columns |
| SMOTE? | Balances 9,500 normal vs 500 fraud by creating synthetic samples |
| Why RF? | 100 trees vote; captures non-linear patterns LR misses |
| Not accuracy? | 95% by saying Normal always — catches 0 fraud! Use Recall + F1 |
| AUC 1.0000? | Perfect separation — model ranks every fraud above every normal |
| Risk levels? | 0–30 Low, 30–70 Medium, 70–100 High — maps probability to action |
