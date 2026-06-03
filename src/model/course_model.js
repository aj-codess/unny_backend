import pgDB from "./../config/pgDB_config.js";
import snow from "./../utility/id_entry.js";


// ─────────────────────────────────────────────────────────────────────────────
//  get_course
//  Paginated list of courses — optionally filtered by org and/or status.
//  Returns course card data with enrollment count and document count
//  in a single query.
// ─────────────────────────────────────────────────────────────────────────────

const get_course = async (obj) => {

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
                c.created_at,

                o.id                 AS organization_id,
                o.name               AS organization_name,
                o.slug               AS organization_slug,
                o.profile_image_url  AS organization_logo,

                u.id                 AS creator_id,
                u.full_name          AS creator_name,
                u.profile_image_url  AS creator_avatar,

                COUNT(DISTINCT ce.id)   AS enrollment_count,
                COUNT(DISTINCT cd.id)
                    FILTER (WHERE cd.is_visible = TRUE)  AS document_count

            FROM unnySchema.courses c

            INNER JOIN unnySchema.organizations o
                    ON o.id = c.organization_id

            INNER JOIN unnySchema.users u
                    ON u.id = c.created_by

            LEFT JOIN unnySchema.course_enrollments ce
                   ON ce.course_id = c.id

            LEFT JOIN unnySchema.course_documents cd
                   ON cd.course_id = c.id

            WHERE
                ($1::BIGINT  IS NULL OR c.organization_id = $1)
                AND ($2::TEXT IS NULL OR c.status = $2::course_status)

            GROUP BY c.id, o.id, u.id

            ORDER BY c.created_at DESC

            LIMIT  $3
            OFFSET $4;
            `,
            [
                obj.organization_id ?? null,
                obj.status          ?? null,
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
            system: "Internal Server Error In get_course Model",
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
//  create_course
//  Creates a new course under an organization.
//  Caller must be a verified LECTURER or CREATOR in that org —
//  that check is enforced in the controller before calling this.
//  course id is a Snowflake.
// ─────────────────────────────────────────────────────────────────────────────

const create_course = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const course_id = snow.get_current_time();

        const result = await dbPool.query(
            `
            INSERT INTO unnySchema.courses (
                id,
                organization_id,
                created_by,
                title,
                course_code,
                slug,
                description,
                cover_image_url,
                status,
                start_date,
                end_date,
                created_at,
                updated_at
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8,
                'ACTIVE',
                $9, $10,
                now(), now()
            )
            RETURNING
                id,
                title,
                course_code,
                slug,
                description,
                cover_image_url,
                status,
                start_date,
                end_date,
                created_at;
            `,
            [
                course_id,
                obj.organization_id,
                obj.creator_id,
                obj.title,
                obj.course_code      ?? null,
                obj.slug,
                obj.description      ?? null,
                obj.cover_image_url  ?? null,
                obj.start_date       ?? null,
                obj.end_date         ?? null
            ]
        );

        return {
            status: true,
            message: "Course created successfully",
            data: result.rows[0]
        };

    } catch (error) {

        if (error.code === "23505") {
            return {
                status: false,
                message: "A course with that slug already exists",
                conflict: true
            };
        };

        if (error.code === "23503") {
            return {
                status: false,
                message: "Organization not found",
                not_found: true
            };
        };

        console.error({
            system: "Internal Server Error In create_course Model",
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
//  get_via_slug
//  Full course detail view by slug.
//  Returns enrollment count, document count, org, and creator info.
// ─────────────────────────────────────────────────────────────────────────────

const get_via_slug = async (obj) => {

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
                c.created_at,
                c.updated_at,

                o.id                 AS organization_id,
                o.name               AS organization_name,
                o.slug               AS organization_slug,
                o.profile_image_url  AS organization_logo,

                u.id                 AS creator_id,
                u.full_name          AS creator_name,
                u.profile_image_url  AS creator_avatar,
                u.university_name    AS creator_university,

                COUNT(DISTINCT ce.id)   AS enrollment_count,

                COUNT(DISTINCT cd.id)
                    FILTER (WHERE cd.is_visible = TRUE)  AS document_count

            FROM unnySchema.courses c

            INNER JOIN unnySchema.organizations o
                    ON o.id = c.organization_id

            INNER JOIN unnySchema.users u
                    ON u.id = c.created_by

            LEFT JOIN unnySchema.course_enrollments ce
                   ON ce.course_id = c.id

            LEFT JOIN unnySchema.course_documents cd
                   ON cd.course_id = c.id

            WHERE c.slug = $1

            GROUP BY c.id, o.id, u.id;
            `,
            [obj.slug]
        );

        if (result.rowCount === 0) {
            return {
                status: false,
                message: "Course not found",
                not_found: true
            };
        };

        return {
            status: true,
            data: result.rows[0]
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In get_via_slug Model",
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
//  update_meta_data
//  Partial update of course identity fields.
//  COALESCE keeps existing values for any field not supplied.
//  Ownership enforced in WHERE: only the original creator can update.
// ─────────────────────────────────────────────────────────────────────────────

const update_meta_data = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            UPDATE unnySchema.courses
            SET
                title       = COALESCE($1, title),
                course_code = COALESCE($2, course_code),
                description = COALESCE($3, description),
                updated_at  = now()
            WHERE
                id         = $4
                AND created_by = $5
            RETURNING
                id,
                title,
                course_code,
                slug,
                description,
                updated_at;
            `,
            [
                obj.title       ?? null,
                obj.course_code ?? null,
                obj.description ?? null,
                obj.course_id,
                obj.caller_id
            ]
        );

        if (result.rowCount === 0) {
            return {
                status: false,
                message: "Course not found or you do not have permission to update it",
                not_found: true
            };
        };

        return {
            status: true,
            message: "Course updated successfully",
            data: result.rows[0]
        };

    } catch (error) {

        if (error.code === "23505") {
            return {
                status: false,
                message: "A course with that slug already exists",
                conflict: true
            };
        };

        console.error({
            system: "Internal Server Error In update_meta_data Model",
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
//  load_date  (cover image update)
//  Named load_date in the controller — handles cover image upload.
//  Replaces cover_image_url with the new S3 URL.
//  Ownership enforced in WHERE clause.
// ─────────────────────────────────────────────────────────────────────────────

const load_date = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            UPDATE unnySchema.courses
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
            [obj.cover_image_url, obj.course_id, obj.caller_id]
        );

        if (result.rowCount === 0) {
            return {
                status: false,
                message: "Course not found or you do not have permission to update it",
                not_found: true
            };
        };

        return {
            status: true,
            message: "Course cover image updated",
            data: result.rows[0]
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In load_date Model",
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
//  archive
//  One-way status transition: ACTIVE → ARCHIVED.
//  Archived courses cannot be unarchived (academic integrity).
//  Only the course creator can archive.
// ─────────────────────────────────────────────────────────────────────────────

const archive = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            UPDATE unnySchema.courses
            SET
                status     = 'ARCHIVED',
                updated_at = now()
            WHERE
                id         = $1
                AND created_by = $2
                AND status     = 'ACTIVE'
            RETURNING
                id,
                title,
                slug,
                status,
                updated_at;
            `,
            [obj.course_id, obj.caller_id]
        );

        if (result.rowCount === 0) {
            return {
                status: false,
                message: "Course not found, already archived, or you do not have permission",
                not_found: true
            };
        };

        return {
            status: true,
            message: "Course archived successfully",
            data: result.rows[0]
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In archive Model",
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
//  delete_course
//  Hard delete — cascades to enrollments, documents, pinned_courses via FK.
//  Admin-level operation. No ownership restriction — any admin can delete.
// ─────────────────────────────────────────────────────────────────────────────

const delete_course = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            DELETE FROM unnySchema.courses
            WHERE id = $1
            RETURNING id, title, slug;
            `,
            [obj.course_id]
        );

        if (result.rowCount === 0) {
            return {
                status: false,
                message: "Course not found",
                not_found: true
            };
        };

        return {
            status: true,
            message: "Course deleted successfully",
            data: result.rows[0]
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In delete_course Model",
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
//  enroll
//  Enrolls the authenticated user in a course.
//  User must be a verified member of the org that owns the course —
//  that check is done in the controller.
//  Blocks duplicate enrollments via UNIQUE constraint.
// ─────────────────────────────────────────────────────────────────────────────

const enroll = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const enrollment_id = snow.get_current_time();

        const result = await dbPool.query(
            `
            INSERT INTO unnySchema.course_enrollments (
                id,
                course_id,
                user_id,
                enrolled_at
            )
            VALUES (
                $1, $2, $3, now()
            )
            RETURNING
                id,
                course_id,
                user_id,
                enrolled_at;
            `,
            [enrollment_id, obj.course_id, obj.user_id]
        );

        return {
            status: true,
            message: "Enrolled successfully",
            data: result.rows[0]
        };

    } catch (error) {

        if (error.code === "23505") {
            return {
                status: false,
                message: "You are already enrolled in this course",
                conflict: true
            };
        };

        if (error.code === "23503") {
            return {
                status: false,
                message: "Course not found",
                not_found: true
            };
        };

        console.error({
            system: "Internal Server Error In enroll Model",
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
//  enrolled
//  Returns a paginated list of all students enrolled in a course.
//  Accessible to the course creator or a verified LECTURER in that org.
// ─────────────────────────────────────────────────────────────────────────────

const enrolled = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            SELECT
                ce.id           AS enrollment_id,
                ce.enrolled_at,

                u.id            AS user_id,
                u.full_name,
                u.username,
                u.email,
                u.profile_image_url,
                u.university_name

            FROM unnySchema.course_enrollments ce

            INNER JOIN unnySchema.users u
                    ON u.id = ce.user_id

            WHERE
                ce.course_id = $1
                AND u.is_active = TRUE

            ORDER BY ce.enrolled_at DESC

            LIMIT  $2
            OFFSET $3;
            `,
            [obj.course_id, obj.limit, obj.offset]
        );

        return {
            status: true,
            data: result.rows,
            count: result.rowCount
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In enrolled Model",
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
//  unenroll_student
//  Lecturer-level: removes a specific student from a course.
//  The target student is identified by obj.target_user_id.
//  Used when a lecturer needs to remove a student they did not add.
// ─────────────────────────────────────────────────────────────────────────────

const unenroll_student = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        let result;

        if(obj.target_user_id != null){

            result = await dbPool.query(
            `
            DELETE FROM unnySchema.course_enrollments
            WHERE
                course_id = $1
                AND user_id   = $2 
                AND created_by = $3 
            RETURNING id, user_id, course_id;
            `,
            [obj.course_id, obj.target_user_id,obj.caller_id]
            );

        } else{

            result = await dbPool.query(
            `
            DELETE FROM unnySchema.course_enrollments
            WHERE
                course_id = $1
                AND user_id   = $2 
            RETURNING id, user_id, course_id;
            `,
            [obj.course_id, obj.caller_id]
        );

        };


        if (result.rowCount === 0) {
            return {
                status: false,
                message: "Enrollment not found",
                not_found: true
            };
        };

        return {
            status: true,
            message: "Student unenrolled successfully",
            data: result.rows[0]
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In unenroll_student Model",
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
//  pin
//  Pins a course to the authenticated user's profile.
//  Works for both ACTIVE and ARCHIVED courses.
//  Blocks duplicate pins via UNIQUE constraint.
// ─────────────────────────────────────────────────────────────────────────────

const pin = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const pin_id = snow.get_current_time();

        const result = await dbPool.query(
            `
            INSERT INTO unnySchema.pinned_courses (
                id,
                user_id,
                course_id,
                pinned_at
            )
            VALUES (
                $1, $2, $3, now()
            )
            RETURNING
                id,
                user_id,
                course_id,
                pinned_at;
            `,
            [pin_id, obj.user_id, obj.course_id]
        );

        return {
            status: true,
            message: "Course pinned successfully",
            data: result.rows[0]
        };

    } catch (error) {

        if (error.code === "23505") {
            return {
                status: false,
                message: "You have already pinned this course",
                conflict: true
            };
        };

        if (error.code === "23503") {
            return {
                status: false,
                message: "Course not found",
                not_found: true
            };
        };

        console.error({
            system: "Internal Server Error In pin Model",
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
//  unpin
//  Removes a pinned course from the authenticated user's profile.
// ─────────────────────────────────────────────────────────────────────────────

const unpin = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            DELETE FROM unnySchema.pinned_courses
            WHERE
                user_id   = $1
                AND course_id = $2
            RETURNING id, course_id;
            `,
            [obj.user_id, obj.course_id]
        );

        if (result.rowCount === 0) {
            return {
                status: false,
                message: "Pinned course not found",
                not_found: true
            };
        };

        return {
            status: true,
            message: "Course unpinned successfully",
            data: result.rows[0]
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In unpin Model",
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
//  get_docs
//  Returns all visible documents for a course, paginated.
//  Enrolled users see visible docs only.
//  Includes uploader snapshot for display.
// ─────────────────────────────────────────────────────────────────────────────

const get_docs = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            SELECT
                cd.id,
                cd.title,
                cd.description,
                cd.file_url,
                cd.thumbnail_url,
                cd.file_type,
                cd.file_size_bytes,
                cd.original_filename,
                cd.is_visible,
                cd.created_at,

                u.id                 AS uploader_id,
                u.full_name          AS uploader_name,
                u.profile_image_url  AS uploader_avatar

                

            FROM unnySchema.course_documents cd

            INNER JOIN unnySchema.users u
                    ON u.id = cd.uploaded_by

            WHERE
                cd.course_id  = $1
                AND cd.is_visible = TRUE

            ORDER BY cd.created_at DESC

            LIMIT  $2
            OFFSET $3;
            `,
            [obj.course_id, obj.limit, obj.offset]
        );

        return {
            status: true,
            data: result.rows,
            count: result.rowCount
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In get_docs Model",
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
//  upload_doc
//  Inserts a new document record after the file has been uploaded
//  to S3 by the controller. Lecturer-level access only.
// ─────────────────────────────────────────────────────────────────────────────

const upload_doc = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const doc_id = snow.genStringified_id();

        const result = await dbPool.query(
            `
            INSERT INTO unnySchema.course_documents (
                id,
                course_id,
                uploaded_by,
                title,
                description,
                file_url,
                thumbnail_url,
                file_type,
                file_size_bytes,
                original_filename,
                is_visible,
                created_at,
                updated_at
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                TRUE,
                now(), now()
            )
            RETURNING
                id,
                title,
                description,
                file_url,
                file_type,
                file_size_bytes,
                original_filename,
                is_visible,
                created_at;
            `,
            [
                doc_id,
                obj.course_id,
                obj.uploader_id,
                obj.title,
                obj.description      ?? null,
                obj.file_url,
                obj.thumbnail_url    ?? null,
                obj.file_type        ?? null,
                obj.file_size_bytes  ?? null,
                obj.original_filename ?? null
            ]
        );

        return {
            status: true,
            message: "Document uploaded successfully",
            data: result.rows[0]
        };

    } catch (error) {

        if (error.code === "23503") {
            return {
                status: false,
                message: "Course not found",
                not_found: true
            };
        };

        console.error({
            system: "Internal Server Error In upload_doc Model",
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
//  get_doc_about
//  Returns full metadata for a single document by docId.
//  Accessible to enrolled users. Respects is_visible flag.
// ─────────────────────────────────────────────────────────────────────────────

const get_doc_about = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            SELECT
                cd.id,
                cd.title,
                cd.description,
                cd.file_url,
                cd.thumbnail_url,
                cd.file_type,
                cd.file_size_bytes,
                cd.original_filename,
                cd.is_visible,
                cd.created_at,
                cd.updated_at,

                u.id                 AS uploader_id,
                u.full_name          AS uploader_name,
                u.profile_image_url  AS uploader_avatar

            FROM unnySchema.course_documents cd

            INNER JOIN unnySchema.users u
                    ON u.id = cd.uploaded_by

            WHERE
                cd.id         = $1
                AND cd.course_id  = $2
                AND cd.is_visible = TRUE;
            `,
            [obj.doc_id, obj.course_id]
        );

        if (result.rowCount === 0) {
            return {
                status: false,
                message: "Document not found",
                not_found: true
            };
        };

        return {
            status: true,
            data: result.rows[0]
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In get_doc_about Model",
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
//  update_doc_about
//  Updates document title and/or description.
//  Ownership enforced: only the original uploader can edit metadata.
// ─────────────────────────────────────────────────────────────────────────────

const update_doc_about = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            UPDATE unnySchema.course_documents
            SET
                title       = COALESCE($1, title),
                description = COALESCE($2, description),
                updated_at  = now()
            WHERE
                id          = $3
                AND course_id   = $4
                AND uploaded_by = $5
            RETURNING
                id,
                title,
                description,
                updated_at;
            `,
            [
                obj.title       ?? null,
                obj.description ?? null,
                obj.doc_id,
                obj.course_id,
                obj.caller_id
            ]
        );

        if (result.rowCount === 0) {
            return {
                status: false,
                message: "Document not found or you do not have permission to update it",
                not_found: true
            };
        };

        return {
            status: true,
            message: "Document updated successfully",
            data: result.rows[0]
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In update_doc_about Model",
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
//  doc_visibility
//  Toggles is_visible on a document.
//  Visibility value comes from the route param as a string ('true'/'false')
//  and is cast in the query.
//  Ownership enforced: only the uploader can toggle visibility.
// ─────────────────────────────────────────────────────────────────────────────

const doc_visibility = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            UPDATE unnySchema.course_documents
            SET
                is_visible = $1,
                updated_at = now()
            WHERE
                id          = $2
                AND course_id   = $3
                AND uploaded_by = $4
            RETURNING
                id,
                title,
                is_visible,
                updated_at;
            `,
            [
                obj.visibility,    // boolean — controller casts the string param
                obj.doc_id,
                obj.course_id,
                obj.caller_id
            ]
        );

        if (result.rowCount === 0) {
            return {
                status: false,
                message: "Document not found or you do not have permission to change its visibility",
                not_found: true
            };
        };

        return {
            status: true,
            message: `Document is now ${obj.visibility ? "visible" : "hidden"}`,
            data: result.rows[0]
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In doc_visibility Model",
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
//  delete_doc
//  Hard deletes a document record.
//  Ownership enforced: only the uploader can delete.
//  The actual S3 file deletion is handled in the controller
//  before this model function is called.
// ─────────────────────────────────────────────────────────────────────────────

const delete_doc = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            DELETE FROM unnySchema.course_documents
            WHERE
                id          = $1
                AND course_id   = $2
                AND uploaded_by = $3
            RETURNING
                id,
                title,
                file_url,
                original_filename;
            `,
            [obj.doc_id, obj.course_id, obj.caller_id]
        );

        if (result.rowCount === 0) {
            return {
                status: false,
                message: "Document not found or you do not have permission to delete it",
                not_found: true
            };
        };

        return {
            status: true,
            message: "Document deleted successfully",
            data: result.rows[0]
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In delete_doc Model",
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
    get_course,
    create_course,
    get_via_slug,
    update_meta_data,
    load_date,
    archive,
    delete_course,
    enroll,
    enrolled,
    unenroll_student,
    pin,
    unpin,
    get_docs,
    upload_doc,
    get_doc_about,
    update_doc_about,
    doc_visibility,
    delete_doc
};