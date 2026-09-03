ALTER TABLE users ADD COLUMN firebase_uid VARCHAR(128);
CREATE UNIQUE INDEX uq_users_firebase_uid ON users(firebase_uid);
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS user_sessions;

UPDATE atlas_schema_metadata SET schema_version = 7 WHERE id = 1;
