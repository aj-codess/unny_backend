import express from "express";
import auth_mid from "./../middleware/authenticator.js";
import notification_controller from "./../controller/notification_controller.js";


const notification = express.Router();

// use offset and limit on listing routes

// get notification with respect to organization
notification.get("/:offset/:limit",(req,res)=>{
    notification_controller.get_notif(req,res);
});


// get notification count
notification.get("/unread-count",(req,res)=>{
    notification_controller.get_unread_count(req,res);
});


// mark a notification as read
notification.patch("/:id/read",(req,res)=>{
    notification_controller.mark_as_read(req,res);
});


// mark all notification as read
notification.patch("/read-all",(req,res)=>{
    notification_controller.read_all(req,res);
});


// delete notification
notification.delete("/:id",(req,res)=>{
    notification_controller.delete_notification(req,res);
});

export default notification;