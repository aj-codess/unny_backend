import pgDB from "./../config/pgDB_config.js";


// ─────────────────────────────────────────────────────────────────────────────
//  SEARCH STRATEGY
//
//  Every query uses a two-tier approach:
//
//  1. to_tsvector / to_tsquery (PostgreSQL full-text search)
//     — ranking-aware, language-stemmed, fast on large datasets
//     — used as the primary filter
//
//  2. ILIKE fallback via OR
//     — catches partial word matches that full-text misses
//     — e.g. searching "intro" matches "Introduction to Databases"
//       even without a prefix index
//
//  Results are ranked by ts_rank so the most relevant rows surface first.
//  Pagination via LIMIT / OFFSET on all queries.
//  The caller always supplies a sanitized query string — no raw input
//  is ever interpolated into SQL; parameterized queries throughout.
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
//  search_all
//  Global search across organizations, courses, and visible documents.
//  Returns a unified array with a `result_type` discriminator field
//  so the frontend can render mixed results in a single list.
//  Each domain runs as a separate CTE then all are UNIONed and re-ranked.
// ─────────────────────────────────────────────────────────────────────────────

const search_all = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            WITH org_results AS (

                SELECT
                    'organization'          AS result_type,
                    o.id::TEXT              AS id,
                    o.name                  AS title,
                    o.description           AS description,
                    o.slug                  AS slug,
                    o.profile_image_url     AS image_url,
                    NULL::TEXT              AS secondary_label,
                    o.created_at,
                    ts_rank(
                        to_tsvector('english', COALESCE(o.name,'') || ' ' || COALESCE(o.description,'')),
                        to_tsquery('english', $1)
                    )                       AS rank

                FROM unnySchema.organizations o

                WHERE
                    to_tsvector('english', COALESCE(o.name,'') || ' ' || COALESCE(o.description,''))
                        @@ to_tsquery('english', $1)
                    OR o.name        ILIKE $2
                    OR o.description ILIKE $2

            ),

            course_results AS (

                SELECT
                    'course'                AS result_type,
                    c.id::TEXT              AS id,
                    c.title                 AS title,
                    c.description           AS description,
                    c.slug                  AS slug,
                    c.cover_image_url       AS image_url,
                    c.course_code           AS secondary_label,
                    c.created_at,
                    ts_rank(
                        to_tsvector('english', COALESCE(c.title,'') || ' ' || COALESCE(c.description,'') || ' ' || COALESCE(c.course_code,'')),
                        to_tsquery('english', $1)
                    )                       AS rank

                FROM unnySchema.courses c

                WHERE
                    to_tsvector('english', COALESCE(c.title,'') || ' ' || COALESCE(c.description,'') || ' ' || COALESCE(c.course_code,''))
                        @@ to_tsquery('english', $1)
                    OR c.title       ILIKE $2
                    OR c.description ILIKE $2
                    OR c.course_code ILIKE $2

            ),

            doc_results AS (

                SELECT
                    'document'              AS result_type,
                    cd.id::TEXT             AS id,
                    cd.title                AS title,
                    cd.description          AS description,
                    NULL::TEXT              AS slug,
                    cd.thumbnail_url        AS image_url,
                    cd.file_type            AS secondary_label,
                    cd.created_at,
                    ts_rank(
                        to_tsvector('english', COALESCE(cd.title,'') || ' ' || COALESCE(cd.description,'')),
                        to_tsquery('english', $1)
                    )                       AS rank

                FROM unnySchema.course_documents cd

                WHERE
                    cd.is_visible = TRUE
                    AND (
                        to_tsvector('english', COALESCE(cd.title,'') || ' ' || COALESCE(cd.description,''))
                            @@ to_tsquery('english', $1)
                        OR cd.title       ILIKE $2
                        OR cd.description ILIKE $2
                    )

            )

            SELECT * FROM org_results
            UNION ALL
            SELECT * FROM course_results
            UNION ALL
            SELECT * FROM doc_results

            ORDER BY rank DESC, created_at DESC

            LIMIT  $3
            OFFSET $4;
            `,
            [
                obj.ts_query,
                obj.ilike, 
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

        // to_tsquery throws if the query string is syntactically invalid
        if (error.code === "42601" || error.routine === "toTSQuery") {
            return {
                status: false,
                message: "Invalid search term",
                invalid_query: true
            };
        };

        console.error({
            system: "Internal Server Error In search_all Model",
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
//  search_org
//  Searches organizations by name and description.
//  Returns full org card data including member count and course count
//  so the results page can render complete cards without a second fetch.
// ─────────────────────────────────────────────────────────────────────────────

const search_org = async (obj) => {

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
                o.access_mode,
                o.created_at,

                COUNT(DISTINCT om.id)
                    FILTER (WHERE om.is_verified = TRUE)   AS member_count,

                COUNT(DISTINCT c.id)                       AS course_count,

                ts_rank(
                    to_tsvector('english', COALESCE(o.name,'') || ' ' || COALESCE(o.description,'')),
                    to_tsquery('english', $1)
                )                                          AS rank

            FROM unnySchema.organizations o

            LEFT JOIN unnySchema.organization_members om
                   ON om.organization_id = o.id

            LEFT JOIN unnySchema.courses c
                   ON c.organization_id = o.id

            WHERE
                to_tsvector('english', COALESCE(o.name,'') || ' ' || COALESCE(o.description,''))
                    @@ to_tsquery('english', $1)
                OR o.name        ILIKE $2
                OR o.description ILIKE $2

            GROUP BY o.id

            ORDER BY rank DESC, o.created_at DESC

            LIMIT  $3
            OFFSET $4;
            `,
            [obj.ts_query, obj.ilike, obj.limit, obj.offset]
        );

        return {
            status: true,
            data: result.rows,
            count: result.rowCount
        };

    } catch (error) {

        if (error.code === "42601" || error.routine === "toTSQuery") {
            return {
                status: false,
                message: "Invalid search term",
                invalid_query: true
            };
        };

        console.error({
            system: "Internal Server Error In search_org Model",
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
//  search_course
//  Searches courses by title, description, and course_code.
//  Optionally filtered by status (ACTIVE | ARCHIVED) via obj.status.
//  Returns enrollment count and org context for each course card.
// ─────────────────────────────────────────────────────────────────────────────

const search_course = async (obj) => {

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

                o.id                AS organization_id,
                o.name              AS organization_name,
                o.slug              AS organization_slug,
                o.profile_image_url AS organization_logo,

                COUNT(DISTINCT ce.id)  AS enrollment_count,

                ts_rank(
                    to_tsvector('english',
                        COALESCE(c.title,'') || ' ' ||
                        COALESCE(c.description,'') || ' ' ||
                        COALESCE(c.course_code,'')
                    ),
                    to_tsquery('english', $1)
                )                   AS rank

            FROM unnySchema.courses c

            INNER JOIN unnySchema.organizations o
                    ON o.id = c.organization_id

            LEFT JOIN unnySchema.course_enrollments ce
                   ON ce.course_id = c.id

            WHERE
                (
                    to_tsvector('english',
                        COALESCE(c.title,'') || ' ' ||
                        COALESCE(c.description,'') || ' ' ||
                        COALESCE(c.course_code,'')
                    ) @@ to_tsquery('english', $1)
                    OR c.title       ILIKE $2
                    OR c.description ILIKE $2
                    OR c.course_code ILIKE $2
                )
                AND ($3::TEXT IS NULL OR c.status = $3::course_status)

            GROUP BY c.id, o.id

            ORDER BY rank DESC, c.created_at DESC

            LIMIT  $4
            OFFSET $5;
            `,
            [
                obj.ts_query,
                obj.ilike,
                obj.status ?? null,
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

        if (error.code === "42601" || error.routine === "toTSQuery") {
            return {
                status: false,
                message: "Invalid search term",
                invalid_query: true
            };
        };

        console.error({
            system: "Internal Server Error In search_course Model",
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
//  search_docs
//  Searches visible documents by title and description.
//  IDOR-safe: only surfaces documents where the requesting user
//  is both enrolled in the course AND a verified org member.
//  Returns course and uploader context for each document card.
// ─────────────────────────────────────────────────────────────────────────────

const search_docs = async (obj) => {

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
                cd.created_at,

                c.id                AS course_id,
                c.title             AS course_title,
                c.slug              AS course_slug,

                o.id                AS organization_id,
                o.name              AS organization_name,
                o.slug              AS organization_slug,

                u.id                AS uploader_id,
                u.full_name         AS uploader_name,
                u.profile_image_url AS uploader_avatar,

                ts_rank(
                    to_tsvector('english', COALESCE(cd.title,'') || ' ' || COALESCE(cd.description,'')),
                    to_tsquery('english', $1)
                )                   AS rank

            FROM unnySchema.course_documents cd

            INNER JOIN unnySchema.courses c
                    ON c.id = cd.course_id

            INNER JOIN unnySchema.organizations o
                    ON o.id = c.organization_id

            INNER JOIN unnySchema.users u
                    ON u.id = cd.uploaded_by

            -- IDOR guard: caller must be enrolled in the course
            INNER JOIN unnySchema.course_enrollments ce
                    ON  ce.course_id = cd.course_id
                    AND ce.user_id   = $3

            -- IDOR guard: caller must be a verified org member
            INNER JOIN unnySchema.organization_members om
                    ON  om.organization_id = c.organization_id
                    AND om.user_id         = $3
                    AND om.is_verified     = TRUE

            WHERE
                cd.is_visible = TRUE
                AND (
                    to_tsvector('english', COALESCE(cd.title,'') || ' ' || COALESCE(cd.description,''))
                        @@ to_tsquery('english', $1)
                    OR cd.title       ILIKE $2
                    OR cd.description ILIKE $2
                )

            ORDER BY rank DESC, cd.created_at DESC

            LIMIT  $4
            OFFSET $5;
            `,
            [
                obj.ts_query,
                obj.ilike,
                obj.user_id,
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

        if (error.code === "42601" || error.routine === "toTSQuery") {
            return {
                status: false,
                message: "Invalid search term",
                invalid_query: true
            };
        };

        console.error({
            system: "Internal Server Error In search_docs Model",
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
    search_all,
    search_org,
    search_course,
    search_docs
};