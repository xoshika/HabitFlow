PRAGMA foreign_keys = ON;

-- 1) users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    middle_name TEXT,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    is_verified INTEGER NOT NULL DEFAULT 0,
    verification_token TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2) habit_categories table
CREATE TABLE IF NOT EXISTS habit_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

-- 3) habits table
CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES habit_categories(id) ON DELETE SET NULL
);

-- 4) habit_entries table (daily check-ins)
CREATE TABLE IF NOT EXISTS habit_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL,
    entry_date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
);

-- 5) habit_goals table (targets per week)
CREATE TABLE IF NOT EXISTS habit_goals (
    habit_id INTEGER PRIMARY KEY,
    target_per_week INTEGER NOT NULL,
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
);

-- Seed demo data for quick testing
INSERT OR IGNORE INTO users (id, first_name, middle_name, last_name, email, password)
VALUES (1, 'Demo', '', 'User', 'demo@example.com', 'password123');

INSERT OR IGNORE INTO habit_categories (id, name)
VALUES
    (1, 'Health'),
    (2, 'Productivity'),
    (3, 'Learning');

INSERT OR IGNORE INTO habits (id, user_id, category_id, name, description, is_active)
VALUES
    (1, 1, 1, 'Morning Run', 'Run for at least 20 minutes', 1),
    (2, 1, 2, 'Plan Day', 'Write down top 3 priorities', 1),
    (3, 1, 3, 'Read 20 pages', 'Read a non-fiction book', 1);

INSERT OR IGNORE INTO habit_goals (habit_id, target_per_week)
VALUES
    (1, 4),
    (2, 5),
    (3, 5);

-- Some example entries (the real system will insert dynamically)
INSERT OR IGNORE INTO habit_entries (habit_id, entry_date)
VALUES
    (1, date('now', '-1 day')),
    (1, date('now', '-2 day')),
    (2, date('now', '-1 day')),
    (3, date('now', '-3 day'));

