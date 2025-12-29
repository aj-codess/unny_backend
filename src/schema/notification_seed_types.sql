-- Ensure schema exists
CREATE SCHEMA IF NOT EXISTS unnySchema;

-- Ensure table exists
CREATE TABLE IF NOT EXISTS unnySchema.notification_types (
    id BIGSERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,        
    default_template TEXT NOT NULL,   -- e.g., '{{sender}} liked your post.'
    description TEXT                  -- for internal/admin use
);

-- Upsert notification types
INSERT INTO unnySchema.notification_types (code, default_template, description)
VALUES
    -- =========================
    -- ORGANIZATION & VERIFICATION
    -- =========================
    ('org_verification_requested',  '{{sender}} submitted a verification request to {{organization}}.', 'Triggered when a user requests verification from an academic organization.'),
    ('org_verified',                'You have been verified as a member of {{organization}}.',          'Triggered when a user is successfully verified by an academic organization.'),
    ('org_verification_rejected',   'Your verification request to {{organization}} was declined.',      'Triggered when an organization rejects a verification request.'),
    ('org_role_assigned',           'You have been assigned the role of {{role}} in {{organization}}.', 'Triggered when a verified role is assigned to a user within an organization.'),
    ('org_role_revoked',            'Your role as {{role}} in {{organization}} has been revoked.',      'Triggered when a user role is removed by an organization.'),
    -- =========================
    -- COURSE LIFECYCLE
    -- =========================
    ('course_created',      'A new course "{{course}}" has been created under {{organization}}.',               'Triggered when an academic course is created.'),
    ('course_updated',      'The course "{{course}}" has been updated.',                                        'Triggered when course details are modified.'),
    ('course_archived',     'The course "{{course}}" has been archived and remains available for reference.',   'Triggered when a course transitions from active to archived state.'),
    ('course_reactivated',  'The course "{{course}}" has been reactivated.',                                    'Triggered when an archived course is restored to active status.'),
    -- =========================
    -- COURSE PARTICIPATION
    -- =========================
    ('course_pinned',       'The course "{{course}}" has been pinned to your profile.',     'Triggered when a user pins a course to their profile.'),
    ('course_unpinned',     'The course "{{course}}" has been unpinned from your profile.', 'Triggered when a user removes a pinned course.'),
    -- =========================
    -- COURSE RESOURCES
    -- =========================
    ('course_document_uploaded',    'A new document has been added to the course "{{course}}".','Triggered when a lecturer uploads a document to a course.'),
    ('course_document_updated',     'A document in the course "{{course}}" has been updated.',   'Triggered when an existing course document is modified.'),
    ('course_document_removed',     'A document has been removed from the course "{{course}}".', 'Triggered when a document is deleted from a course.'),
    -- =========================
    -- SYSTEM & ADMINISTRATIVE
    -- =========================
    ('system_announcement',     '{{message}}',                                                          'Triggered for platform-wide academic announcements.'),
    ('system_policy_update',    'A system policy has been updated. Please review the latest changes.',  'Triggered when platform policies or academic rules are updated.'),
    ('system_maintenance',      'Scheduled system maintenance will occur on {{date}}.',                 'Triggered to inform users about planned system maintenance.'),
    ('generic',              '{{message}}',                                             'Fallback notification type for generic cases.'),
    ('profile_peak',         '{{sender}} peaked your profile.',                         'Triggered when a user views your profile.'),
    ('system_alert',         '⚠️ {{message}}',                                          'Triggered for urgent system/security alerts.')
ON CONFLICT (code) DO UPDATE
SET default_template = EXCLUDED.default_template,
    description      = EXCLUDED.description;