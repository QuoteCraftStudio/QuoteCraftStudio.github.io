PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS members (
 uid TEXT PRIMARY KEY, id TEXT NOT NULL UNIQUE, name TEXT NOT NULL CHECK(length(name) BETWEEN 2 AND 50),
 bio TEXT NOT NULL DEFAULT '' CHECK(length(bio)<=300), role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('member','moderator')),
 suspended INTEGER NOT NULL DEFAULT 0 CHECK(suspended IN (0,1)), created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS discussions (
 id TEXT PRIMARY KEY, uid TEXT NOT NULL REFERENCES members(uid), category TEXT NOT NULL CHECK(category IN ('ideas','projects','technology','questions')),
 title TEXT NOT NULL CHECK(length(title) BETWEEN 4 AND 120), body TEXT NOT NULL CHECK(length(body)<=5000),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','removed')),
 locked INTEGER NOT NULL DEFAULT 0, pinned INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL, activity_at TEXT NOT NULL, terms_version TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS replies (
 id TEXT PRIMARY KEY, discussion_id TEXT NOT NULL REFERENCES discussions(id), uid TEXT NOT NULL REFERENCES members(uid),
 body TEXT NOT NULL CHECK(length(body)<=3000), status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','removed')),
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL, terms_version TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS reports (
 id TEXT PRIMARY KEY, uid TEXT NOT NULL REFERENCES members(uid), target_type TEXT NOT NULL CHECK(target_type IN ('discussion','reply','account')),
 target_id TEXT NOT NULL, reason TEXT NOT NULL CHECK(length(reason) BETWEEN 5 AND 1000), resolved INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY, actor_uid TEXT NOT NULL, action TEXT NOT NULL, target TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS discussions_listing ON discussions(status,pinned,activity_at);
CREATE INDEX IF NOT EXISTS discussions_owner ON discussions(uid,created_at);
CREATE INDEX IF NOT EXISTS replies_listing ON replies(discussion_id,status,created_at);
CREATE INDEX IF NOT EXISTS replies_owner ON replies(uid);
CREATE INDEX IF NOT EXISTS reports_queue ON reports(resolved,created_at);
CREATE INDEX IF NOT EXISTS limits_expiry ON limits(expires);
