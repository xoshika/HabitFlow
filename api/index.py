import os
import uuid
from datetime import datetime, date
from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_mail import Mail, Message
import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Vercel path handling
BASE_DIR = Path(__file__).resolve().parent
DATABASE_URL = os.getenv("DATABASE_URL")

app = Flask(__name__)
CORS(app)

# Email Configuration
app.config["MAIL_SERVER"] = os.getenv("MAIL_SERVER", "smtp.gmail.com")
app.config["MAIL_PORT"] = int(os.getenv("MAIL_PORT", 587))
app.config["MAIL_USE_TLS"] = os.getenv("MAIL_USE_TLS", "True") == "True"
app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME")
app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD")
app.config["MAIL_DEFAULT_SENDER"] = os.getenv("MAIL_DEFAULT_SENDER")

mail = Mail(app)

class Database:
    def __init__(self, url):
        if not url:
            # Fallback for local dev if DATABASE_URL is missing
            url = f"sqlite:///{BASE_DIR}/habit_tracker.db"
        self.url = url
        self.is_pg = url.startswith("postgresql://") or url.startswith("postgres://")

    def get_connection(self):
        if self.is_pg:
            # Fix for Render/Neon postgres URLs that start with postgres://
            updated_url = self.url.replace("postgres://", "postgresql://", 1)
            conn = psycopg2.connect(updated_url, cursor_factory=RealDictCursor)
            conn.autocommit = True
            return conn
        else:
            db_path = self.url.replace("sqlite:///", "")
            conn = sqlite3.connect(db_path)
            conn.row_factory = sqlite3.Row
            return conn

    def execute(self, conn, query, params=None):
        if params is None:
            params = []
        
        # Dialect adjustments
        if self.is_pg:
            query = query.replace("?", "%s")
            # SQLite specific date functions to PG
            query = query.replace("date('now', '-7 day')", "CURRENT_DATE - INTERVAL '7 days'")
            query = query.replace("date('now')", "CURRENT_DATE")
            query = query.replace("datetime('now')", "CURRENT_TIMESTAMP")
        else:
            # PG specific to SQLite if any (e.g. INTERVAL)
            # For now we assume queries are written in SQLite-ish and adjusted for PG
            pass

        cur = conn.cursor() if self.is_pg else conn.cursor()
        cur.execute(query, params)
        return cur

    def fetchall(self, cur):
        if self.is_pg:
            return cur.fetchall()
        else:
            return cur.fetchall()

    def fetchone(self, cur):
        if self.is_pg:
            return cur.fetchone()
        else:
            return cur.fetchone()

    def get_lastrowid(self, cur):
        if self.is_pg:
            # This requires the query to have RETURNING id, 
            # or we can try to get it if we know the table.
            # For simplicity, we'll try to use cur.fetchone() if it was an INSERT ... RETURNING
            try:
                row = cur.fetchone()
                return row['id'] if row else None
            except:
                return None
        else:
            return cur.lastrowid

db = Database(DATABASE_URL)

def init_db():
    if not db.is_pg:
        db_path = Path(db.url.replace("sqlite:///", ""))
        if not db_path.exists():
            with db.get_connection() as conn:
                schema_path = BASE_DIR / "schema.sql"
                if schema_path.exists():
                    with open(schema_path, "r", encoding="utf-8") as f:
                        conn.executescript(f.read())
    else:
        # For PG, check if tables exist
        try:
            with db.get_connection() as conn:
                cur = conn.cursor()
                cur.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')")
                exists = cur.fetchone()['exists']
                if not exists:
                    schema_path = BASE_DIR / "schema_pg.sql"
                    if schema_path.exists():
                        with open(schema_path, "r", encoding="utf-8") as f:
                            cur.execute(f.read())
                    else:
                        print(f"Warning: Schema file not found at {schema_path}")
        except Exception as e:
            print(f"Database connection/init error: {e}")

init_db()

@app.route("/api/health")
def health():
    return jsonify({
        "status": "healthy",
        "database": "connected" if db.is_pg else "sqlite (local)",
        "env": "production" if os.getenv("VERCEL") else "development"
    })

@app.errorhandler(Exception)
def handle_exception(e):
    # Pass through HTTP errors
    if hasattr(e, "code"):
        return jsonify({"error": str(e)}), e.code
    # Handle non-HTTP errors
    print(f"Unhandled Exception: {e}")
    return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

