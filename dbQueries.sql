CREATE TABLE IF NOT EXISTS Users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    nsac_email TEXT NOT NULL,
    nsac_hash_pass TEXT NOT NULL,
    nsac_crypted_cookies TEXT
)