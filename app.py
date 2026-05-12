from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import jwt

app = Flask(__name__)
CORS(app)

SECRET = "secret123"

# ✅ Default user
users = [
    {"email": "test@test.com", "password": "123"}
]

meetings = []

CATEGORY_COLORS = {
    "Work": "#3b82f6",
    "Personal": "#22c55e",
    "Urgent": "#ef4444"
}

# 🔐 Token verify
def verify_token(req):
    token = req.headers.get("Authorization")
    if not token:
        return None
    try:
        data = jwt.decode(token, SECRET, algorithms=["HS256"])
        return data["email"]
    except:
        return None

# 🧠 Weekend logic
def adjust(date):
    if date.weekday() == 5:
        return date + timedelta(days=2)
    if date.weekday() == 6:
        return date + timedelta(days=1)
    return date

# ⚠️ Conflict check
def conflict(user, new_time):
    for m in meetings:
        if m["user"] == user:
            old = datetime.fromisoformat(m["scheduledTime"])
            if abs((old - new_time).total_seconds()) < 3600:
                return True
    return False

# 🔐 Login
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    for u in users:
        if u["email"] == data["email"] and u["password"] == data["password"]:
            token = jwt.encode({"email": u["email"]}, SECRET, algorithm="HS256")
            return jsonify({"token": token})
    return jsonify({"error": "Invalid"}), 401

# 📅 Get meetings
@app.route("/meetings")
def get_meetings():
    user = verify_token(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 403
    return jsonify({"meetings": [m for m in meetings if m["user"] == user]})

# ➕ Add meeting
@app.route("/schedule", methods=["POST"])
def schedule():
    user = verify_token(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.json
    dt = adjust(datetime.fromisoformat(data["datetime"]))

    if conflict(user, dt):
        return jsonify({"error": "Conflict"}), 400

    meeting = {
        "id": int(datetime.now().timestamp()*1000),
        "title": data["title"],
        "scheduledTime": dt.isoformat(),
        "category": data["category"],
        "color": CATEGORY_COLORS[data["category"]],
        "user": user
    }

    meetings.append(meeting)
    return jsonify(meeting)

# 🔄 Reschedule
@app.route("/reschedule/<int:id>", methods=["PUT"])
def reschedule(id):
    user = verify_token(request)
    data = request.json
    new_time = adjust(datetime.fromisoformat(data["newStart"]))

    for m in meetings:
        if m["id"] == id and m["user"] == user:
            m["scheduledTime"] = new_time.isoformat()
            return jsonify(m)

    return jsonify({"error": "Not found"}), 404

# 🗑 Delete
@app.route("/delete/<int:id>", methods=["DELETE"])
def delete(id):
    user = verify_token(request)
    global meetings
    meetings = [m for m in meetings if not (m["id"] == id and m["user"] == user)]
    return jsonify({"msg": "deleted"})

if __name__ == "__main__":
    app.run(debug=True, port=5000)