from datetime import datetime, date

from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "habit_tracker.db"


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db_connection() as conn:
        with conn:
            conn.executescript(
                (BASE_DIR / "schema.sql").read_text(encoding="utf-8")
            )


app = Flask(__name__)
CORS(app)


if not DB_PATH.exists():
    init_db()


@app.post("/api/auth/login")
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    with get_db_connection() as conn:
        cur = conn.execute(
            "SELECT id, name, email FROM users WHERE email = ? AND password = ?",
            (email, password),
        )
        user = cur.fetchone()

    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    return jsonify(
        {
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
            }
        }
    )


@app.post("/api/auth/signup")
def signup():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required"}), 400

    with get_db_connection() as conn:
        existing = conn.execute(
            "SELECT id FROM users WHERE email = ?",
            (email,),
        ).fetchone()
        if existing:
            return jsonify({"error": "Email is already registered"}), 409

        cur = conn.execute(
            """
            INSERT INTO users (name, email, password)
            VALUES (?, ?, ?)
            """,
            (name, email, password),
        )
        conn.commit()
        user_id = cur.lastrowid

    return jsonify({"user": {"id": user_id, "name": name, "email": email}}), 201


@app.get("/api/habit-categories")
def list_habit_categories():
    with get_db_connection() as conn:
        rows = conn.execute(
            "SELECT id, name FROM habit_categories ORDER BY name ASC"
        ).fetchall()

    return jsonify([{"id": r["id"], "name": r["name"]} for r in rows])


@app.post("/api/habit-categories")
def create_habit_category():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Category name is required"}), 400

    with get_db_connection() as conn:
        try:
            cur = conn.execute(
                "INSERT INTO habit_categories (name) VALUES (?)",
                (name,),
            )
            conn.commit()
            category_id = cur.lastrowid
        except sqlite3.IntegrityError:
            return jsonify({"error": "A category with this name already exists"}), 409

    return jsonify({"id": category_id, "name": name}), 201


@app.get("/api/profile/<int:user_id>")
def get_profile(user_id: int):
    with get_db_connection() as conn:
        user = conn.execute(
            "SELECT id, name, email, created_at FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()

        if not user:
            return jsonify({"error": "User not found"}), 404

        # Example of aggregation + subquery in profile stats
        stats = conn.execute(
            """
            SELECT
                (SELECT COUNT(*) FROM habits h WHERE h.user_id = u.id) AS total_habits,
                (SELECT COUNT(*) FROM habit_entries e
                 JOIN habits h2 ON e.habit_id = h2.id
                 WHERE h2.user_id = u.id
                ) AS total_checkins
            FROM users u
            WHERE u.id = ?
            """,
            (user_id,),
        ).fetchone()

    return jsonify(
        {
            "id": user["id"],
            "name": user["name"],
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

    with get_db_connection() as conn:
        rows = conn.execute(query, params).fetchall()

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

    with get_db_connection() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO habits (user_id, name, description, category_id, is_active)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user_id, name, description, category_id, int(bool(is_active))),
        )
        habit_id = cur.lastrowid

        if target_per_week is not None:
            cur.execute(
                """
                INSERT INTO habit_goals (habit_id, target_per_week)
                VALUES (?, ?)
                """,
                (habit_id, target_per_week),
            )

        conn.commit()

    return jsonify({"id": habit_id}), 201


@app.put("/api/habits/<int:habit_id>")
def update_habit(habit_id: int):
    data = request.get_json() or {}
    name = data.get("name")
    description = data.get("description")
    category_id = data.get("category_id")
    is_active = data.get("is_active")
    target_per_week = data.get("target_per_week")

    with get_db_connection() as conn:
        conn.execute(
            """
            UPDATE habits
            SET name = ?, description = ?, category_id = ?, is_active = ?
            WHERE id = ?
            """,
            (name, description, category_id, int(bool(is_active)), habit_id),
        )

        if target_per_week is not None:
            conn.execute(
                """
                INSERT INTO habit_goals (habit_id, target_per_week)
                VALUES (?, ?)
                ON CONFLICT(habit_id) DO UPDATE SET target_per_week = excluded.target_per_week
                """,
                (habit_id, target_per_week),
            )

        conn.commit()

    return jsonify({"status": "ok"})


@app.delete("/api/habits/<int:habit_id>")
def delete_habit(habit_id: int):
    with get_db_connection() as conn:
        conn.execute("DELETE FROM habits WHERE id = ?", (habit_id,))
        conn.commit()
    return jsonify({"status": "deleted"})


@app.post("/api/habits/<int:habit_id>/checkins")
def create_checkin(habit_id: int):
    data = request.get_json() or {}
    entry_date_str = data.get("entry_date")
    entry_date = (
        date.fromisoformat(entry_date_str) if entry_date_str else date.today()
    )

    with get_db_connection() as conn:
        conn.execute(
            """
            INSERT INTO habit_entries (habit_id, entry_date)
            VALUES (?, ?)
            """,
            (habit_id, entry_date.isoformat()),
        )
        conn.commit()

    return jsonify({"status": "ok"})


@app.get("/api/dashboard/summary")
def dashboard_summary():
    user_id = request.args.get("user_id", type=int)

    with get_db_connection() as conn:
        # Aggregations: COUNT, SUM, MAX, AVG
        totals = conn.execute(
            """
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
            """,
            (user_id,),
        ).fetchone()

        # CTE example: weekly completion rate per habit
        weekly = conn.execute(
            """
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
                GROUP BY h.id
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
            """,
            (user_id,),
        ).fetchall()

    return jsonify(
        {
            "totals": {
                "total_habits": totals["total_habits"],
                "active_habits": totals["active_habits"] or 0,
                "total_checkins": totals["total_checkins"],
                "avg_target_per_week": round(totals["avg_target_per_week"], 1)
                if totals["avg_target_per_week"] is not None
                else None,
                "last_checkin_date": totals["last_checkin_date"],
            },
            "weekly": [
                {
                    "habit_id": r["habit_id"],
                    "name": r["name"],
                    "target_per_week": r["target_per_week"],
                    "actual_per_week": r["actual_per_week"],
                    "completion_rate": r["completion_rate"],
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
            GROUP BY h.id
            ORDER BY total_checkins DESC, h.name ASC
    """

    with get_db_connection() as conn:
        # Join across 3+ tables with aggregations and a subquery
        rows = conn.execute(query, params).fetchall()

    report = [
        {
            "habit_id": r["habit_id"],
            "habit_name": r["habit_name"],
            "is_active": bool(r["is_active"]),
            "category_name": r["category_name"],
            "target_per_week": r["target_per_week"],
            "total_checkins": r["total_checkins"],
            "first_checkin": r["first_checkin"],
            "last_checkin": r["last_checkin"],
            "checkins_last_7_days": r["checkins_last_7_days"],
            "period_days": (
                (datetime.fromisoformat(r["last_checkin"]) - datetime.fromisoformat(r["first_checkin"])).days + 1
                if r["first_checkin"] and r["last_checkin"]
                else None
            ),
            "completion_rate": (
                round(100.0 * r["checkins_last_7_days"] / r["target_per_week"], 1)
                if r["target_per_week"] not in (None, 0)
                else None
            ),
            "avg_per_day": r["avg_per_day"],
        }
        for r in rows
    ]

    return jsonify(report)


if __name__ == "__main__":
    app.run(debug=True)

