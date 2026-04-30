-- 1) users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    middle_name TEXT,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    is_verified INTEGER NOT NULL DEFAULT 0,
    verification_token TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2) habit_categories table
CREATE TABLE IF NOT EXISTS habit_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- 3) habits table
CREATE TABLE IF NOT EXISTS habits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    category_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES habit_categories(id) ON DELETE SET NULL
);

-- 4) habit_entries table (daily check-ins)
CREATE TABLE IF NOT EXISTS habit_entries (
    id SERIAL PRIMARY KEY,
    habit_id INTEGER NOT NULL,
    entry_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_habit FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
);

-- 5) habit_goals table (targets per week)
CREATE TABLE IF NOT EXISTS habit_goals (
    habit_id INTEGER PRIMARY KEY,
    target_per_week INTEGER NOT NULL,
    CONSTRAINT fk_habit_goal FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
);

-- Seed demo data
INSERT INTO users (id, first_name, middle_name, last_name, email, password, is_verified)
VALUES (1, 'Demo', '', 'User', 'demo@example.com', 'password123', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO habit_categories (id, name)
VALUES
    (1, 'Health'),
    (2, 'Productivity'),
    (3, 'Learning')
ON CONFLICT (id) DO NOTHING;

INSERT INTO habits (id, user_id, category_id, name, description, is_active)
VALUES
    (1, 1, 1, 'Morning Run', 'Run for at least 20 minutes', 1),
    (2, 1, 2, 'Plan Day', 'Write down top 3 priorities', 1),
    (3, 1, 3, 'Read 20 pages', 'Read a non-fiction book', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO habit_goals (habit_id, target_per_week)
VALUES
    (1, 4),
    (2, 5),
    (3, 5)
ON CONFLICT (habit_id) DO NOTHING;

-- Fix sequences after manual ID inserts
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 1)) FROM users;
SELECT setval(pg_get_serial_sequence('habit_categories', 'id'), COALESCE(MAX(id), 1)) FROM habit_categories;
SELECT setval(pg_get_serial_sequence('habits', 'id'), COALESCE(MAX(id), 1)) FROM habits;
SELECT setval(pg_get_serial_sequence('habit_entries', 'id'), COALESCE(MAX(id), 1)) FROM habit_entries;
