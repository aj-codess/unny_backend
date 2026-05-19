import auth_model from "./../model/auth_model.js";
import token_helper from "./../service/token_helper.js";
import {resolveUniversityEmail} from "./../service/university_email_resolver.js";


let signup = async (req,res) => {
    try{

        const {email,student_email,fullname,dob,password,username,bio,profile_url,cover_url,device_info} = req.body;

        const uni_obj = resolveUniversityEmail(student_email);

        if(!uni_obj.found){
            return res.status(404).json({
                status:uni_obj.found,
                message:uni_obj.reason
            });
        };

        const hashed_password = token_helper.hashValue(`${password.trim()}${process.env.SALT}`);

        // verify if profile_url and cover_url exist in aws before appending onto the below obj

        let obj = {
            email:email?.trim(),
            uni_obj,
            fullname:fullname?.trim().toLowerCase(),
            dob:isNaN(dob)?dob:null,
            password:hashed_password,
            username:username?.trim().toLowerCase(),
            bio:bio?.trim(),
            profile_url:profile_url?.trim(),
            cover_url:cover_url?.trim(),
            university_name:uni_obj.university.name,
            device_info:device_info?.trim().toLowerCase()
        };

        const returned_payload = await auth_model.initial_writer(obj);

        if(returned_payload.status==true){

            res.setHeader("auth",`Bearer ${returned_payload.AT_}`);
            res.setHeader("x-refresh-token",`Bearer ${returned_payload.RT_}`);

            return res.status(200).json({
                status:returned_payload.status,
                data:returned_payload.payload,
                message:"Account Created Successfully"
            });

        } else{

            return res.status(400).json({
                status:false,
                message:"Error Signing Up"
            });

        }

    } catch(error){

        console.error({
            system:"Internal Server Error SigningUp",
            name:error.name,
            message:error.message,
            stack:error.stack
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error"
        });

    };
};




let signin = async (req,res) => {
    try{

        const {email,password,device_info} = req.body;

        let obj = {
            email:email.trim(),
            password:password.trim(),
            device_info:device_info?.trim().toLowerCase()
        };

        const returned_payload = await auth_model.signin(obj);

        if(returned_payload.not_found){
            res.status(404).json({status:returned_payload.status,message:returned_payload.message});
        };

        if(returned_payload.status==true){

            res.setHeader("auth",`Bearer ${returned_payload.AT_}`);
            res.setHeader("x-refresh-token",`Bearer ${returned_payload.RT_}`);

            return res.status(200).json({status:returned_payload.status,message:returned_payload.message});
        };

        return res.status(500).json(returned_payload);

    } catch(error){

        console.error({
            system:"Internal Server Error SigningUp",
            name:error.name,
            message:error.message,
            stack:error.stack
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Signing In"
        });

    };
};


let logout = async (req,res) => {
    try{

        const obj = {
            session_id:req.session,
            user_id:req.user,
            device_info:req.params.device_info
        }

        const returned_payload = await auth_model.logout_module(obj);

        if(returned_payload.status == true){

            res.clearCookie();
            res.setHeader("auth",``);
            res.setHeader("x-refresh-token",``);

            return res.status(200).json(returned_payload);

        } else{

            return res.status(409).json(returned_payload);

        };

    } catch(error){

        return res.status(500).json({
            status:false,
            message:"Internal Server Error with Logout"
        });

    };
};



let reassign_token = async (req,res) => {
    try{

        const authHeader = req.headers["x-refresh-token"];

        const tokenFromHeader =
            authHeader && authHeader.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : null;


        const tokenFromCookie = req.cookies?.chatAuth;

        const token_ = tokenFromHeader || tokenFromCookie;

        if (!token_) {
            console.log("no Refresh-token Provided");
            return res.status(401).json({ status: false, message: "No Refresh-token provided" });
        };

        const obj = {
            device_info : req.params.device_info,
            token : token_
        };

        const returned_payload = await auth_model.refresh_token(obj);

        if(returned_payload.status == true){

            res.setHeader("auth",`Bearer ${returned_payload.AT_}`);
            res.setHeader("x-refresh-token",`Bearer ${returned_payload.RT_}`);

              return res.status(200);

        } else{

            return res.status(409).json(returned_payload);

        };

    } catch(error){

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Refreshing Token"
        });

    };
};


// add an email service right here
let email_verify = (req,res) => {
    try{

    } catch(error){

    };
};



let resend_verification = (req,res) => {
    try{

    } catch(error){

    };
};


// email required
let trigger_forget = (req,res) => {
    try{

        const {email} = req.body;

        


    } catch(error){

    };
};



let trigger_new_pass = (req,res) => {
    try{

    } catch(error){

    };
};



let profile = (req,res) => {
    try{

    } catch(error){

    };
};


export default {
    signup,
    profile,
    trigger_forget,
    trigger_new_pass,
    resend_verification,
    email_verify,
    reassign_token,
    logout,
    signin
}