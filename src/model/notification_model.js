import pgDB from "./../config/pgDB_config.js";


// ─────────────────────────────────────────────────────────────────────────────
//  get_notif
//  Returns a paginated list of all notifications for the authenticated user.
//  Joins notification_types for the label and default_template
//  so the frontend can render a fallback message when message is NULL.
//  Ordered newest first.
// ─────────────────────────────────────────────────────────────────────────────

const get_notif = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            SELECT
                n.id,
                n.ref_id,
                n.ref_table,
                n.message,
                n.action_url,
                n.is_read,
                n.read_at,
                n.created_at,

                -- notification type context
                nt.code             AS type_code,
                nt.label            AS type_label,
                nt.default_template AS type_template,
                nt.channel

            FROM unnySchema.notifications n

            INNER JOIN unnySchema.notification_types nt
                    ON nt.id = n.type_id

            WHERE n.recipient_id = $1

            ORDER BY n.created_at DESC

            LIMIT  $2
            OFFSET $3;
            `,
            [obj.user_id, obj.limit, obj.offset]
        );

        return {
            status: true,
            data: result.rows,
            count: result.rowCount
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In get_notif Model",
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
//  get_unread_count
//  Returns only the unread notification count for the authenticated user.
//  Uses the partial index idx_notifications_unread for maximum speed —
//  this is the badge query, it runs on every page load.
// ─────────────────────────────────────────────────────────────────────────────

const get_unread_count = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            SELECT COUNT(*) AS unread_count
            FROM unnySchema.notifications
            WHERE
                recipient_id = $1
                AND is_read  = FALSE;
            `,
            [obj.user_id]
        );

        return {
            status: true,
            data: {
                unread_count: parseInt(result.rows[0].unread_count, 10)
            }
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In get_unread_count Model",
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
//  mark_as_read
//  Marks a single notification as read and stamps read_at.
//  Ownership enforced in WHERE — a user can only mark their own
//  notifications. Returns not_found if the id doesn't belong to them.
// ─────────────────────────────────────────────────────────────────────────────

const mark_as_read = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            UPDATE unnySchema.notifications
            SET
                is_read  = TRUE,
                read_at  = now()
            WHERE
                id           = $1
                AND recipient_id = $2
                AND is_read  = FALSE
            RETURNING
                id,
                is_read,
                read_at;
            `,
            [obj.notif_id, obj.user_id]
        );

        if (result.rowCount === 0) {
            return {
                status: false,
                message: "Notification not found or already marked as read",
                not_found: true
            };
        };

        return {
            status: true,
            message: "Notification marked as read",
            data: result.rows[0]
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In mark_as_read Model",
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
//  read_all
//  Bulk marks every unread notification as read for the authenticated user.
//  Returns the count of rows updated so the frontend can reset the badge.
// ─────────────────────────────────────────────────────────────────────────────

const read_all = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            UPDATE unnySchema.notifications
            SET
                is_read = TRUE,
                read_at = now()
            WHERE
                recipient_id = $1
                AND is_read  = FALSE;
            `,
            [obj.user_id]
        );

        return {
            status: true,
            message: "All notifications marked as read",
            updated_count: result.rowCount
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In read_all Model",
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
//  delete_notification
//  Hard deletes a single notification.
//  Ownership enforced in WHERE — users can only delete their own.
// ─────────────────────────────────────────────────────────────────────────────

const delete_notification = async (obj) => {

    const dbPool = pgDB.getDB();

    try {

        const result = await dbPool.query(
            `
            DELETE FROM unnySchema.notifications
            WHERE
                id           = $1
                AND recipient_id = $2
            RETURNING id;
            `,
            [obj.notif_id, obj.user_id]
        );

        if (result.rowCount === 0) {
            return {
                status: false,
                message: "Notification not found",
                not_found: true
            };
        };

        return {
            status: true,
            message: "Notification deleted"
        };

    } catch (error) {

        console.error({
            system: "Internal Server Error In delete_notification Model",
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
    get_notif,
    get_unread_count,
    mark_as_read,
    read_all,
    delete_notification
};