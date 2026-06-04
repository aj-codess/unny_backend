import express from "express";
import admin_controller from "./../controller/admin_controller.js";
import auth_mid from "./../middleware/authenticator.js";
import organizations_controller from "../controller/organizations_controller.js";


const admin = express.Router();

// use offset and limit on listing routes


// get all users
admin.get("/users/:offset/:limit",(req,res)=>{
    // manually use middleware here
    auth_mid(req,res);
    admin_controller.getAllUsers(req,res);
});


// activate a users account
admin.patch("/users/:id/activate",(req,res)=>{
    // manually use middleware here
    auth_mid(req,res);
    admin_controller.activate(req,res);
});

// deactivate
admin.patch("/users/:id/deactivate",(req,res)=>{
    // manually use middleware here
    auth_mid(req,res);
    admin_controller.deactivate(req,res);
});


// bound by the platform manager
// list all organization with owner info
admin.get("/organizations/:offset/:limit",(req,res)=>{
    // manually use middleware here
    auth_mid(req,res);
    organizations_controller.org_and_owner_list(req,res)
});


// bound by platform manager
// list all cources accross all organization
admin.get("/courses/:offset/:limit",(req,res)=>{
    // manually use middleware here
    auth_mid(req,res);
    
});


// bound by platform manager
// get statistic
admin.get("/stats",(req,res)=>{
    // manually use middleware here
    auth_mid(req,res);

});


export default admin;