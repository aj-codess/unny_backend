import search_model from "./../model/search_model.js";


// ─────────────────────────────────────────────────────────────────────────────
//  build_search_params
//  Converts a raw query string from the request into the two forms
//  every model function needs:
//
//  ts_query  — safe to_tsquery string with prefix matching (:*)
//              e.g. "intro databases" → "intro:* & databases:*"
//              Each word becomes a prefix token so partial matches work.
//
//  ilike     — ILIKE wildcard pattern
//              e.g. "intro databases" → "%intro databases%"
//
//  Returns null if the query string is empty or whitespace-only.
// ─────────────────────────────────────────────────────────────────────────────

const build_search_params = (raw_query) => {

    if (!raw_query || typeof raw_query !== "string") return null;

    const trimmed = raw_query.trim();
    if (trimmed.length === 0) return null;

    // Sanitize: remove characters to_tsquery cannot handle
    // Keep letters, numbers, spaces, and hyphens only
    const sanitized = trimmed
        .replace(/[^a-zA-Z0-9\s\-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    if (sanitized.length === 0) return null;

    // Build prefix-match ts_query — each word gets :* so partial matches work
    const ts_query = sanitized
        .split(" ")
        .filter(Boolean)
        .map(word => `${word}:*`)
        .join(" & ");

    const ilike = `%${sanitized}%`;

    return { ts_query, ilike };

};


// ─────────────────────────────────────────────────────────────────────────────
//  parse_pagination
//  Safely parses limit and offset from query params.
//  Falls back to sensible defaults: limit 20, offset 0.
//  Hard-caps limit at 50 to prevent runaway queries.
// ─────────────────────────────────────────────────────────────────────────────

const parse_pagination = (query) => {

    let limit  = parseInt(query.limit,  10);
    let offset = parseInt(query.offset, 10);

    if (isNaN(limit)  || limit  < 1)  limit  = 20;
    if (isNaN(offset) || offset < 0)  offset = 0;
    if (limit > 50)                    limit  = 50;

    return { limit, offset };

};


// ─────────────────────────────────────────────────────────────────────────────
//  all
//  GET /search?q=...&limit=...&offset=...
//  Global search across organizations, courses, and visible documents.
//  Results are unified with a result_type discriminator field.
// ─────────────────────────────────────────────────────────────────────────────

let all = async (req, res) => {
    try {

        const params = build_search_params(req.query.q);

        if (!params) {
            return res.status(400).json({
                status: false,
                message: "Search query (q) is required and must not be empty"
            });
        };

        const { limit, offset } = parse_pagination(req.query);

        const result = await search_model.search_all({
            ...params,
            limit,
            offset
        });

        if (!result.status && result.invalid_query) {
            return res.status(400).json(result);
        };

        if (!result.status) {
            return res.status(500).json(result);
        };

        return res.status(200).json({
            status: true,
            query: req.query.q,
            count: result.count,
            data: result.data
        });

    } catch (error) {

        console.error({
            system: "Internal Server Error In all Search Controller",
            name: error.name,
            message: error.message,
            stack: error.stack
        });

        return res.status(500).json({
            status: false,
            message: "Internal Server Error"
        });

    };
};


// ─────────────────────────────────────────────────────────────────────────────
//  org
//  GET /search/organizations?q=...&limit=...&offset=...
//  Scoped search across organization name and description.
// ─────────────────────────────────────────────────────────────────────────────

let org = async (req, res) => {
    try {

        const params = build_search_params(req.query.q);

        if (!params) {
            return res.status(400).json({
                status: false,
                message: "Search query (q) is required and must not be empty"
            });
        };

        const { limit, offset } = parse_pagination(req.query);

        const result = await search_model.search_org({
            ...params,
            limit,
            offset
        });

        if (!result.status && result.invalid_query) {
            return res.status(400).json(result);
        };

        if (!result.status) {
            return res.status(500).json(result);
        };

        return res.status(200).json({
            status: true,
            query: req.query.q,
            count: result.count,
            data: result.data
        });

    } catch (error) {

        console.error({
            system: "Internal Server Error In org Search Controller",
            name: error.name,
            message: error.message,
            stack: error.stack
        });

        return res.status(500).json({
            status: false,
            message: "Internal Server Error"
        });

    };
};


// ─────────────────────────────────────────────────────────────────────────────
//  course
//  GET /search/courses?q=...&status=ACTIVE|ARCHIVED&limit=...&offset=...
//  Scoped search across course title, description, and course_code.
//  Optional ?status filter narrows to ACTIVE or ARCHIVED courses only.
// ─────────────────────────────────────────────────────────────────────────────

let course = async (req, res) => {
    try {

        const params = build_search_params(req.query.q);

        if (!params) {
            return res.status(400).json({
                status: false,
                message: "Search query (q) is required and must not be empty"
            });
        };

        const { limit, offset } = parse_pagination(req.query);

        // Validate status if provided
        const valid_statuses = ["ACTIVE", "ARCHIVED"];
        const status = req.query.status
            ? req.query.status.toUpperCase()
            : null;

        if (status && !valid_statuses.includes(status)) {
            return res.status(400).json({
                status: false,
                message: "status must be ACTIVE or ARCHIVED"
            });
        };

        const result = await search_model.search_course({
            ...params,
            status,
            limit,
            offset
        });

        if (!result.status && result.invalid_query) {
            return res.status(400).json(result);
        };

        if (!result.status) {
            return res.status(500).json(result);
        };

        return res.status(200).json({
            status: true,
            query: req.query.q,
            count: result.count,
            data: result.data
        });

    } catch (error) {

        console.error({
            system: "Internal Server Error In course Search Controller",
            name: error.name,
            message: error.message,
            stack: error.stack
        });

        return res.status(500).json({
            status: false,
            message: "Internal Server Error"
        });

    };
};


// ─────────────────────────────────────────────────────────────────────────────
//  docs
//  GET /search/documents?q=...&limit=...&offset=...
//  Scoped search across visible document titles and descriptions.
//  IDOR-safe: model enforces enrollment + org membership via SQL joins.
// ─────────────────────────────────────────────────────────────────────────────

let docs = async (req, res) => {
    try {

        const params = build_search_params(req.query.q);

        if (!params) {
            return res.status(400).json({
                status: false,
                message: "Search query (q) is required and must not be empty"
            });
        };

        const { limit, offset } = parse_pagination(req.query);

        const result = await search_model.search_docs({
            ...params,
            user_id: req.user,
            limit,
            offset
        });

        if (!result.status && result.invalid_query) {
            return res.status(400).json(result);
        };

        if (!result.status) {
            return res.status(500).json(result);
        };

        return res.status(200).json({
            status: true,
            query: req.query.q,
            count: result.count,
            data: result.data
        });

    } catch (error) {

        console.error({
            system: "Internal Server Error In docs Search Controller",
            name: error.name,
            message: error.message,
            stack: error.stack
        });

        return res.status(500).json({
            status: false,
            message: "Internal Server Error"
        });

    };
};


export default {
    all,
    org,
    course,
    docs
};