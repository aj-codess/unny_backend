import course_model from "./../model/course_model.js";

let get_course = async (req,res) => {
    try{

        const status_ = req.params.status;

        const obj = {
            organization_id:req.params.org_id,
            status:status_?.trim().toUpperCase(),
            limit:req.params.limit,
            offset:req.params.offset
        };

        const payload = await course_model.get_course(obj);

        return res.status(200).json(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error With Get Course Controller",
            name:error.name,
            stack:error.stack,
            message:error.message
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Getting Course"
        });

    };
};



let create_course = async (req,res) => {
    try{

        if(req.role == "STUDENT" || req.role == "UNVERIFIED_LECTURER"){
            return res.status(409).json({
                status:false,
                message:`Cannot Create Course As A Student Or An Unverified Lecturer Of The Organization`
            });
        };

        const {
        org_id,
        title,
        course_code,
        slug,
        description,
        cover_image_url,
        start_date,
        end_date
        } = req.body;

        const obj = {
            organization_id:org_id,
            title:title?.trim().toLowerCase(),
            course_code:course_code?.trim(),
            slug:slug?.trim().toLowerCase(),
            description:description?.trim().toLowerCase(),
            cover_image_url:cover_image_url?.trim(),
            start_date,
            end_date,
            creator_id:req.user
        };

        const payload = await course_model.create_course(obj);

        if(payload.status==true){
            return res.status(200).json(payload);
        };

        return res.status(409).json(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error With Create Course Controller",
            name:error.name,
            stack:error.stack,
            message:error.message
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Creating Course"
        });

    };
};



let get_via_slug = async (req,res) => {
    try{

        const slug = req.params.slug;

        const obj = {
            slug:slug?.trim().toLowerCase()
        };

        const payload = await course_model.get_via_slug(obj);

        if(payload.status==false && payload.not_found==true){
            return res.status(404).json(payload)
        } else if(payload.status==true){
            return res.status(200).jspn(payload)
        };

        return res.status(500).json(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error With Get Course With Slug Controller",
            name:error.name,
            stack:error.stack,
            message:error.message
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Getting Course Via Slug"
        });

    };
};



let update_meta_data = async (req,res) => {
    try{

        const {title,course_code,description,course_id} = req.body;

        const obj = {
            caller_id:req.user,
            title:title?.trim().toLowerCase(),
            couser_code:course_code?.trim(),
            description:description?.trim().toLowerCase(),
            course_id,
            caller_id:req.user
        };

        const payload = await course_model.update_meta_data(obj);

        if(payload.status == false && payload.not_found == true){
            return res.status(404).json(payload);
        } else if(payload.status == true){
            return res.status(200).json(payload);
        };

        return res.status(500).json(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error With update Course Meta data Controller",
            name:error.name,
            stack:error.stack,
            message:error.message
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Updating Course Meta Data"
        });

    };
};



let load_date = async (req,res) => {
    try{

    } catch(error){

    };
};



let archive = async (req,res) => {
    try{

    } catch(error){

    };
};



let delete_course = async (req,res) => {
    try{

    } catch(error){

    };
};




let enroll = async (req,res) => {
    try{

    } catch(error){

    };
};





let enrolled = async (req,res) => {
    try{

    } catch(error){

    };
};



let unenroll_student = async (req,res) => {
    try{

    } catch(error){

    };
};



let pin = async (req,res) => {
    try{

    } catch(error){

    };
};



let unpin = async (req,res) => {
    try{

    } catch(error){

    };
};



let get_docs = async (req,res) => {
    try{

    } catch(error){

    };
};



let upload_doc = async (req,res) => {
    try{

    } catch(error){

    };
};



let get_doc_about = async (req,res) => {
    try{

    } catch(error){

    };
};



let update_doc_about = async (req,res) => {
    try{

    } catch(error){

    };
};



let doc_visibility = async (req,res) => {
    try{

    } catch(error){

    };
};



let delete_doc = async (req,res) => {
    try{

    } catch(error){

    };
};



export default {
    delete_doc,
    doc_visibility,
    update_doc_about,
    get_doc_about,
    upload_doc,
    get_docs,
    unpin,
    pin,
    unenroll_student,
    enrolled,
    enroll,
    delete_course,
    archive,
    load_date,
    update_meta_data,
    get_via_slug,
    create_course,
    get_course
}