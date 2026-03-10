import express from "express";


const users = express.Router();

// all routes here should be heavily auth-ed

// get public profile
users.get("/:id",(req,res)=>{

});

// update profile
users.patch("/:id",(req,res)=>{

});

// upload or replace profile image
users.patch("/:id/avatar",(req,res)=>{

});

// upload or update cover image
users.patch("/:id/cover",(req,res)=>{

});

// change own account password
users.patch("/:id/password",(req,res)=>{

});

// soft delete own account
users.delete("/:id",(req,res)=>{

});

// list organizations user is a part of
users.get("/:id/organization/:offset/:limit",(req,res)=>{

});

// list all courses user is enrolled in
users.get("/:id/courses/:offset/:limit",(req,res)=>{

});

// list all pinned courses
users.get("/:id/pinned-courses/:offset/:limit",(req,res)=>{

});

export default users;