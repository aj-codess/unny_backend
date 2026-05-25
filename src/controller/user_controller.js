import user_model from "./../model/user_model.js";

let get_profile = async (req,res) => {
    try{

        const obj  = {
            target_id : req.user
        };

        const returned_payload = await user_model.get_profile(obj);

        if(returned_payload.status == true){

            return res.status(200).json(returned_payload);

        } else if(returned_payload.status == false || returned_payload.not_found == true){

            return res.status(404).json(returned_payload);

        };

    } catch(error){

        console.error({
            system:"Internal Server Error At Get profile Model",
            name:error.name,
            message:error.message,
            stack:error.stack
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Getting User Profile"
        });

    };
};


let update_profile = async (req,res) => {
    try{

        obj.full_name   ?? null,
                obj.bio         ?? null,
                obj.website_url ?? null,
                obj.target_id

        const {full_name,bio,website_url} = req.body;

        const obj = {
            full_name:full_name.trim().toLowerCase(),
            bio:bio.trim(),
            website_url:website_url.trim(),
            target_id : req.user
        };

        const payload = await user_model.update_profile(obj);

        if(payload.status == true){

            return res.status(200).json(payload);
            
        };

        if(payload.status == false && payload.not_found == true){

            return res.status(404).json(payload);

        }

        return res.status(409).json(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error At Update Profile Model",
            name:error.name,
            message:error.message,
            stack:error.stack
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Updating User Profile"
        });

    };
};


let change_profile_image = (req,res) => {
    try{

        const {profile_url} = req.body;
        const target_id = req.user;

        const obj = {
            image_url : profile_url,
            target_id
        };

        const payload = user_model.change_profile_image(obj);

        if(payload.status == false){
            return res.status(409).json(payload);
        };

        return res.status(200).json(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error At Change Profile Model",
            name:error.name,
            message:error.message,
            stack:error.stack
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Changing User Profile Image"
        });

    };
};



let change_cover_image = (req,res) => {
    try{

    } catch(error){

    };
};



let change_account_password = (req,res) => {
    try{

    } catch(error){

    };
};



let delete_account = (req,res) => {
    try{

    } catch(error){

    };
};



let get_user_orgs = (req,res) => {
    try{

    } catch(error){

    };
};



let get_user_course_enrolled = (req,res) => {
    try{

    } catch(error){

    };
};




let get_pinned_courses = (req,res) => {
    try{

    } catch(error){

    };
};



export default {
    get_pinned_courses,
    get_user_course_enrolled,
    get_user_orgs,
    delete_account,
    change_account_password,
    change_cover_image,
    change_profile_image,
    update_profile,
    get_profile
}