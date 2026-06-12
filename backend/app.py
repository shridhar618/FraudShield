"""
FraudShield AI — Production Flask Backend
==========================================
All endpoints fully implemented with proper error handling,
CORS, input validation, and prediction history tracking.
"""

import os, json, joblib, traceback
from datetime import datetime
from collections import deque
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

BASE      = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE, "model")
DIST_DIR  = os.path.join(BASE, "frontend", "dist")

app = Flask(__name__, static_folder=DIST_DIR, static_url_path="")
CORS(app, resources={r"/*": {"origins": "*"}})

# ── In-memory prediction history (last 50) ────────────────────
history: deque = deque(maxlen=50)

# ── Load model artifacts ──────────────────────────────────────
try:
    model         = joblib.load(os.path.join(MODEL_DIR, "fraud_model.pkl"))
    scaler        = joblib.load(os.path.join(MODEL_DIR, "scaler.pkl"))
    encoders      = joblib.load(os.path.join(MODEL_DIR, "encoders.pkl"))
    feature_names = joblib.load(os.path.join(MODEL_DIR, "feature_names.pkl"))
    with open(os.path.join(MODEL_DIR, "metrics.json")) as f:
        metrics = json.load(f)
    MODEL_OK = True
    print(f"✅ Model loaded — features: {feature_names}")
except Exception as e:
    print(f"❌ Model load failed: {e}\n   Run: python backend/model/train.py")
    model = scaler = encoders = feature_names = None
    metrics = []
    MODEL_OK = False


def risk_info(prob: float) -> dict:
    score = round(float(prob) * 100, 2)
    if prob < 0.30:
        return {"risk_score": score, "risk_level": "Low Risk",    "risk_color": "#06d6a0"}
    elif prob < 0.70:
        return {"risk_score": score, "risk_level": "Medium Risk", "risk_color": "#fbbf24"}
    else:
        return {"risk_score": score, "risk_level": "High Risk",   "risk_color": "#f75757"}


def build_input(data: dict) -> pd.DataFrame:
    """Encode + scale a raw JSON payload into model-ready DataFrame."""
    row = {}
    for feat in feature_names:
        val = data.get(feat, "")
        if feat in encoders:
            le  = encoders[feat]
            raw = str(val).strip()
            row[feat] = int(le.transform([raw])[0]) if raw in le.classes_ else 0
        else:
            try:
                row[feat] = float(val)
            except (ValueError, TypeError):
                row[feat] = 0.0
    df_raw    = pd.DataFrame([row])[feature_names]
    df_scaled = pd.DataFrame(scaler.transform(df_raw), columns=feature_names)
    return df_scaled


# ══════════════════════════════════════════════════════════════
# ROUTES
# ══════════════════════════════════════════════════════════════

@app.route("/")
def index():
    try:
        return send_from_directory(DIST_DIR, "index.html")
    except Exception:
        return jsonify({"message": "FraudShield AI API — run `npm run build` to serve React."})


# ── POST /predict ──────────────────────────────────────────────
@app.route("/predict", methods=["POST"])
def predict():
    if not MODEL_OK:
        return jsonify({"error": "Model not loaded. Run model/train.py first."}), 503

    data = request.get_json(force=True, silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON body."}), 400

    # Validate required fields
    required = ["amt", "category"]
    missing  = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing required fields: {missing}"}), 400

    try:
        input_df   = build_input(data)
        prob       = float(model.predict_proba(input_df)[0][1])
        prediction = int(model.predict(input_df)[0])
        risk       = risk_info(prob)

        # Feature importances
        top_features = []
        if hasattr(model, "feature_importances_"):
            imp = model.feature_importances_
            idx = np.argsort(imp)[::-1][:5]
            top_features = [
                {"name": feature_names[i], "importance": round(float(imp[i]) * 100, 2)}
                for i in idx
            ]

        result = {
            "fraud_prediction": prediction,
            "fraud_label":      "FRAUD DETECTED" if prediction == 1 else "LEGITIMATE",
            "probability":      round(prob, 4),
            "model_used":       "Random Forest (100 trees)",
            "top_features":     top_features,
            "timestamp":        datetime.now().isoformat(),
            **risk,
        }

        # Store in history
        history.appendleft({
            "id":          len(history) + 1,
            "timestamp":   result["timestamp"],
            "amt":         data.get("amt", 0),
            "category":    data.get("category", ""),
            "hour":        data.get("hour", 0),
            "fraud":       prediction,
            "risk_level":  risk["risk_level"],
            "risk_score":  risk["risk_score"],
            "probability": round(prob, 4),
        })

        return jsonify(result)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ── GET /metrics ───────────────────────────────────────────────
@app.route("/metrics", methods=["GET"])
def get_metrics():
    return jsonify(metrics)


# ── GET /history ───────────────────────────────────────────────
@app.route("/history", methods=["GET"])
def get_history():
    return jsonify(list(history))


# ── DELETE /history ────────────────────────────────────────────
@app.route("/history", methods=["DELETE"])
def clear_history():
    history.clear()
    return jsonify({"message": "History cleared."})


# ── GET /options ───────────────────────────────────────────────
@app.route("/options", methods=["GET"])
def options():
    """Returns all valid input values for every dropdown."""
    result = {}
    for col, le in encoders.items():
        result[col] = list(le.classes_)
    result["months"]   = list(range(1, 13))
    result["hours"]    = list(range(0, 24))
    result["days"]     = list(range(0, 7))
    result["day_names"]= ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
    result["month_names"] = ["Jan","Feb","Mar","Apr","May","Jun",
                              "Jul","Aug","Sep","Oct","Nov","Dec"]
    return jsonify(result)


# ── GET /demo ──────────────────────────────────────────────────
@app.route("/demo", methods=["GET"])
def demo():
    return jsonify({
        "fraud_sample": {
            "merchant": "merchant_5",  "category": "shopping_net",
            "amt": 2300.00, "gender": "M", "city_pop": 8500,
            "age": 28, "job": "Driver", "hour": 2, "month": 11, "day_of_week": 6
        },
        "normal_sample": {
            "merchant": "merchant_120", "category": "grocery_pos",
            "amt": 45.50,  "gender": "F", "city_pop": 350000,
            "age": 42, "job": "Teacher","hour": 14, "month": 6,  "day_of_week": 2
        }
    })


# ── GET /stats ─────────────────────────────────────────────────
@app.route("/stats", methods=["GET"])
def stats():
    """Dataset-level statistics for the dashboard."""
    return jsonify({
        "total_transactions": 10000,
        "total_fraud":        500,
        "total_normal":       9500,
        "fraud_rate":         5.0,
        "features":           feature_names or [],
        "model_type":         "Random Forest",
        "n_estimators":       100,
        "best_auc":           max((m["auc"] for m in metrics), default=0),
        "best_f1":            max((m["f1"] for m in metrics), default=0),
    })


# ── GET /health ────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status":       "running",
        "model_loaded": MODEL_OK,
        "features":     feature_names or [],
        "history_count": len(history),
    })


if __name__ == "__main__":
    host = os.environ.get("FRAUDSHIELD_HOST", "127.0.0.1")
    port = int(os.environ.get("FRAUDSHIELD_PORT", "5001"))
    debug = os.environ.get("FRAUDSHIELD_DEBUG", "1") == "1"

    print("🚀 FraudShield AI API starting...")
    app.run(debug=debug, host=host, port=port, use_reloader=False)
