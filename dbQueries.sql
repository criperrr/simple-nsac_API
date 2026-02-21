CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    nsac_email TEXT NOT NULL,
    nsac_hash_pass TEXT NOT NULL,
    nsac_crypted_cookies TEXT
)