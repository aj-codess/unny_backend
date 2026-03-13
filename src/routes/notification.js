import express from "express";


const notification = express.Router();

// use offset and limit on listing routes

// get notification with respect to organization
notification.get("/:offset/:limit",(req,res)=>{

});


// get notification count
notification.get("/unread-count",(req,res)=>{

});


// mark a notification as read
notification.patch("/:id/read",(req,res)=>{

});


// mark all notification as read
notification.patch("/read-all",(req,res)=>{

});


// delete notification
notification.delete("/:id",(req,res)=>{

});

export default notification;