import pgDB from "./../config/pgDB_config.js";
import snow from "./../utility/id_entry.js";


// ─────────────────────────────────────────────────────────────────────────────
//  list
//  Public paginated list of all organizations.
//  Returns lightweight card data — name, slug, logo, access_mode,
//  member count, and course count in one query.
// ─────────────────────────────────────────────────────────────────────────────

const list = async (obj) => {

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
                o.created_at,

                COUNT(DISTINCT om.id)
                    FILTER (WHERE om.is_verified = TRUE)   AS member_count,

                COUNT(DISTINCT c.id)                       AS course_count

            FROM unnySchema.organizations o

            LEFT JOIN unnySchema.organization_members om
                   ON om.organization_id = o.id

            LEFT JOIN unnySchema.courses c
                   ON c.organization_id = o.id

            GROUP BY o.id

            ORDER BY o.created_at DESC

            LIMIT  $1
            OFFSET $2;
            `,
            [obj.limit, obj.offset]
        );

        return {
            status: true,
            data: result.rows,
            count: result.rowCount
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In org list Model",
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
//  org_and_owner_list
//  Admin-only view — same as list but surfaces owner info (full_name,
//  email, university_name) joined from the users table.
// ─────────────────────────────────────────────────────────────────────────────

const org_and_owner_list = async (obj) => {

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
                o.contact_email,
                o.website_url,
                o.created_at,

                -- owner info
                u.id              AS owner_id,
                u.full_name       AS owner_name,
                u.email           AS owner_email,
                u.university_name AS owner_university,
                u.profile_image_url AS owner_avatar,

                COUNT(DISTINCT om.id)
                    FILTER (WHERE om.is_verified = TRUE)   AS member_count,

                COUNT(DISTINCT c.id)                       AS course_count

            FROM unnySchema.organizations o

            INNER JOIN unnySchema.users u
                    ON u.id = o.created_by

            LEFT JOIN unnySchema.organization_members om
                   ON om.organization_id = o.id

            LEFT JOIN unnySchema.courses c
                   ON c.organization_id = o.id

            GROUP BY o.id, u.id

            ORDER BY o.created_at DESC

            LIMIT  $1
            OFFSET $2;
            `,
            [obj.limit, obj.offset]
        );

        return {
            status: true,
            data: result.rows,
            count: result.rowCount
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In org_and_owner_list Model",
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
//  create_org
//  Creates the organization then immediately inserts the creator
//  as a verified CREATOR member — both in one transaction.
//  org id is a Snowflake. Creator is set via req.user.id (from JWT).
// ─────────────────────────────────────────────────────────────────────────────

const create_org = async (obj) => {

    const dbPool = pgDB.getDB();
    const client = await dbPool.connect();

    try {

        await client.query("BEGIN");

        const org_id = snow.get_current_time();

        const org = await client.query(
            `
            INSERT INTO unnySchema.organizations (
                id,
                name,
                slug,
                profile_image_url,
                cover_image_url,
                description,
                website_url,
                contact_email,
                access_mode,
                created_by,
                created_at,
                updated_at
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                now(), now()
            )
            RETURNING
                id,
                name,
                slug,
                profile_image_url,
                description,
                access_mode,
                created_at;
            `,
            [
                org_id,
                obj.name,
                obj.slug,
                obj.profile_image_url   ?? null,
                obj.cover_image_url     ?? null,
                obj.description         ?? null,
                obj.website_url         ?? null,
                obj.contact_email       ?? null,
                obj.access_mode         ?? "open",
                obj.creator_id
            ]
        );

        // Auto-enroll creator as a verified CREATOR member
        const member_id = snow.get_current_time();

        await client.query(
            `
            INSERT INTO unnySchema.organization_members (
                id,
                user_id,
                organization_id,
                role,
                is_verified,
                verified_at,
                verified_by,
                created_at,
                updated_at
            )
            VALUES (
                $1, $2, $3,
                'CREATOR',
                TRUE,
                now(),
                $2,
                now(), now()
            );
            `,
            [member_id, obj.creator_id, org_id]
        );

        await client.query("COMMIT");

        return {
            status: true,
            message: "Organization created successfully",
            data: org.rows[0]
        };

    } catch (error) {

        await client.query("ROLLBACK");

        // Unique constraint violation — name or slug already taken
        if (error.code === "23505") {
            return {
                status: false,
                message: "An organization with that name or slug already exists",
                conflict: true
            };
        };

        console.error({
            system: "Internal Server Error In create_org Model",
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
//  get_org_via_slug
//  Public single-org view by slug.
//  Returns full org details + member count + course count + owner snapshot.
// ─────────────────────────────────────────────────────────────────────────────

const get_org_via_slug = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            SELECT
                o.id,
                o.name,
                o.slug,
                o.profile_image_url,
                o.cover_image_url,
                o.description,
                o.website_url,
                o.contact_email,
                o.access_mode,
                o.created_at,

                -- owner snapshot
                u.id              AS owner_id,
                u.full_name       AS owner_name,
                u.profile_image_url AS owner_avatar,
                u.university_name AS owner_university,

                COUNT(DISTINCT om.id)
                    FILTER (WHERE om.is_verified = TRUE)   AS member_count,

                COUNT(DISTINCT c.id)                       AS course_count,

                COUNT(DISTINCT c.id)
                    FILTER (WHERE c.status = 'ACTIVE')     AS active_course_count

            FROM unnySchema.organizations o

            INNER JOIN unnySchema.users u
                    ON u.id = o.created_by

            LEFT JOIN unnySchema.organization_members om
                   ON om.organization_id = o.id

            LEFT JOIN unnySchema.courses c
                   ON c.organization_id = o.id

            WHERE o.slug = $1

            GROUP BY o.id, u.id;
            `,
            [obj.slug]
        );

        if (result.rowCount === 0) {
            return {
                status: false,
                message: "Organization not found",
                not_found: true
            };
        };

        return {
            status: true,
            data: result.rows[0]
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In get_org_via_slug Model",
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
//  update
//  Partial update of org metadata.
//  COALESCE keeps existing values for any field not supplied.
//  Ownership check (caller must be creator) is enforced in the WHERE clause
//  so a non-owner update returns 0 rows and is caught cleanly.
// ─────────────────────────────────────────────────────────────────────────────

const update = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            UPDATE unnySchema.organizations
            SET
                name          = COALESCE($1, name),
                slug          = COALESCE($2, slug),
                description   = COALESCE($3, description),
                website_url   = COALESCE($4, website_url),
                contact_email = COALESCE($5, contact_email),
                access_mode   = COALESCE($6, access_mode),
                updated_at    = now()
            WHERE
                id         = $7
                AND created_by = $8
            RETURNING
                id,
                name,
                slug,
                description,
                website_url,
                contact_email,
                access_mode,
                updated_at;
            `,
            [
                obj.name          ?? null,
                obj.slug          ?? null,
                obj.description   ?? null,
                obj.website_url   ?? null,
                obj.contact_email ?? null,
                obj.access_mode   ?? null,
                obj.org_id,
                obj.caller_id
            ]
        );

        if (result.rowCount === 0) {
            return {
                status: false,
                message: "Organization not found or you do not have permission to update it",
                not_found: true
            };
        };

        return {
            status: true,
            message: "Organization updated successfully",
            data: result.rows[0]
        };

    } catch (error) {

        if (error.code === "23505") {
            return {
                status: false,
                message: "That name or slug is already taken by another organization",
                conflict: true
            };
        };

        console.error({
            system: "Internal Server Error In update Model",
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
//  update_logo
//  Replaces profile_image_url (org logo) with a new S3 URL.
//  Ownership enforced in WHERE clause.
// ─────────────────────────────────────────────────────────────────────────────

const update_logo = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            UPDATE unnySchema.organizations
            SET
                profile_image_url = $1,
                updated_at        = now()
            WHERE
                id         = $2
                AND created_by = $3
            RETURNING
                id,
                profile_image_url,
                updated_at;
            `,
            [obj.image_url, obj.org_id, obj.caller_id]
        );

        if (result.rowCount === 0) {
            return {
                status: false,
                message: "Organization not found or you do not have permission to update it",
                not_found: true
            };
        };

        return {
            status: true,
            message: "Organization logo updated",
            data: result.rows[0]
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In update_logo Model",
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
//  update_cover
//  Replaces cover_image_url with a new S3 URL.
//  Ownership enforced in WHERE clause.
// ─────────────────────────────────────────────────────────────────────────────

const update_cover = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            UPDATE unnySchema.organizations
            SET
                cover_image_url = $1,
                updated_at      = now()
            WHERE
                id         = $2
                AND created_by = $3
            RETURNING
                id,
                cover_image_url,
                updated_at;
            `,
            [obj.image_url, obj.org_id, obj.caller_id]
        );

        if (result.rowCount === 0) {
            return {
                status: false,
                message: "Organization not found or you do not have permission to update it",
                not_found: true
            };
        };

        return {
            status: true,
            message: "Organization cover updated",
            data: result.rows[0]
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In update_cover Model",
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
//  delete_org
//  Admin-level soft delete — does not physically drop the row.
//  Instead: sets a deleted_at timestamp and renames the slug to prevent
//  name/slug collisions after deletion, allowing a new org with the same
//  name to be created.
//  Note: because the schema has no deleted_at column yet, this does a hard
//  delete but wraps it in RETURNING so the caller gets confirmation.
//  Cascades to members, courses, enrollments, and documents via FK rules.
// ─────────────────────────────────────────────────────────────────────────────

const delete_org = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            DELETE FROM unnySchema.organizations
            WHERE id = $1 AND created_by = $2 
            RETURNING id, name, slug;
            `,
            [obj.org_id,obj.caller_id]
        );

        if (result.rowCount === 0) {
            return {
                status: false,
                message: "Organization not found",
                not_found: true
            };
        };

        return {
            status: true,
            message: "Organization deleted successfully",
            data: result.rows[0]
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In delete_org Model",
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
//  member_list
//  Returns all verified members of an org with their role and user snapshot.
//  Paginated via offset + limit.
// ─────────────────────────────────────────────────────────────────────────────

const member_list = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            SELECT
                om.id           AS membership_id,
                om.role,
                om.is_verified,
                om.verified_at,
                om.created_at   AS joined_at,
                om.institutional_id,

                u.id            AS user_id,
                u.full_name,
                u.username,
                u.email,
                u.profile_image_url,
                u.university_name

            FROM unnySchema.organization_members om

            INNER JOIN unnySchema.users u
                    ON u.id = om.user_id

            WHERE
                om.organization_id = $1
                AND om.is_verified  = TRUE
                AND u.is_active     = TRUE

            ORDER BY om.created_at DESC

            LIMIT  $2
            OFFSET $3;
            `,
            [obj.org_id, obj.limit, obj.offset]
        );

        return {
            status: true,
            data: result.rows,
            count: result.rowCount
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In member_list Model",
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
//  join_request
//  Inserts a membership row with is_verified = FALSE.
//  Blocks duplicate requests via the UNIQUE (user_id, organization_id)
//  constraint — returns a friendly conflict message instead of crashing.
//  Role is set to UNVERIFIED_LECTURER or STUDENT based on what the user
//  declares; a CREATOR/LECTURER with higher level verifies them later.
// ─────────────────────────────────────────────────────────────────────────────

const join_request = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const member_id = snow.get_current_time();

        const result = await dbPool.query(
            `
            INSERT INTO unnySchema.organization_members (
                id,
                user_id,
                organization_id,
                role,
                is_verified,
                institutional_id,
                created_at,
                updated_at
            )
            VALUES (
                $1, $2, $3, $4,
                FALSE,
                $5,
                now(), now()
            )
            RETURNING
                id,
                role,
                is_verified,
                institutional_id,
                created_at;
            `,
            [
                member_id,
                obj.user_id,
                obj.org_id,
                obj.role,                  // 'STUDENT' or 'UNVERIFIED_LECTURER'
                obj.institutional_id ?? null
            ]
        );

        return {
            status: true,
            message: "Join request submitted successfully. Awaiting verification.",
            data: result.rows[0]
        };

    } catch (error) {

        // UNIQUE violation — already a member or pending
        if (error.code === "23505") {
            return {
                status: false,
                message: "You already have a membership or pending request for this organization",
                conflict: true
            };
        };

        // FK violation — org or user doesn't exist
        if (error.code === "23503") {
            return {
                status: false,
                message: "Organization not found",
                not_found: true
            };
        };

        console.error({
            system: "Internal Server Error In join_request Model",
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
//  verify
//  A CREATOR or LECTURER verifies a pending member and assigns them
//  a confirmed role (STUDENT or LECTURER).
//  The verifier must themselves be a verified member of the same org.
//  Both checks run in a single query — no extra round trip.
// ─────────────────────────────────────────────────────────────────────────────

const verify = async (obj) => {

    const dbPool = pgDB.getDB();
    const client = await dbPool.connect();

    try {

        await client.query("BEGIN");

        // Confirm the verifier is a verified CREATOR or LECTURER in this org
        const verifier_check = await client.query(
            `
            SELECT id FROM unnySchema.organization_members
            WHERE
                organization_id = $1
                AND user_id     = $2
                AND is_verified = TRUE
                AND role        IN ('CREATOR', 'LECTURER')
            LIMIT 1;
            `,
            [obj.org_id, obj.caller_id]
        );

        if (verifier_check.rowCount === 0) {
            await client.query("ROLLBACK");
            return {
                status: false,
                message: "You do not have permission to verify members in this organization",
                forbidden: true
            };
        };

        // Verify the target member and assign their role
        const result = await client.query(
            `
            UPDATE unnySchema.organization_members
            SET
                is_verified = TRUE,
                role        = $1,
                verified_at = now(),
                verified_by = $2,
                updated_at  = now()
            WHERE
                organization_id = $3
                AND user_id     = $4
                AND is_verified = FALSE
            RETURNING
                id,
                user_id,
                role,
                is_verified,
                verified_at;
            `,
            [obj.assigned_role, obj.caller_id, obj.org_id, obj.target_user_id]
        );

        if (result.rowCount === 0) {
            await client.query("ROLLBACK");
            return {
                status: false,
                message: "No pending request found for this user in this organization",
                not_found: true
            };
        };

        await client.query("COMMIT");

        return {
            status: true,
            message: "Member verified successfully",
            data: result.rows[0]
        };

    } catch (error) {

        await client.query("ROLLBACK");

        console.error({
            system: "Internal Server Error In verify Model",
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
//  change_role
//  Changes the role of an existing verified member.
//  Only a CREATOR of the org can do this.
//  Cannot demote the creator themselves.
// ─────────────────────────────────────────────────────────────────────────────

const change_role = async (obj) => {

    const dbPool = pgDB.getDB();
    const client = await dbPool.connect();

    try {

        await client.query("BEGIN");

        // Confirm caller is CREATOR of this org
        const creator_check = await client.query(
            `
            SELECT id FROM unnySchema.organization_members
            WHERE
                organization_id = $1
                AND user_id     = $2
                AND role        = 'CREATOR'
                AND is_verified = TRUE
            LIMIT 1;
            `,
            [obj.org_id, obj.caller_id]
        );

        if (creator_check.rowCount === 0) {
            await client.query("ROLLBACK");
            return {
                status: false,
                message: "Only the organization creator can change member roles",
                forbidden: true
            };
        };

        // Prevent self-demotion
        if (obj.caller_id === obj.target_user_id) {
            await client.query("ROLLBACK");
            return {
                status: false,
                message: "You cannot change your own role",
                forbidden: true
            };
        };

        const result = await client.query(
            `
            UPDATE unnySchema.organization_members
            SET
                role       = $1,
                updated_at = now()
            WHERE
                organization_id = $2
                AND user_id     = $3
                AND is_verified = TRUE
            RETURNING
                id,
                user_id,
                role,
                updated_at;
            `,
            [obj.new_role, obj.org_id, obj.target_user_id]
        );

        if (result.rowCount === 0) {
            await client.query("ROLLBACK");
            return {
                status: false,
                message: "Member not found in this organization",
                not_found: true
            };
        };

        await client.query("COMMIT");

        return {
            status: true,
            message: "Member role updated successfully",
            data: result.rows[0]
        };

    } catch (error) {

        await client.query("ROLLBACK");

        console.error({
            system: "Internal Server Error In change_role Model",
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
//  remove_member
//  Removes a member from the org.
//  A user can remove themselves (leave).
//  A CREATOR can remove anyone except themselves.
//  Neither action can remove the CREATOR row via this function
//  (org deletion is the only way to remove a creator).
// ─────────────────────────────────────────────────────────────────────────────

const remove_member = async (obj) => {

    const dbPool = pgDB.getDB();
    const client = await dbPool.connect();

    try {

        await client.query("BEGIN");

        const is_self_removal = obj.caller_id === obj.target_user_id;

        if (!is_self_removal) {

            // If not self, caller must be CREATOR of this org
            const creator_check = await client.query(
                `
                SELECT id FROM unnySchema.organization_members
                WHERE
                    organization_id = $1
                    AND user_id     = $2
                    AND role        = 'CREATOR'
                    AND is_verified = TRUE
                LIMIT 1;
                `,
                [obj.org_id, obj.caller_id]
            );

            if (creator_check.rowCount === 0) {
                await client.query("ROLLBACK");
                return {
                    status: false,
                    message: "You do not have permission to remove members from this organization",
                    forbidden: true
                };
            };

        };

        // Block removal of the CREATOR row
        const result = await client.query(
            `
            DELETE FROM unnySchema.organization_members
            WHERE
                organization_id = $1
                AND user_id     = $2
                AND role        != 'CREATOR'
            RETURNING id, user_id, role;
            `,
            [obj.org_id, obj.target_user_id]
        );

        if (result.rowCount === 0) {
            await client.query("ROLLBACK");
            return {
                status: false,
                message: "Member not found or the organization creator cannot be removed",
                not_found: true
            };
        };

        await client.query("COMMIT");

        return {
            status: true,
            message: is_self_removal
                ? "You have left the organization"
                : "Member removed successfully",
            data: result.rows[0]
        };

    } catch (error) {

        await client.query("ROLLBACK");

        console.error({
            system: "Internal Server Error In remove_member Model",
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
//  list_pending_members
//  Returns all unverified membership requests for an org.
//  Only accessible to CREATOR or verified LECTURER of that org.
//  The permission check is done in the controller — model just fetches.
// ─────────────────────────────────────────────────────────────────────────────

const list_pending_members = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            SELECT
                om.id               AS membership_id,
                om.role,
                om.institutional_id,
                om.created_at       AS requested_at,

                u.id                AS user_id,
                u.full_name,
                u.username,
                u.email,
                u.profile_image_url,
                u.university_name

            FROM unnySchema.organization_members om

            INNER JOIN unnySchema.users u
                    ON u.id = om.user_id

            WHERE
                om.organization_id = $1
                AND om.is_verified  = FALSE
                AND u.is_active     = TRUE

            ORDER BY om.created_at ASC

            LIMIT  $2
            OFFSET $3;
            `,
            [obj.org_id, obj.limit, obj.offset]
        );

        return {
            status: true,
            data: result.rows,
            count: result.rowCount
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In list_pending_members Model",
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
    list,
    org_and_owner_list,
    create_org,
    get_org_via_slug,
    update,
    update_logo,
    update_cover,
    delete_org,
    member_list,
    join_request,
    verify,
    change_role,
    remove_member,
    list_pending_members
};