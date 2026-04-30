import auth_model from "./../model/auth_model.js";
import token_helper from "./../service/token_helper.js";
import {resolveUniversityEmail} from "./../service/university_email_resolver.js";


let signup = async (req,res) => {
    try{

        const {email,student_email,fullname,dob,password,username,bio,profile_url,cover_url} = req.body;

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
            university_name:uni_obj.university.name
        };

        const returned_payload = await auth_model.initial_writer(obj);

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


let signin = (req,res) => {
    try{

    } catch(error){

    };
};


let logout = (req,res) => {
    try{

    } catch(error){

    };
};



let reassign_token = (req,res) => {
    try{

    } catch(error){

    };
};



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



let trigger_forget = (req,res) => {
    try{

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