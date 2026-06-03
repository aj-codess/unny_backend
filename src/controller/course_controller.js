import course_model from "./../model/course_model.js";

let get_course = async (req,res) => {
    try{

        const obj = {
            organization_id:req.params.org_id,
            status : "ACTIVE",
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

        const slug = req.params.slug

        const obj = {
            slug:slug?.trim()
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

        const {title,course_code,description} = req.body;

        const obj = {
            caller_id:req.user,
            title:title?.trim(),
            couser_code:course_code?.trim(),
            description:description?.trim(),
            course_id:req.params.id,
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

        const {cover_image_url} = req.body;

        const obj = {
            course_id:req.params.id,
            cover_image_url:cover_image_url?.trim(),
            caller_id:req.user
        };

        const payload = await course_model.load_date(obj);

        if(payload.status == false && payload.not_found == true){
            return res.status(404).json(payload);
        } else if(payload.status == false){
           return res.status(500).json(payload);
        };

        return res.status(200).json(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error With update Course Cover Controller",
            name:error.name,
            stack:error.stack,
            message:error.message
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Updating Course Cover Image"
        });

    };
};



let archive = async (req,res) => {
    try{

        const obj = {
            course_id : req.params.id,
            caller_id : req.user
        };

        const payload = await course_model.archive(obj);

        if(payload.status == false && payload.not_found == true){
            return res.status(404).json(payload);
        } else if(payload.status == false){
           return res.status(500).json(payload);
        };

        return res.status(200).json(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error With Archive Course Controller",
            name:error.name,
            stack:error.stack,
            message:error.message
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Putting Course Under Archive"
        });

    };
};



let delete_course = async (req,res) => {
    try{

        const obj = {
            course_id : req.params.id
        };

        const payload = await course_model.delete_course(obj);

        if(payload.status == false && payload.not_found == true){
            return res.status(404).json(payload);
        } else if(payload.status == false){
           return res.status(500).json(payload);
        };

        return res.status(200).json(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error With Delete Course Controller",
            name:error.name,
            stack:error.stack,
            message:error.message
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Deleting Course"
        });

    };
};




let enroll = async (req,res) => {
    try{

        const obj = {
            course_id : req.params.id,
            user_id : req.user
        };

        const payload = await course_model.enroll(obj);

        if(payload.status == false && payload.not_found == true){
            return res.status(404).json(payload);
        } else if(payload.status == false && payload.conflict == true){
            return res.status(409).json(payload);
        } else if(payload.status == false){
           return res.status(500).json(payload);
        };

        return res.status(200).json(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error With Enroll Controller",
            name:error.name,
            stack:error.stack,
            message:error.message
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Enrolling Unto Course"
        });

    };
};





let enrolled = async (req,res) => {
    try{

        const obj = {
            course_id:req.params.id,
            offset:req.params.offset,
            limit:req.params.limit
        };

        const payload = await course_model.enrolled(obj);

        return res.status(200).json(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error With Enrolled Controller",
            name:error.name,
            stack:error.stack,
            message:error.message
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Listing Enrolled Students"
        });

    };
};



let unenroll_student = async (req,res) => {
    try{

        const obj = {
            course_id:req.params.id,
            target_user_id:req.params.target_id?req.params.target_id:null,
            caller_id: req.user
        };

        const payload = await course_model.unenroll_student(obj);

        if(payload.status == false && payload.not_found == true){
            return res.status(404).json(payload);
        } else if(payload.status == true){
            return res.status(200).json(payload);
        };

        return res.status(500).json(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error With Unenroll Student Controller",
            name:error.name,
            stack:error.stack,
            message:error.message
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Enrolling Student"
        });

    };
};



let pin = async (req,res) => {
    try{

        const obj = {
            course_id : req.params.id,
            user_id : req.user
        };

        const payload = await course_model.pin(obj);

        if(payload.status == false && payload.conflict == true){
            return res.status(409).json(payload);
        } else if(payload.status == false && payload.not_found == true){
            return res.status(404).json(payload);
        } else if(payload.status == true){
            return res.status(200).json(payload);
        };

        return res.status(500).json(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error With Pin Course Controller",
            name:error.name,
            stack:error.stack,
            message:error.message
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Pinning Course To Profile"
        });

    };
};



