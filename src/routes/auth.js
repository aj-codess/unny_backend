import express from "express";


const auth = express.Router();

// use offset and limit on listing routes

// open route
auth.post("/register",(req,res)=>{

});


//open route
auth.post("/login",(req,res)=>{

});


//apply auth
auth.post("/logout",(req,res)=>{

});


//apply auth
auth.post("/refresh",(req,res)=>{

});


//open route
auth.post("/verify-email",(req,res)=>{

});


//open route
auth.post("/resend-verification-email",(req,res)=>{

});


// open route
auth.post("/forgot-password",(req,res)=>{

});


//open route
auth.post("/reset-password",(req,res)=>{

});


//apply auth
auth.get("/me",(req,res)=>{

});

export default auth;