CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    nsac_email TEXT,
    nsac_hash_pass TEXT,
    nsac_crypted_cookies TEXT
)