-- ============================================================
--  UNNY PLATFORM — IDEMPOTENT DATABASE SCHEMA
--  University-Centric Edutech Platform
--  Version: 3.0
--
--  Safe to run multiple times — uses IF NOT EXISTS everywhere.
--  Re-running will not drop or duplicate existing data.
-- ============================================================


-- ============================================================
--  SCHEMA
-- ============================================================

CREATE SCHEMA IF NOT EXISTS unnySchema;


-- ============================================================
--  ENUMS  (DO NOT USE IF EXISTS — Postgres doesn't support it)
--  We use a DO block to guard each enum safely.
-- ============================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('STUDENT', 'LECTURER', 'UNVERIFIED_LECTURER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE course_status AS ENUM ('ACTIVE', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE access_mode_type AS ENUM ('open', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE notif_channel AS ENUM ('in_app', 'email');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
--  USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS unnySchema.users (
    id                  BIGSERIAL PRIMARY KEY,
    full_name           VARCHAR(150)    NOT NULL,
    username            TEXT            UNIQUE NOT NULL,
    email               VARCHAR(255)    UNIQUE NOT NULL,
    password_hash       TEXT            NOT NULL,

    -- Profile
    profile_image_url   TEXT,
    cover_image_url     TEXT,
    bio                 TEXT,
    website_url         TEXT,

    -- Account state
    is_active           BOOLEAN         DEFAULT TRUE,
    is_email_verified   BOOLEAN         DEFAULT FALSE,
    last_login_at       TIMESTAMP,

    -- Audit
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email    ON unnySchema.users(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON unnySchema.users(username);
CREATE        INDEX IF NOT EXISTS idx_users_active   ON unnySchema.users(is_active);


-- ============================================================
--  ORGANIZATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS unnySchema.organizations (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(255)    NOT NULL UNIQUE,
    slug                TEXT            UNIQUE NOT NULL,

    -- Branding
    profile_image_url   TEXT,
    cover_image_url     TEXT,
    description         TEXT,
    website_url         TEXT,
    contact_email       VARCHAR(255),

    -- Access control
    access_mode         access_mode_type  DEFAULT 'open',

    -- Geolocation (reserved — uncomment when needed)
    -- location         GEOGRAPHY(Point, 4326),
    -- radius_meters    INT DEFAULT 500 CHECK (radius_meters > 0),

    -- Audit
    created_by          BIGINT          NOT NULL REFERENCES unnySchema.users(id),
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_orgs_slug    ON unnySchema.organizations(slug);
CREATE        INDEX IF NOT EXISTS idx_orgs_created ON unnySchema.organizations(created_by);


-- ============================================================
--  ORGANIZATION MEMBERS
-- ============================================================

CREATE TABLE IF NOT EXISTS unnySchema.organization_members (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT          NOT NULL REFERENCES unnySchema.users(id) ON DELETE CASCADE,
    organization_id     BIGINT          NOT NULL REFERENCES unnySchema.organizations(id) ON DELETE CASCADE,

    -- Role & verification
    role                user_role       NOT NULL,
    is_verified         BOOLEAN         DEFAULT FALSE,
    verified_at         TIMESTAMP,
    verified_by         BIGINT          REFERENCES unnySchema.users(id),
    institutional_id    VARCHAR(100),

    -- Audit
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (user_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user     ON unnySchema.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org      ON unnySchema.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role     ON unnySchema.organization_members(role);
CREATE INDEX IF NOT EXISTS idx_org_members_verified ON unnySchema.organization_members(is_verified);


-- ============================================================
--  COURSES
-- ============================================================

CREATE TABLE IF NOT EXISTS unnySchema.courses (
    id                  BIGSERIAL PRIMARY KEY,
    organization_id     BIGINT          NOT NULL REFERENCES unnySchema.organizations(id) ON DELETE CASCADE,
    created_by          BIGINT          NOT NULL REFERENCES unnySchema.users(id),

    -- Identity
    title               VARCHAR(255)    NOT NULL,
    course_code         VARCHAR(50),
    slug                TEXT            UNIQUE NOT NULL,
    description         TEXT,
    cover_image_url     TEXT,

    -- Lifecycle
    status              course_status   DEFAULT 'ACTIVE',
    start_date          DATE,
    end_date            DATE,

    -- Audit
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE        INDEX IF NOT EXISTS idx_courses_org        ON unnySchema.courses(organization_id);
CREATE        INDEX IF NOT EXISTS idx_courses_created_by ON unnySchema.courses(created_by);
CREATE        INDEX IF NOT EXISTS idx_courses_status     ON unnySchema.courses(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_slug       ON unnySchema.courses(slug);


-- ============================================================
--  COURSE ENROLLMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS unnySchema.course_enrollments (
    id                  BIGSERIAL PRIMARY KEY,
    course_id           BIGINT          NOT NULL REFERENCES unnySchema.courses(id) ON DELETE CASCADE,
    user_id             BIGINT          NOT NULL REFERENCES unnySchema.users(id) ON DELETE CASCADE,

    enrolled_at         TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (course_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_course ON unnySchema.course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user   ON unnySchema.course_enrollments(user_id);


-- ============================================================
--  COURSE DOCUMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS unnySchema.course_documents (
    id                  BIGSERIAL PRIMARY KEY,
    course_id           BIGINT          NOT NULL REFERENCES unnySchema.courses(id) ON DELETE CASCADE,
    uploaded_by         BIGINT          NOT NULL REFERENCES unnySchema.users(id),

    -- Document info
    title               VARCHAR(255)    NOT NULL,
    description         TEXT,
    file_url            TEXT            NOT NULL,
    thumbnail_url       TEXT,
    file_type           VARCHAR(50),
    file_size_bytes     BIGINT,
    original_filename   TEXT,

    -- Visibility
    is_visible          BOOLEAN         DEFAULT TRUE,

    -- Audit
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_course_docs_course   ON unnySchema.course_documents(course_id);
CREATE INDEX IF NOT EXISTS idx_course_docs_uploader ON unnySchema.course_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_course_docs_visible  ON unnySchema.course_documents(is_visible);


-- ============================================================
--  PINNED COURSES
-- ============================================================

CREATE TABLE IF NOT EXISTS unnySchema.pinned_courses (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT          NOT NULL REFERENCES unnySchema.users(id) ON DELETE CASCADE,
    course_id           BIGINT          NOT NULL REFERENCES unnySchema.courses(id) ON DELETE CASCADE,

    pinned_at           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_pinned_user   ON unnySchema.pinned_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_pinned_course ON unnySchema.pinned_courses(course_id);



-- ============================================================
--  NOTIFICATIONS
--  Fixed: was referencing circujoinSchema (wrong schema).
--  Now correctly references unnySchema for both FKs.
-- ============================================================

CREATE TABLE IF NOT EXISTS unnySchema.notifications (
    id                  BIGSERIAL PRIMARY KEY,
    recipient_id        BIGINT          NOT NULL REFERENCES unnySchema.users(id) ON DELETE CASCADE,
    type_id             INT             NOT NULL REFERENCES unnySchema.notification_types(id) ON DELETE RESTRICT,

    -- Polymorphic reference (what triggered this notification)
    ref_id              BIGINT,
    ref_table           TEXT,

    -- Content
    message             TEXT,           -- overrides default_template when set
    action_url          TEXT,           -- deep-link e.g. '/courses/123'

    -- State
    is_read             BOOLEAN         DEFAULT FALSE,
    read_at             TIMESTAMP,

    -- Audit
    created_at          TIMESTAMP       DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON unnySchema.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type      ON unnySchema.notifications(type_id);
CREATE INDEX IF NOT EXISTS idx_notifications_ref       ON unnySchema.notifications(ref_table, ref_id);

-- Partial index: only indexes unread rows — very fast for unread badge/count queries
CREATE INDEX IF NOT EXISTS idx_notifications_unread
    ON unnySchema.notifications(recipient_id, is_read)
    WHERE is_read = FALSE;


-- ============================================================
--  AUTO-UPDATE updated_at  — trigger function + per-table triggers
--  OR REPLACE makes this safe to re-run anytime.
-- ============================================================

CREATE OR REPLACE FUNCTION unnySchema.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- users
DO $$ BEGIN
    CREATE TRIGGER trg_users_updated_at
        BEFORE UPDATE ON unnySchema.users
        FOR EACH ROW EXECUTE FUNCTION unnySchema.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- organizations
DO $$ BEGIN
    CREATE TRIGGER trg_organizations_updated_at
        BEFORE UPDATE ON unnySchema.organizations
        FOR EACH ROW EXECUTE FUNCTION unnySchema.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- organization_members
DO $$ BEGIN
    CREATE TRIGGER trg_org_members_updated_at
        BEFORE UPDATE ON unnySchema.organization_members
        FOR EACH ROW EXECUTE FUNCTION unnySchema.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- courses
DO $$ BEGIN
    CREATE TRIGGER trg_courses_updated_at
        BEFORE UPDATE ON unnySchema.courses
        FOR EACH ROW EXECUTE FUNCTION unnySchema.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- course_documents
DO $$ BEGIN
    CREATE TRIGGER trg_course_docs_updated_at
        BEFORE UPDATE ON unnySchema.course_documents
        FOR EACH ROW EXECUTE FUNCTION unnySchema.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;