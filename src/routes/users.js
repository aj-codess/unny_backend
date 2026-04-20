import express from "express";
import auth_mid from "./../middleware/authenticator.js";
import user_controller from "../controller/user_controller.js";


const users = express.Router();

// all routes here should be heavily auth-ed

// get public profile
users.get("/:id",(req,res)=>{
    auth_mid(req,res);
    user_controller.get_profile(req,res);
});

// update profile
users.patch("/:id",(req,res)=>{
    auth_mid(req,res);
    user_controller.update_profile(req,res);
});

// upload or replace profile image
users.patch("/:id/avatar",(req,res)=>{
    auth_mid(req,res);
    user_controller.change_profile_image(req,res);
});

// upload or update cover image
users.patch("/:id/cover",(req,res)=>{
    auth_mid(req,res);
    user_controller.change_cover_image(req,res);
});

// change own account password
users.patch("/:id/password",(req,res)=>{
    auth_mid(req,res);
    user_controller.change_account_password(req,res);
});

// soft delete own account
users.delete("/:id",(req,res)=>{
    auth_mid(req,res);
    user_controller.delete_account(req,res);
});

// list organizations user is a part of
users.get("/:id/organization/:offset/:limit",(req,res)=>{
    auth_mid(req,res);
    user_controller.get_user_orgs(req,res);
});

// list all courses user is enrolled in
users.get("/:id/courses/:offset/:limit",(req,res)=>{
    auth_mid(req,res);
    user_controller.get_user_course_enrolled(req,res);
});

// list all pinned courses
users.get("/:id/pinned-courses/:offset/:limit",(req,res)=>{
    auth_mid(req,res);
    user_controller.get_pinned_courses(req,res);
});

export default users;