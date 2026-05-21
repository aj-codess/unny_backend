import pgDB from "./../config/pgDB_config.js";
import token_helper from "./../service/token_helper.js";


// ─────────────────────────────────────────────────────────────────────────────
//  get_profile
//  Single query — joins org count (verified only) and pinned course count
//  so the profile page renders in one DB round trip.
//  Strips password_hash from the return.
// ─────────────────────────────────────────────────────────────────────────────

const get_profile = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            SELECT
                u.id,
                u.full_name,
                u.username,
                u.email,
                u.profile_image_url,
                u.cover_image_url,
                u.bio,
                u.website_url,
                u.university_name,
                u.is_email_verified,
                u.last_login_at,
                u.created_at,

                COUNT(DISTINCT om.organization_id)
                    FILTER (WHERE om.is_verified = TRUE)   AS organization_count,

                COUNT(DISTINCT pc.course_id)               AS pinned_course_count

            FROM unnySchema.users u

            LEFT JOIN unnySchema.organization_members om
                   ON om.user_id = u.id

            LEFT JOIN unnySchema.pinned_courses pc
                   ON pc.user_id = u.id

            WHERE u.id = $1
              AND u.is_active = TRUE

            GROUP BY u.id;
            `,
            [obj.target_id]
        );

        if (result.rowCount === 0) {
            return {
                status: false,
                message: "User not found",
                not_found: true
            };
        };

        return {
            status: true,
            data: result.rows[0]
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In get_profile Model",
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
//  update_profile
//  Partial update — only touches fields the caller explicitly sends.
//  Ownership is enforced at controller level (req.user === obj.target_id).
// ─────────────────────────────────────────────────────────────────────────────

const update_profile = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            UPDATE unnySchema.users
            SET
                full_name   = COALESCE($1, full_name),
                bio         = COALESCE($2, bio),
                website_url = COALESCE($3, website_url),
                updated_at  = now()
            WHERE
                id        = $4
                AND is_active = TRUE
            RETURNING
                id,
                full_name,
                bio,
                website_url,
                updated_at;
            `,
            [
                obj.full_name   ?? null,
                obj.bio         ?? null,
                obj.website_url ?? null,
                obj.target_id
            ]
        );

        if (result.rowCount === 0) {
            return {
                status: false,
                message: "User not found or account is inactive",
                not_found: true
            };
        };

        return {
            status: true,
            message: "Profile updated successfully",
            data: result.rows[0]
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In update_profile Model",
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
//  change_profile_image
//  Replaces profile_image_url with the new S3 URL.
// ─────────────────────────────────────────────────────────────────────────────

const change_profile_image = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            UPDATE unnySchema.users
            SET
                profile_image_url = $1,
                updated_at        = now()
            WHERE
                id        = $2
                AND is_active = TRUE
            RETURNING
                id,
                profile_image_url,
                updated_at;
            `,
            [obj.image_url, obj.target_id]
        );

        if (result.rowCount === 0) {
            return {
                status: false,
                message: "User not found or account is inactive",
                not_found: true
            };
        };

        return {
            status: true,
            message: "Profile image updated",
            data: result.rows[0]
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In change_profile_image Model",
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
//  change_cover_image
//  Replaces cover_image_url with the new S3 URL.
// ─────────────────────────────────────────────────────────────────────────────

const change_cover_image = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            UPDATE unnySchema.users
            SET
                cover_image_url = $1,
                updated_at      = now()
            WHERE
                id        = $2
                AND is_active = TRUE
            RETURNING
                id,
                cover_image_url,
                updated_at;
            `,
            [obj.image_url, obj.target_id]
        );

        if (result.rowCount === 0) {
            return {
                status: false,
                message: "User not found or account is inactive",
                not_found: true
            };
        };

        return {
            status: true,
            message: "Cover image updated",
            data: result.rows[0]
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In change_cover_image Model",
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
//  change_account_password
//  1. Fetches current password_hash for verification
//  2. Rejects if current password doesn't match
//  3. Updates to new hash
//  4. Kills all sessions except the active one (force re-login on other devices)
//  Transaction wraps steps 3 and 4.
// ─────────────────────────────────────────────────────────────────────────────

const change_account_password = async (obj) => {

    const dbPool = pgDB.getDB();
    const client = await dbPool.connect();

    try {

        // Step 1 — fetch hash outside transaction (read-only, no lock needed)
        const user = await client.query(
            `
            SELECT password_hash
            FROM unnySchema.users
            WHERE id = $1 AND is_active = TRUE
            LIMIT 1;
            `,
            [obj.target_id]
        );

        if (user.rowCount === 0) {
            return {
                status: false,
                message: "User not found",
                not_found: true
            };
        };

        // Step 2 — verify current password in application layer
        const is_match = await token_helper.compareHash(
            obj.current_password,
            user.rows[0].password_hash
        );

        if (!is_match) {
            return {
                status: false,
                message: "Current password is incorrect",
                wrong_password: true
            };
        };

        // Step 3 & 4 — update password + kill other sessions atomically
        await client.query("BEGIN");

        const new_hash = await token_helper.hashValue(obj.new_password);

        await client.query(
            `
            UPDATE unnySchema.users
            SET
                password_hash = $1,
                updated_at    = now()
            WHERE id = $2;
            `,
            [new_hash, obj.target_id]
        );

        // Kill all sessions except the one currently in use
        await client.query(
            `
            UPDATE unnySchema.sessions
            SET
                is_active  = FALSE,
                is_online  = FALSE,
                token_hash = NULL
            WHERE
                user_id    = $1
                AND session_id != $2
                AND is_active  = TRUE;
            `,
            [obj.target_id, obj.session_id]
        );

        await client.query("COMMIT");

        return {
            status: true,
            message: "Password changed successfully. Other devices have been logged out."
        };

    } catch (error) {

        await client.query("ROLLBACK");

        console.error({
            system: "Internal Server Error In change_account_password Model",
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
//  delete_account
//  Soft-delete: sets is_active = FALSE, clears all sessions.
//  Data (enrollments, pinned courses, org memberships) stays intact
//  for referential integrity — the account is just deactivated.
// ─────────────────────────────────────────────────────────────────────────────

const delete_account = async (obj) => {

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
                id        = $1
                AND is_active = TRUE
            RETURNING id;
            `,
            [obj.target_id]
        );

        if (result.rowCount === 0) {
            await client.query("ROLLBACK");
            return {
                status: false,
                message: "User not found or already deactivated",
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
            message: "Account deactivated successfully"
        };

    } catch (error) {

        await client.query("ROLLBACK");

        console.error({
            system: "Internal Server Error In delete_account Model",
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
//  get_user_orgs
//  Returns all organizations the user is a verified member of,
//  paginated via offset + limit.
//  Joins organization table to get name, slug, and logo.
// ─────────────────────────────────────────────────────────────────────────────

const get_user_orgs = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            SELECT
                o.id,
                o.name,
                o.slug,
                o.profile_image_url,
                o.description,
                o.access_mode,
                om.role,
                om.is_verified,
                om.verified_at,
                om.created_at   AS joined_at

            FROM unnySchema.organization_members om

            INNER JOIN unnySchema.organizations o
                    ON o.id = om.organization_id

            WHERE
                om.user_id     = $1
                AND om.is_verified = TRUE

            ORDER BY om.created_at DESC

            LIMIT  $2
            OFFSET $3;
            `,
            [obj.target_id, obj.limit, obj.offset]
        );

        return {
            status: true,
            data: result.rows,
            count: result.rowCount
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In get_user_orgs Model",
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
//  get_user_course_enrolled
//  Returns all courses the user is enrolled in — both ACTIVE and ARCHIVED.
//  Joins course and organization for context.
//  Paginated via offset + limit.
// ─────────────────────────────────────────────────────────────────────────────

const get_user_course_enrolled = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            SELECT
                c.id,
                c.title,
                c.course_code,
                c.slug,
                c.description,
                c.cover_image_url,
                c.status,
                c.start_date,
                c.end_date,

                o.id            AS organization_id,
                o.name          AS organization_name,
                o.slug          AS organization_slug,
                o.profile_image_url AS organization_logo,

                ce.enrolled_at

            FROM unnySchema.course_enrollments ce

            INNER JOIN unnySchema.courses c
                    ON c.id = ce.course_id

            INNER JOIN unnySchema.organizations o
                    ON o.id = c.organization_id

            WHERE ce.user_id = $1

            ORDER BY ce.enrolled_at DESC

            LIMIT  $2
            OFFSET $3;
            `,
            [obj.target_id, obj.limit, obj.offset]
        );

        return {
            status: true,
            data: result.rows,
            count: result.rowCount
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In get_user_course_enrolled Model",
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
//  get_pinned_courses
//  Returns the user's pinned courses — active and archived both shown.
//  Joins course + organization for full context.
//  Paginated via offset + limit.
// ─────────────────────────────────────────────────────────────────────────────

const get_pinned_courses = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            SELECT
                c.id,
                c.title,
                c.course_code,
                c.slug,
                c.description,
                c.cover_image_url,
                c.status,
                c.start_date,
                c.end_date,

                o.id            AS organization_id,
                o.name          AS organization_name,
                o.slug          AS organization_slug,
                o.profile_image_url AS organization_logo,

                pc.pinned_at

            FROM unnySchema.pinned_courses pc

            INNER JOIN unnySchema.courses c
                    ON c.id = pc.course_id

            INNER JOIN unnySchema.organizations o
                    ON o.id = c.organization_id

            WHERE pc.user_id = $1

            ORDER BY pc.pinned_at DESC

            LIMIT  $2
            OFFSET $3;
            `,
            [obj.target_id, obj.limit, obj.offset]
        );

        return {
            status: true,
            data: result.rows,
            count: result.rowCount
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In get_pinned_courses Model",
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
    get_profile,
    update_profile,
    change_profile_image,
    change_cover_image,
    change_account_password,
    delete_account,
    get_user_orgs,
    get_user_course_enrolled,
    get_pinned_courses
};