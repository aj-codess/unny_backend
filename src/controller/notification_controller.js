import notification_model from "./../model/notification_model.js";


// ─────────────────────────────────────────────────────────────────────────────
//  get_notif
//  GET /notifications/:offset/:limit
//  Returns paginated notifications for the authenticated user.
// ─────────────────────────────────────────────────────────────────────────────

let get_notif = async (req, res) => {
    try {

        const limit  = parseInt(req.params.limit,  10);
        const offset = parseInt(req.params.offset, 10);

        if (isNaN(limit) || isNaN(offset) || limit < 1 || offset < 0) {
            return res.status(400).json({
                status: false,
                message: "Invalid pagination parameters"
            });
        };

        const result = await notification_model.get_notif({
            user_id: req.user,
            limit,
            offset
        });

        if (!result.status) {
            return res.status(500).json(result);
        };

        return res.status(200).json({
            status: true,
            count: result.count,
            data: result.data
        });

    } catch (error) {

        console.error({
            system: "Internal Server Error In get_notif Controller",
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
//  get_unread_count
//  GET /notifications/unread-count
//  Returns the unread notification count — used for badge display.
// ─────────────────────────────────────────────────────────────────────────────

let get_unread_count = async (req, res) => {
    try {

        const result = await notification_model.get_unread_count({
            user_id: req.user
        });

        if (!result.status) {
            return res.status(500).json(result);
        };

        return res.status(200).json({
            status: true,
            data: result.data
        });

    } catch (error) {

        console.error({
            system: "Internal Server Error In get_unread_count Controller",
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
//  mark_as_read
//  PATCH /notifications/:id/read
//  Marks a single notification as read. Ownership enforced in model.
// ─────────────────────────────────────────────────────────────────────────────

let mark_as_read = async (req, res) => {
    try {

        const notif_id = req.params.id;

        if (!notif_id) {
            return res.status(400).json({
                status: false,
                message: "Notification ID is required"
            });
        };

        const result = await notification_model.mark_as_read({
            notif_id,
            user_id: req.user
        });

        if (!result.status && result.not_found) {
            return res.status(404).json(result);
        };

        if (!result.status) {
            return res.status(500).json(result);
        };

        return res.status(200).json({
            status: true,
            message: result.message,
            data: result.data
        });

    } catch (error) {

        console.error({
            system: "Internal Server Error In mark_as_read Controller",
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
//  read_all
//  PATCH /notifications/read-all
//  Bulk marks all unread notifications as read for the current user.
// ─────────────────────────────────────────────────────────────────────────────

let read_all = async (req, res) => {
    try {

        const result = await notification_model.read_all({
            user_id: req.user
        });

        if (!result.status) {
            return res.status(500).json(result);
        };

        return res.status(200).json({
            status: true,
            message: result.message,
            updated_count: result.updated_count
        });

    } catch (error) {

        console.error({
            system: "Internal Server Error In read_all Controller",
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
//  delete_notification
//  DELETE /notifications/:id
//  Deletes a single notification. Ownership enforced in model.
// ─────────────────────────────────────────────────────────────────────────────

let delete_notification = async (req, res) => {
    try {

        const notif_id = req.params.id;

        if (!notif_id) {
            return res.status(400).json({
                status: false,
                message: "Notification ID is required"
            });
        };

        const result = await notification_model.delete_notification({
            notif_id,
            user_id: req.user
        });

        if (!result.status && result.not_found) {
            return res.status(404).json(result);
        };

        if (!result.status) {
            return res.status(500).json(result);
        };

        return res.status(200).json({
            status: true,
            message: result.message
        });

    } catch (error) {

        console.error({
            system: "Internal Server Error In delete_notification Controller",
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
    get_notif,
    get_unread_count,
    mark_as_read,
    read_all,
    delete_notification
};