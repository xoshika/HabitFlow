# Database Configuration for HabitFlow

This system now supports both **SQLite** and **PostgreSQL**.

## How to use PostgreSQL

1.  **Install Dependencies**:
    Make sure you have the required Python packages installed:
    ```bash
    pip install -r requirements.txt
    ```

2.  **Configure Environment Variables**:
    Create a `.env` file in the root directory (copy from `.env.example`) and set your `DATABASE_URL`.
    
    ```env
    DATABASE_URL=postgresql://username:password@localhost:5432/habitflow
    ```

3.  **Setup the Database**:
    The application will automatically run `backend/schema_pg.sql` the first time it connects to an empty PostgreSQL database.

## Dialect Differences Handled

The `Database` abstraction in `backend/app.py` automatically handles:
- **Placeholders**: Converts `?` (SQLite) to `%s` (PostgreSQL).
- **Date Functions**: Converts SQLite's `date('now', '-7 day')` to PostgreSQL's `CURRENT_DATE - INTERVAL '7 days'`.
- **Identity/Auto-increment**: Uses `SERIAL` for PostgreSQL and handles ID retrieval via `RETURNING id`.
- **Row Factories**: Uses `psycopg2.extras.RealDictCursor` to maintain compatibility with `sqlite3.Row` access patterns.

## Switching back to SQLite

Simply change the `DATABASE_URL` in your `.env` file:

```env
DATABASE_URL=sqlite:///habit_tracker.db
```
