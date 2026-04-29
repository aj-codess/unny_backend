import uni_mail_resolver from "./../service/university_email_resolver.js";

let initial_writer = async (obj) => {
    try{

        

    } catch(error){

        return{
            status:false,
            message:"Internal Server Error"
        };

        console.error({
            system:"Internal Server Error With Signup",
            name:error.name,
            message:error.message,
            stack:error.stack
        });

    };
    return {
        status:false,
        message:"Invalid data"
    };
};


export default {
    initial_writer
};