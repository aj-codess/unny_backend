import express from "express";


const auth = express.Router();

// use offset and limit on listing routes

// open route
auth.post("/register",(req,res)=>{
    auth_controller.signup(req,res);
});


//open route
auth.post("/login",(req,res)=>{
    auth_controller.signin(req,res);
});


//apply auth
auth.post("/logout",(req,res)=>{
    auth_controller.logout(req,res);
});


//apply auth
auth.post("/refresh",(req,res)=>{
    auth_controller.reassign_token(req,res);
});


//open route
auth.post("/verify-email",(req,res)=>{
    auth_controller.email_verify(req,res);
});


//open route
auth.post("/resend-verification-email",(req,res)=>{
    auth_controller.resend_verification(req,res);
});


// open route
auth.post("/forgot-password",(req,res)=>{
    auth_controller.trigger_forget(req,res);
});


//open route
auth.post("/reset-password",(req,res)=>{
    auth_controller.trigger_new_pass(req,res);
});


//apply auth
auth.get("/me",(req,res)=>{
    auth_controller.profile(req,res);
}); 

export default auth;