# HabitFlow - Habit Tracking System

HabitFlow is a full-stack habit tracking app built with:
- `Flask` + `SQLite` (backend)
- `React` + `Vite` + `MUI` (frontend)

It supports authentication, category-based habit management, dashboard analytics, and filtered reporting.

## 1) Project Structure

- `backend/` - Flask API, SQL schema, SQLite database
- `frontend/` - React app with sidebar layout and theme toggle

## 2) Core Features

- Login and Sign up
- CRUD for habits (Create, Read, Update, Delete)
- Create new categories from the Habits page
- Search and filter habits by text/category/status
- Dashboard summary with key metrics
- Reports page with advanced details and filters
- Light/Dark mode toggle (stored in local storage)

## 3) Database Design

The system includes at least 5 entities:
- `users`
- `habit_categories`
- `habits`
- `habit_entries`
- `habit_goals`

Defined in `backend/schema.sql`.

## 4) Required SQL Features (Implemented)

- Aggregations: `COUNT`, `SUM`, `AVG`, `MAX`, `MIN`
- Multi-table joins (3+ tables) in dashboard and reports queries
- Multiple subqueries in profile and reports endpoints
- CTE in dashboard weekly summary query
- Raw SQL only (`sqlite3`), no ORM usage

## 5) API Endpoints

### Auth
- `POST /api/auth/login`
- `POST /api/auth/signup`

### Categories
- `GET /api/habit-categories`
- `POST /api/habit-categories`

### Habits
- `GET /api/habits` (supports `user_id`, `search`, `category_id`, `is_active`)
- `POST /api/habits`
- `PUT /api/habits/<habit_id>`
- `DELETE /api/habits/<habit_id>`
- `POST /api/habits/<habit_id>/checkins`

### Dashboard / Reports / Profile
- `GET /api/dashboard/summary`
- `GET /api/reports/habits`
- `GET /api/profile/<user_id>`

## 6) Running the System

### Backend
From project root:

```bash
pip install -r requirements.txt
python backend/app.py
```

Backend URL: `http://127.0.0.1:5000`

### Frontend
In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: shown by Vite (`http://localhost:5173` or next available port).

## 7) How to Use

1. Sign up a new account or sign in with demo user:
   - email: `demo@example.com`
   - password: `password123`
2. Open `Habits` from sidebar:
   - Create category (`New` button) if needed
   - Create and edit habits
   - Delete habits (with validation modal)
3. Open `Dashboard` for summary metrics.
4. Open `Reports` for detailed filtered analytics.
5. Use light/dark toggle in the app header.

## 8) Notes

- Theme preference is stored in browser local storage key `habitflow_theme`.
- Logged-in session is stored in browser local storage key `habit_tracker_user`.
