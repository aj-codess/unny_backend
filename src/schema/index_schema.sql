CREATE SCHEMA IF NOT EXISTS unnySchema;

CREATE TYPE user_role AS ENUM ('STUDENT', 'LECTURER', 'UNVERIFIED_LECTURER');
CREATE TYPE course_status AS ENUM ('ACTIVE', 'ARCHIVED');

CREATE TABLE unnySchema.users (
    id BIGINT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    profile_image_url TEXT,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE unnySchema.organizations (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
        -- Geolocation (for map features)
    --location GEOGRAPHY(Point, 4326),
    --radius_meters INT DEFAULT 500 CHECK (radius_meters > 0),
    access_mode TEXT DEFAULT 'open' CHECK (access_mode IN ('open', 'closed')),
    created_by BIGINT NOT NULL REFERENCES unnySchema.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE unnySchema.organization_members (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id BIGSERIAL NOT NULL REFERENCES unnySchema.organizations(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, organization_id)
);



CREATE TABLE unnySchema.courses (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGSERIAL NOT NULL REFERENCES unnySchema.organizations(id) ON DELETE CASCADE,
    created_by BIGINT NOT NULL REFERENCES unnySchema.users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status course_status DEFAULT 'ACTIVE',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE unnySchema.course_enrollments (
    id BIGSERIAL,
    course_id BIGSERIAL NOT NULL REFERENCES unnySchema.courses(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES unnySchema.users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (course_id, user_id)
);



CREATE TABLE unnySchema.course_documents (
    id BIGSERIAL,
    course_id BIGSERIAL NOT NULL REFERENCES unnySchema.courses(id) ON DELETE CASCADE,
    uploaded_by BIGINT NOT NULL REFERENCES unnySchema.users(id),
    title VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE unnySchema.pinned_courses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES unnySchema.users(id) ON DELETE CASCADE,
    course_id BIGSERIAL NOT NULL REFERENCES unnySchema.courses(id) ON DELETE CASCADE,
    pinned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, course_id)
);


CREATE TABLE unnySchema.notifications (
    id BIGSERIAL PRIMARY KEY,
    recipient_id BIGINT REFERENCES circujoinSchema.users(id) ON DELETE CASCADE,
    type_id INT REFERENCES circujoinSchema.notification_types(id) ON DELETE RESTRICT,
    ref_id BIGINT,     -- e.g., post id, order id
    ref_table TEXT,    -- e.g., 'posts', 'orders'
    message TEXT,      -- optional: if NULL, use default_template
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT now()
);


CREATE INDEX idx_org_members_user ON unnySchema.organization_members(user_id);
CREATE INDEX idx_org_members_org ON unnySchema.organization_members(organization_id);
CREATE INDEX idx_courses_org ON unnySchema.courses(organization_id);
CREATE INDEX idx_course_enrollments_course ON unnySchema.course_enrollments(course_id);
CREATE INDEX idx_course_docs_course ON unnySchema.course_documents(course_id);
CREATE INDEX idx_notification ON unnySchema.notifications(id);