@app.post("/api/auth/login")
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    conn = db.get_connection()
    try:
        cur = db.execute(conn, 
            "SELECT id, first_name, middle_name, last_name, email, is_verified FROM users WHERE email = ? AND password = ?",
            (email, password),
        )
        user = db.fetchone(cur)
    finally:
        conn.close()

    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    if not user["is_verified"]:
        return jsonify({"error": "Please verify your email before logging in. Check your console for the link."}), 403

    full_name = f"{user['first_name']} {user['middle_name']} {user['last_name']}".replace("  ", " ").strip()
    return jsonify(
        {
            "user": {
                "id": user["id"],
                "first_name": user["first_name"],
                "middle_name": user["middle_name"],
                "last_name": user["last_name"],
                "name": full_name,
                "email": user["email"],
            }
        }
    )


@app.post("/api/auth/signup")
def signup():
    data = request.get_json() or {}
    first_name = (data.get("first_name") or "").strip()
    middle_name = (data.get("middle_name") or "").strip()
    last_name = (data.get("last_name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not first_name or not last_name or not email or not password:
        return jsonify({"error": "First name, last name, email, and password are required"}), 400

    token = uuid.uuid4().hex
    conn = db.get_connection()
    try:
        cur = db.execute(conn, "SELECT id FROM users WHERE email = ?", (email,))
        existing = db.fetchone(cur)
        if existing:
            return jsonify({"error": "Email is already registered"}), 409

        sql = "INSERT INTO users (first_name, middle_name, last_name, email, password, is_verified, verification_token) VALUES (?, ?, ?, ?, ?, 0, ?)"
        if db.is_pg:
            sql += " RETURNING id"
        
        cur = db.execute(conn, sql, (first_name, middle_name, last_name, email, password, token))
        if not db.is_pg:
            conn.commit()
        user_id = db.get_lastrowid(cur)
    finally:
        conn.close()

    # Send verification email
    try:
        # Determine base URL for verification link
        vercel_url = os.getenv("VERCEL_URL")
        if vercel_url:
            # Vercel doesn't include https:// in the variable
            base_url = f"https://{vercel_url}"
        else:
            base_url = "http://localhost:5173"

        verify_url = f"{base_url}/verify?token={token}"
        msg = Message(
            "Verify your HabitFlow account",
            recipients=[email],
            body=f"Hi {first_name},\n\nWelcome to HabitFlow! Please verify your email by clicking the link below:\n\n{verify_url}\n\nIf you did not create an account, please ignore this email."
        )
        mail.send(msg)
        print(f"Verification email sent to {email}")
    except Exception as e:
        print(f"Error sending email: {e}")

    full_name = f"{first_name} {middle_name} {last_name}".replace("  ", " ").strip()
    return jsonify({"user": {"id": user_id, "first_name": first_name, "middle_name": middle_name, "last_name": last_name, "name": full_name, "email": email}}), 201


@app.get("/api/auth/verify")
def verify():
    token = request.args.get("token")
    if not token:
        return jsonify({"error": "Token is required"}), 400
    
    conn = db.get_connection()
    try:
        cur = db.execute(conn, "SELECT id FROM users WHERE verification_token = ?", (token,))
        user = db.fetchone(cur)
        if not user:
            return jsonify({"error": "Invalid or expired token"}), 400
        
        db.execute(conn, "UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?", (user["id"],))
        if not db.is_pg:
            conn.commit()
    finally:
        conn.close()
    
    return jsonify({"message": "Email verified successfully! You can now log in."})


@app.get("/api/habit-categories")
def list_habit_categories():
    conn = db.get_connection()
    try:
        cur = db.execute(conn, "SELECT id, name FROM habit_categories ORDER BY name ASC")
        rows = db.fetchall(cur)
    finally:
        conn.close()

    return jsonify([{"id": r["id"], "name": r["name"]} for r in rows])


@app.post("/api/habit-categories")
def create_habit_category():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Category name is required"}), 400

    conn = db.get_connection()
    try:
        sql = "INSERT INTO habit_categories (name) VALUES (?)"
        if db.is_pg:
            sql += " RETURNING id"
        
        cur = db.execute(conn, sql, (name,))
        if not db.is_pg:
            conn.commit()
        category_id = db.get_lastrowid(cur)
    except (sqlite3.IntegrityError, psycopg2.IntegrityError):
        return jsonify({"error": "A category with this name already exists"}), 409
    finally:
        conn.close()

    return jsonify({"id": category_id, "name": name}), 201


@app.get("/api/profile/<int:user_id>")
def get_profile(user_id: int):
    conn = db.get_connection()
    try:
        cur = db.execute(conn, 
            "SELECT id, first_name, middle_name, last_name, email, created_at FROM users WHERE id = ?",
            (user_id,),
        )
        user = db.fetchone(cur)

        if not user:
            return jsonify({"error": "User not found"}), 404

        stats_query = """
            SELECT
                (SELECT COUNT(*) FROM habits h WHERE h.user_id = u.id) AS total_habits,
                (SELECT COUNT(*) FROM habit_entries e
                 JOIN habits h2 ON e.habit_id = h2.id
                 WHERE h2.user_id = u.id
                ) AS total_checkins
            FROM users u
            WHERE u.id = ?
        """
        cur = db.execute(conn, stats_query, (user_id,))
        stats = db.fetchone(cur)
    finally:
        conn.close()

    full_name = f"{user['first_name']} {user['middle_name']} {user['last_name']}".replace("  ", " ").strip()
    return jsonify(
        {
            "id": user["id"],
            "first_name": user["first_name"],
            "middle_name": user["middle_name"],
            "last_name": user["last_name"],
            "name": full_name,
            "email": user["email"],
            "created_at": user["created_at"],
            "stats": {
                "total_habits": stats["total_habits"],
                "total_checkins": stats["total_checkins"],
            },
        }
    )


@app.get("/api/habits")
def list_habits():
    user_id = request.args.get("user_id", type=int)
    search = request.args.get("search", "", type=str)
    is_active = request.args.get("is_active")
    category_id = request.args.get("category_id", type=int)

    query = """
        SELECT h.id, h.name, h.description, h.is_active, h.category_id,
               c.name AS category_name,
               g.target_per_week
        FROM habits h
        LEFT JOIN habit_categories c ON h.category_id = c.id
        LEFT JOIN habit_goals g ON g.habit_id = h.id
        WHERE h.user_id = ?
    """
    params = [user_id]

    if search:
        query += " AND (h.name LIKE ? OR h.description LIKE ?)"
        like = f"%{search}%"
        params.extend([like, like])

    if is_active is not None:
        query += " AND h.is_active = ?"
        params.append(1 if is_active == "true" else 0)

    if category_id is not None:
        query += " AND h.category_id = ?"
        params.append(category_id)

    query += " ORDER BY h.created_at DESC, h.id DESC"

    conn = db.get_connection()
    try:
        cur = db.execute(conn, query, params)
        rows = db.fetchall(cur)
    finally:
        conn.close()

    habits = [
        {
            "id": r["id"],
            "name": r["name"],
            "description": r["description"],
            "is_active": bool(r["is_active"]),
            "category_id": r["category_id"],
            "category": r["category_name"],
            "target_per_week": r["target_per_week"],
        }
        for r in rows
    ]

    return jsonify(habits)


@app.post("/api/habits")
def create_habit():
    data = request.get_json() or {}
    user_id = data.get("user_id")
    name = data.get("name")
    description = data.get("description", "")
    category_id = data.get("category_id")
    target_per_week = data.get("target_per_week")
    is_active = data.get("is_active", True)

    conn = db.get_connection()
    try:
        sql = """
            INSERT INTO habits (user_id, name, description, category_id, is_active)
            VALUES (?, ?, ?, ?, ?)
        """
        if db.is_pg:
            sql += " RETURNING id"
        
        cur = db.execute(conn, sql, (user_id, name, description, category_id, int(bool(is_active))))
        habit_id = db.get_lastrowid(cur)

        if target_per_week is not None:
            db.execute(conn, 
                """
                INSERT INTO habit_goals (habit_id, target_per_week)
                VALUES (?, ?)
                """,
                (habit_id, target_per_week),
            )

        if not db.is_pg:
            conn.commit()
    finally:
        conn.close()

    return jsonify({"id": habit_id}), 201


@app.put("/api/habits/<int:habit_id>")
def update_habit(habit_id: int):
    data = request.get_json() or {}
    name = data.get("name")
    description = data.get("description")
    category_id = data.get("category_id")
    is_active = data.get("is_active")
    target_per_week = data.get("target_per_week")

    conn = db.get_connection()
    try:
        db.execute(conn, 
            """
            UPDATE habits
            SET name = ?, description = ?, category_id = ?, is_active = ?
            WHERE id = ?
            """,
            (name, description, category_id, int(bool(is_active)), habit_id),
        )

        if target_per_week is not None:
            if db.is_pg:
                db.execute(conn, 
                    """
                    INSERT INTO habit_goals (habit_id, target_per_week)
                    VALUES (?, ?)
                    ON CONFLICT(habit_id) DO UPDATE SET target_per_week = EXCLUDED.target_per_week
                    """,
                    (habit_id, target_per_week),
                )
            else:
                db.execute(conn, 
                    """
                    INSERT INTO habit_goals (habit_id, target_per_week)
                    VALUES (?, ?)
                    ON CONFLICT(habit_id) DO UPDATE SET target_per_week = excluded.target_per_week
                    """,
                    (habit_id, target_per_week),
                )

        if not db.is_pg:
            conn.commit()
    finally:
        conn.close()

    return jsonify({"status": "ok"})


@app.delete("/api/habits/<int:habit_id>")
def delete_habit(habit_id: int):
    conn = db.get_connection()
    try:
        db.execute(conn, "DELETE FROM habits WHERE id = ?", (habit_id,))
        if not db.is_pg:
            conn.commit()
    finally:
        conn.close()
    return jsonify({"status": "deleted"})


@app.post("/api/habits/<int:habit_id>/checkins")
def create_checkin(habit_id: int):
    data = request.get_json() or {}
    entry_date_str = data.get("entry_date")
    entry_date = (
        date.fromisoformat(entry_date_str) if entry_date_str else date.today()
    )

    conn = db.get_connection()
    try:
        db.execute(conn, 
            """
            INSERT INTO habit_entries (habit_id, entry_date)
            VALUES (?, ?)
            """,
            (habit_id, entry_date.isoformat()),
        )
        if not db.is_pg:
            conn.commit()
    finally:
        conn.close()

    return jsonify({"status": "ok"})


@app.get("/api/dashboard/summary")
def dashboard_summary():
    user_id = request.args.get("user_id", type=int)

    conn = db.get_connection()
    try:
        # Aggregations: COUNT, SUM, MAX, AVG
        totals_query = """
            SELECT
                COUNT(DISTINCT h.id) AS total_habits,
                SUM(CASE WHEN h.is_active = 1 THEN 1 ELSE 0 END) AS active_habits,
                COUNT(e.id) AS total_checkins,
                AVG(g.target_per_week) AS avg_target_per_week,
                MAX(e.entry_date) AS last_checkin_date
            FROM habits h
            LEFT JOIN habit_entries e ON e.habit_id = h.id
            LEFT JOIN habit_goals g ON g.habit_id = h.id
            WHERE h.user_id = ?
        """
        cur = db.execute(conn, totals_query, (user_id,))
        totals = db.fetchone(cur)

        # CTE example: weekly completion rate per habit
        weekly_query = """
            WITH recent_week AS (
                SELECT
                    h.id AS habit_id,
                    h.name,
                    g.target_per_week,
                    COUNT(e.id) AS actual_per_week
                FROM habits h
                LEFT JOIN habit_goals g ON g.habit_id = h.id
                LEFT JOIN habit_entries e ON e.habit_id = h.id
                    AND e.entry_date >= date('now', '-7 day')
                WHERE h.user_id = ?
                GROUP BY h.id, h.name, g.target_per_week
            )
            SELECT
                habit_id,
                name,
                target_per_week,
                actual_per_week,
                CASE
                    WHEN target_per_week IS NULL OR target_per_week = 0 THEN NULL
                    ELSE ROUND(100.0 * actual_per_week / target_per_week, 1)
                END AS completion_rate
            FROM recent_week
        """
        cur = db.execute(conn, weekly_query, (user_id,))
        weekly = db.fetchall(cur)
    finally:
        conn.close()

    return jsonify(
        {
            "totals": {
                "total_habits": totals["total_habits"],
                "active_habits": totals["active_habits"] or 0,
                "total_checkins": totals["total_checkins"],
                "avg_target_per_week": round(float(totals["avg_target_per_week"]), 1)
                if totals["avg_target_per_week"] is not None
                else None,
                "last_checkin_date": totals["last_checkin_date"].isoformat() if isinstance(totals["last_checkin_date"], (date, datetime)) else totals["last_checkin_date"],
            },
            "weekly": [
                {
                    "habit_id": r["habit_id"],
                    "name": r["name"],
                    "target_per_week": r["target_per_week"],
                    "actual_per_week": r["actual_per_week"],
                    "completion_rate": float(r["completion_rate"]) if r["completion_rate"] is not None else None,
                }
                for r in weekly
            ],
        }
    )


@app.get("/api/reports/habits")
def reports_habits():
    user_id = request.args.get("user_id", type=int)
    search = request.args.get("search", "", type=str)
    category_id = request.args.get("category_id", type=int)
    is_active = request.args.get("is_active")

    query = """
            SELECT
                h.id AS habit_id,
                h.name AS habit_name,
                h.is_active AS is_active,
                c.name AS category_name,
                g.target_per_week AS target_per_week,
                COUNT(e.id) AS total_checkins,
                MIN(e.entry_date) AS first_checkin,
                MAX(e.entry_date) AS last_checkin,
                (
                    SELECT COUNT(*)
                    FROM habit_entries e3
                    WHERE e3.habit_id = h.id
                      AND e3.entry_date >= date('now', '-7 day')
                ) AS checkins_last_7_days,
                (
                    SELECT AVG(daily_count)
                    FROM (
                        SELECT COUNT(*) AS daily_count
                        FROM habit_entries e2
                        WHERE e2.habit_id = h.id
                        GROUP BY e2.entry_date
                    ) t
                ) AS avg_per_day
            FROM habits h
            LEFT JOIN habit_categories c ON c.id = h.category_id
            LEFT JOIN habit_goals g ON g.habit_id = h.id
            LEFT JOIN habit_entries e ON e.habit_id = h.id
            LEFT JOIN users u ON u.id = h.user_id
            WHERE u.id = ?
    """
    params = [user_id]

    if search:
        query += " AND (h.name LIKE ? OR c.name LIKE ?)"
        like = f"%{search}%"
        params.extend([like, like])

    if category_id is not None:
        query += " AND h.category_id = ?"
        params.append(category_id)

    if is_active is not None:
        query += " AND h.is_active = ?"
        params.append(1 if is_active == "true" else 0)

    query += """
            GROUP BY h.id, h.name, h.is_active, c.name, g.target_per_week
            ORDER BY total_checkins DESC, h.name ASC
    """

    conn = db.get_connection()
    try:
        cur = db.execute(conn, query, params)
        rows = db.fetchall(cur)
    finally:
        conn.close()

    report = []
    for r in rows:
        first_checkin = r["first_checkin"]
        last_checkin = r["last_checkin"]
        
        # Handle date objects from PG or strings from SQLite
        if isinstance(first_checkin, (date, datetime)):
            first_date = first_checkin
        elif first_checkin:
            first_date = datetime.fromisoformat(first_checkin)
        else:
            first_date = None

        if isinstance(last_checkin, (date, datetime)):
            last_date = last_checkin
        elif last_checkin:
            last_date = datetime.fromisoformat(last_checkin)
        else:
            last_date = None

        period_days = (last_date - first_date).days + 1 if first_date and last_date else None
        
        report.append({
            "habit_id": r["habit_id"],
            "habit_name": r["habit_name"],
            "is_active": bool(r["is_active"]),
            "category_name": r["category_name"],
            "target_per_week": r["target_per_week"],
            "total_checkins": r["total_checkins"],
            "first_checkin": first_date.isoformat() if first_date else None,
            "last_checkin": last_date.isoformat() if last_date else None,
            "checkins_last_7_days": r["checkins_last_7_days"],
            "period_days": period_days,
            "completion_rate": (
                round(100.0 * r["checkins_last_7_days"] / r["target_per_week"], 1)
                if r["target_per_week"] not in (None, 0)
                else None
            ),
            "avg_per_day": float(r["avg_per_day"]) if r["avg_per_day"] is not None else None,
        })

    return jsonify(report)


if __name__ == "__main__":
    app.run(debug=True)

