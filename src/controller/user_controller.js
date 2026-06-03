import user_model from "./../model/user_model.js";

// get public profile
let get_profile = async (req,res) => {
    try{

        const obj  = {
            target_id : req.params.id
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


let change_profile_image = async (req,res) => {
    try{

        const {profile_url} = req.body;

        const obj = {
            image_url : profile_url,
            target_id : req.user
        };

        const payload = await user_model.change_profile_image(obj);

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



let change_cover_image = async (req,res) => {
    try{

        const {image_url} = req.body;

        const obj = {
            target_id : req.user,
            image_url
        };

        const payload = await user_model.change_cover_image(obj);

        if(payload.status == false){
            return res.status(409).json(payload);
        };

        return res.status(200).json(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error At Change Cover Image Model",
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



let change_account_password = async (req,res) => {
    try{

        const {current_password,new_password} = req.body;
        
        const obj = {
            current_password,
            new_password,
            target_id : req.user,
            session_id : req.session
        };

        const payload = await user_model.change_account_password(obj);

        if(payload.status == false ){
            return res.status(409).json(payload);
        };

        return res.status(200).json(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error At Change Account Password",
            name:error.name,
            message:error.message,
            stack:error.stack
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Changing Account Password"
        });

    };
};



let delete_account = async (req,res) => {
    try{

        const obj = {
            target_id : req.user
        };

        const payload = await user_model.delete_account(obj);

        if(payload.status == false){
            return res.status(409).json(payload);
        };

        return res.status(200).json(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error At Delete Account Model",
            name:error.name,
            message:error.message,
            stack:error.stack
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Deleting User Account"
        });

    };
};



let get_user_orgs = async (req,res) => {
    try{

        const obj = {
            target_id : req.user,
            offset : req.params.offset,
            limit : req.params.limit
        };

        const payload = await user_model.get_user_orgs(obj);

        return res.status(200).json(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error At Get Account Org Model",
            name:error.name,
            message:error.message,
            stack:error.stack
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Getting Organizations"
        });

    };
};



let get_user_course_enrolled = async (req,res) => {
    try{

        const obj = {
            target_id : req.user,
            offset : req.params.offset,
            limit : req.params.limit
        };

        const payload = await user_model.get_user_course_enrolled(obj);

        return res.status(200).json(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error At Get Account Course Enrolled Model",
            name:error.name,
            message:error.message,
            stack:error.stack
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Getting Courses Enrolled"
        });

    };
};




let get_pinned_courses = async (req,res) => {
    try{

        const obj = {
            target_id : req.user,
            offset : req.params.offset,
            limit : req.params.limit
        };

        const payload = await user_model.get_pinned_courses(obj);

        return res.status(200).json(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error At Get Account Pinned Course Model",
            name:error.name,
            message:error.message,
            stack:error.stack
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Getting Pinned Courses"
        });

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