let unpin = async (req,res) => {
    try{

        const obj = {
            user_id:req.user,
            course_id:req.params.id
        };

        const payload = await course_model.unpin(obj);

        if(payload.status == false && payload.not_found == true){
            return res.status(404).json(payload);
        } else{
            return res.status(200).json(payload);
        };

    } catch(error){

        console.error({
            system:"Internal Server Error With Unpin Course Controller",
            name:error.name,
            stack:error.stack,
            message:error.message
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Unpinning Course From Profile"
        });

    };
};



let get_docs = async (req,res) => {
    try{

        const obj = {
            course_id:req.params.id,
            offset:req.params.offset,
            limit:req.params.limit,
            user_id:req.user
        };

        const payload = await course_model.get_docs(obj);

        return res.status(200).json(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error With Get Docs Controller",
            name:error.name,
            stack:error.stack,
            message:error.message
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Getting Course Docs"
        });

    };
};



let upload_doc = async (req,res) => {
    try{

        const {
            title,
            description,
            file_url,
            thumbnail_url,
            file_type,
            file_size_bytes,
            original_filename
        } = req.body;

        const obj = {
            course_id:req.params.id,
            uploader_id:req.user,
            title:title?.trim(),
            description:description?.trim(),
            file_url:file_url?.trim(),
            thumbnail_url:thumbnail_url?.trim(),
            file_type:file_type?.trim(),
            file_size_bytes,
            original_filename:original_filename?.trim()
        };

        const payload = await course_model.upload_doc(obj);

        if(payload.status==false && payload.not_found==true){
            return res.status(404).json(payload);
        } else{
            return res.status(200).json(payload);
        };

    } catch(error){

        console.error({
            system:"Internal Server Error With Upload Docs Controller",
            name:error.name,
            stack:error.stack,
            message:error.message
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Uploading Document"
        });

    };
};



let get_doc_about = async (req,res) => {
    try{

        const obj = {
            course_id:req.params.id,
            doc_id:req.params.docId
        };

        const payload = await course_model.get_doc_about(obj);

        if(payload.status == false && payload.not_found == true){
            return res.status(404).json(payload);
        } else if(payload.status == true){
            return res.status(200).json(payload);
        } else{
            return res.status(500).json(payload);
        };

    } catch(error){

        console.error({
            system:"Internal Server Error At Get Document About Controller",
            name:error.name,
            stack:error.stack,
            message:error.message
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Getting Document Meta Data"
        });

    };
};



let update_doc_about = async (req,res) => {
    try{

        const {title,description} = req.body;

        const obj = {
            title:title?.trim(),
            doc_id:req.params.docId,
            course_id:req.params.id,
            description:description?.trim(),
            caller_id:req.user
        };

        const payload = await course_model.update_doc_about(obj);

        if(payload.status == false && payload.not_found == true){
            return res.status(404).json(payload);
        } else if(payload.status == true){
            return res.status(200).json(payload);
        };

        return res.status(500).json(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error At Update Document About Controller",
            name:error.name,
            stack:error.stack,
            message:error.message
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Updating Document Meta Data"
        });

    };
};



let doc_visibility = async (req,res) => {
    try{

        const visibility = req.params.visibility;
        let bool;
        if(visibility.trim().toUpperCase=="TRUE"){
            bool = true;
        } else{
            bool = false;
        };

        const obj = {
            caller_id:req.user,
            visibility:bool,
            course_id:req.params.id,
            doc_id:req.params.docId
        };

        const payload = await course_model.doc_visibility(obj);

        if(payload.status == false && payload.not_found == true){
            return res.status(404).json(payload);
        } else if(payload.status == true){
            return res.status(200).json(payload);
        };

        return res.status(500).json(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error At Document Visibility Controller",
            name:error.name,
            stack:error.stack,
            message:error.message
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Changing Document Visibility"
        });

    };
};



let delete_doc = async (req,res) => {
    try{

        const obj = {
            doc_id:req.params.docId,
            course_id:req.params.id,
            caller_id:req.user
        };

        const payload = await course_model.delete_doc(obj);

        if(payload.status==false && payload.not_found==true){
            return res.status(404).json(payload);
        } else if(payload.status==true){
            return res.status(200).json(payload);
        };

        return res.status(500).json(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error At Delete Document Controller",
            name:error.name,
            stack:error.stack,
            message:error.message
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Deleting Document"
        });

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