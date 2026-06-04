import pgDB from "./../config/pgDB_config.js";


// ─────────────────────────────────────────────────────────────────────────────
//  get_all_users
//  Paginated full user list for admin oversight.
//  Optionally filtered by is_active status via obj.is_active.
//  Exposes fields an admin needs — strips password_hash.
// ─────────────────────────────────────────────────────────────────────────────

const get_all_users = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            SELECT
                u.id,
                u.full_name,
                u.username,
                u.email,
                u.university_name,
                u.profile_image_url,
                u.is_active,
                u.is_email_verified,
                u.last_login_at,
                u.created_at,

                COUNT(DISTINCT om.organization_id)
                    FILTER (WHERE om.is_verified = TRUE)   AS organization_count,

                COUNT(DISTINCT ce.course_id)               AS enrollment_count

            FROM unnySchema.users u

            LEFT JOIN unnySchema.organization_members om
                   ON om.user_id = u.id

            LEFT JOIN unnySchema.course_enrollments ce
                   ON ce.user_id = u.id

            WHERE
                ($1::BOOLEAN IS NULL OR u.is_active = $1)

            GROUP BY u.id

            ORDER BY u.created_at DESC

            LIMIT  $2
            OFFSET $3;
            `,
            [
                obj.is_active ?? null,
                obj.limit,
                obj.offset
            ]
        );

        return {
            status: true,
            data: result.rows,
            count: result.rowCount
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In get_all_users Model",
            name: error.name,
            message: error.message,
            stack: error.stack
        });

        return {
            status: false,
            message: "Internal Server Error"
        };

    };

};


// ─────────────────────────────────────────────────────────────────────────────
//  activate_user
//  Re-activates a previously deactivated user account.
//  Returns not_found if the user doesn't exist or is already active.
// ─────────────────────────────────────────────────────────────────────────────

const activate_user = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            UPDATE unnySchema.users
            SET
                is_active  = TRUE,
                updated_at = now()
            WHERE
                id         = $1
                AND is_active = FALSE
            RETURNING
                id,
                full_name,
                email,
                is_active,
                updated_at;
            `,
            [obj.target_id]
        );

        if (result.rowCount === 0) {
            return {
                status: false,
                message: "User not found or account is already active",
                not_found: true
            };
        };

        return {
            status: true,
            message: "User account activated successfully",
            data: result.rows[0]
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In activate_user Model",
            name: error.name,
            message: error.message,
            stack: error.stack
        });

        return {
            status: false,
            message: "Internal Server Error"
        };

    };

};


// ─────────────────────────────────────────────────────────────────────────────
//  deactivate_user
//  Soft-deactivates a user account and kills all their active sessions.
//  Wrapped in a transaction — both steps succeed or neither does.
//  Returns not_found if the user doesn't exist or is already inactive.
// ─────────────────────────────────────────────────────────────────────────────

const deactivate_user = async (obj) => {

    const dbPool = pgDB.getDB();
    const client = await dbPool.connect();

    try {

        await client.query("BEGIN");

        const result = await client.query(
            `
            UPDATE unnySchema.users
            SET
                is_active  = FALSE,
                updated_at = now()
            WHERE
                id         = $1
                AND is_active = TRUE
            RETURNING
                id,
                full_name,
                email,
                is_active,
                updated_at;
            `,
            [obj.target_id]
        );

        if (result.rowCount === 0) {
            await client.query("ROLLBACK");
            return {
                status: false,
                message: "User not found or account is already inactive",
                not_found: true
            };
        };

        // Kill all active sessions immediately
        await client.query(
            `
            UPDATE unnySchema.sessions
            SET
                is_active  = FALSE,
                is_online  = FALSE,
                token_hash = NULL
            WHERE
                user_id   = $1
                AND is_active = TRUE;
            `,
            [obj.target_id]
        );

        await client.query("COMMIT");

        return {
            status: true,
            message: "User account deactivated successfully",
            data: result.rows[0]
        };

    } catch (error) {

        await client.query("ROLLBACK");

        console.error({
            system: "Internal Server Error In deactivate_user Model",
            name: error.name,
            message: error.message,
            stack: error.stack
        });

        return {
            status: false,
            message: "Internal Server Error"
        };

    } finally {
        client.release();
    };

};


// ─────────────────────────────────────────────────────────────────────────────
//  get_stats
//  Single query using subqueries for each metric so the entire
//  platform summary is returned in one round trip.
//  Covers: users, orgs, courses (active + archived), enrollments, documents.
// ─────────────────────────────────────────────────────────────────────────────

const get_stats = async () => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            SELECT

                -- Users
                (SELECT COUNT(*) FROM unnySchema.users)                          AS total_users,
                (SELECT COUNT(*) FROM unnySchema.users WHERE is_active = TRUE)   AS active_users,
                (SELECT COUNT(*) FROM unnySchema.users WHERE is_active = FALSE)  AS inactive_users,
                (SELECT COUNT(*) FROM unnySchema.users
                    WHERE is_email_verified = TRUE)                              AS verified_users,

                -- Organizations
                (SELECT COUNT(*) FROM unnySchema.organizations)                  AS total_organizations,
                (SELECT COUNT(*) FROM unnySchema.organization_members
                    WHERE is_verified = TRUE)                                     AS total_verified_members,

                -- Courses
                (SELECT COUNT(*) FROM unnySchema.courses)                        AS total_courses,
                (SELECT COUNT(*) FROM unnySchema.courses
                    WHERE status = 'ACTIVE')                                     AS active_courses,
                (SELECT COUNT(*) FROM unnySchema.courses
                    WHERE status = 'ARCHIVED')                                   AS archived_courses,

                -- Enrollments
                (SELECT COUNT(*) FROM unnySchema.course_enrollments)             AS total_enrollments,

                -- Documents
                (SELECT COUNT(*) FROM unnySchema.course_documents)               AS total_documents,
                (SELECT COUNT(*) FROM unnySchema.course_documents
                    WHERE is_visible = TRUE)                                      AS visible_documents,

                -- Snapshot timestamp
                now()                                                            AS generated_at;
            `
        );

        return {
            status: true,
            data: result.rows[0]
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In get_stats Model",
            name: error.name,
            message: error.message,
            stack: error.stack
        });

        return {
            status: false,
            message: "Internal Server Error"
        };

    };

};


export default {
    get_all_users,
    activate_user,
    deactivate_user,
    get_stats
};