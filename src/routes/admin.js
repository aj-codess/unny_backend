import express from "express";
import admin_controller from "./../controller/admin_controller.js";
import auth_mid from "./../middleware/authenticator.js";


const admin = express.Router();

// use offset and limit on listing routes


// get all users
admin.get("/users/:offset/:limit",(req,res)=>{
    // manually use middleware here
    admin_controller.getAllUsers(req,res);
});


// activate a users account
admin.patch("/users/:id/activate",(req,res)=>{
    admin_controller.activate(req,res);
});

// deactivate
admin.patch("/users/:id/dactivate",(req,res)=>{
    admin_controller.deactivate(req,res);---
});


// list all organization with owner info
admin.get("/organizations/:offset/:limit",(req,res)=>{

});

// list all cources accross all organization
admin.get("/courses/:offset/:limit",(req,res)=>{

});

// get statistic
admin.get("/stats",(req,res)=>{

});


export default admin;