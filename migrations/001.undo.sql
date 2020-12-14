DROP INDEX IF EXISTS idx_bookmarks_tags_bookmarks_id;
DROP INDEX IF EXISTS idx_bookmarks_tags_tags_id;
DROP TABLE IF EXISTS bookmarks_tags;
DROP INDEX IF EXISTS idx_tags_owner;
DROP TABLE IF EXISTS tags;
DROP INDEX IF EXISTS idx_bookmarks_owner;
DROP TABLE IF EXISTS bookmarks;
DROP TABLE IF EXISTS credentials;
DROP TYPE IF EXISTS auth_service;
DROP TABLE IF EXISTS users;
DROP DOMAIN IF EXISTS email_address;
DROP EXTENSION IF EXISTS "uuid-ossp";
DROP EXTENSION IF EXISTS citext;

