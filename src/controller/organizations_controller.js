import org_model from "./../model/org_model.js";

let list = async (req,res) => {
    try{

        const obj = {
            offset:req.params.offset,
            limit:req.params.limit
        };

        const payload = await org_model.list(obj);

        return res.status(200).json(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error At Listing Organization",
            stack:error.stack,
            name:error.name,
            message:error.message
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Getting Organization List"
        });

    };
};



let org_and_owner_list = async (req,res) => {
    try{

        const obj = {
            offset:req.params.offset,
            limit:req.params.limit
        };

        const payload = await org_model.org_and_owner_list(obj);

        return res.status(200).json(payload);

    } catch(error){


        console.error({
            system:"Internal Server Error At Listing Organization Owners Model",
            stack:error.stack,
            name:error.name,
            message:error.message
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Getting Organizations Owner List"
        });

    };
};



let create_org = async (req,res) => {
    try{

        const {
            name,
            slug,
            profile_image_url,
            cover_image_url,
            description,
            website_url,
            contact_email,
            access_mode,
            location,
            type
        } = req.body;

        // write the name of the organization to the registry if it does not exist

        const obj = {
            name:name?.trim(),
            slug:slug?.trim(),
            profile_image_url:profile_image_url?.trim(),
            cover_image_url:cover_image_url?.trim(),
            description:description?.trim().toLowerCase(),
            website_url:website_url?.trim(),
            contact_email:contact_email?.trim(),
            access_mode:access_mode?.trim(),
            creator_id : req.user
        };

        const created_payload = await org_model.create_org(obj);

        if(created_payload.status==false && created_payload.conflict==true){
            return res.status(409).json(created_payload);
        } else if(created_payload.status==true){
            return res.status(200).json(created_payload);
        } else{
            return res.status(500).json(created_payload);
        };

    } catch(error){

        console.error({
            system:"Internal Server Error At Creating Organization Model",
            stack:error.stack,
            name:error.name,
            message:error.message
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Creating Organization"
        });

    };
};



let get_org_via_slug = async (req,res) => {
    try{

        const obj = {
            slug:req.params.slug
        };

        const payload = await org_model.get_org_via_slug(obj);

        if(payload.status==false && payload.not_found==true){
            return res.status(404).json(payload);
        } else if(payload.status==true){
            return res.status(200).json(payload);
        } else{
            return res.status(500).json(payload);
        };

    } catch(error){

        console.error({
            system:"Internal Server Error At Get Organization Via Slug Model",
            stack:error.stack,
            name:error.name,
            message:error.message
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Getting Organization Via Slug"
        });

    };
};



let update = async (req,res) => {
    try{

        const {name,slug,description,website_url,contact_email,access_mode,org_id} = req.body;

        const obj = {
            name:name?.trim(),
            slug:slug?.trim(),
            description:description?.trim().toLowerCase(),
            website_url:website_url?.trim(),
            contact_email:contact_email?.trim(),
            access_mode:access_mode?.trim(),
            org_id,
            caller_id:req.user
        };

        const payload = await org_model.update(obj);

        if(payload.status==true){
            return res.status(200).json(payload);
        };

        return res.status(409).json(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error At Update Org Model",
            stack:error.stack,
            name:error.name,
            message:error.message
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Updating Organization"
        });

    };
};



let update_logo = async (req,res) => {
    try{

        const {org_id,image_url} = req.body;

        const obj = {
            org_id,
            image_url:image_url?.trim(),
            caller_id : req.user
        };

        const payload = await org_model.update_logo(obj);

        if(payload.status==true){
            return res.status(200).json(payload);
        };
        
        return res.status(409).json(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error At Update Org Logo",
            stack:error.stack,
            name:error.name,
            message:error.message
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Updating Organization Logo"
        });

    };
};



let update_cover = async (req,res) => {
    try{

        const {org_id,image_url} = req.body;

        const obj = {
            org_id,
            image_url:image_url?.trim(),
            caller_id:req.user
        }

        const payload = await org_model.update_cover(obj);

        if(payload.status==true){
            return res.status(200).hjson(payload);
        };

        return res.status(409).json(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error At Update Org Cover Model",
            stack:error.stack,
            name:error.name,
            message:error.message
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Updating Organization Cover Image"
        });

    };
};


let delete_org = async (req,res) => {
    try{

        const obj = {
            org_id:req.params.org_id,
            caller_id:req.user
        };

        const payload = await org_model.delete_org(obj);

        if(payload.status==true){
            return res.status(200).json(payload);
        };

        return res.status(409).json(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error At Delete Org Model",
            stack:error.stack,
            name:error.name,
            message:error.message
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Deleting Organization"
        });

    };
};


let member_list = async (req,res) => {
    try{

        const obj = {
            org_id:req.params.org_id,
            offset:req.params.offset,
            limit:req.params.limit
        };

        const payload = await org_model.member_list(obj);

        return res.status(200).json(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error At List Org Member Model",
            stack:error.stack,
            name:error.name,
            message:error.message
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Getting Member List"
        });

    };
};




let join_request = async (req,res) => {
    try{

        const {org_id,role} = req.body;

        const obj = {
            org_id,
            role:role?.trim().toUpperCase(),
            user_id:req.user
        };

        const payload = await org_model.join_request(obj);

        if(payload.status==true){
            return res.status(200).json(payload);
        };

        return res.status(500).json(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error At Join Request Model",
            stack:error.stack,
            name:error.name,
            message:error.message
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Joining Organization"
        });

    };
};




let verify = async (req,res) => {
    try{

        const {org_id,assigned_role,target_user_id} = req.body;

        const obj = {
            org_id,
            assigned_role:assigned_role?.trim().toUpperCase(),
            target_user_id,
            caller_id:req.user
        };

        const payload = await org_model.verify(obj);

        if(payload.status==true){
            return res.status(200).json(payload);
        };

        return res.status(409).json(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error At Verify User Model",
            stack:error.stack,
            name:error.name,
            message:error.message
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Verifying User"
        });

    };
};



let change_role = async (req,res) => {
    try{

        const {org_id,target_user_id,new_role} = req.body;

        const obj = {
            org_id,
            target_user_id,
            new_role:new_role?.trim().toUpperCase(),
            caller_id:req.user
        };

        const payload = await org_model.change_role(obj);

        if(payload.status==true){
            return res.status(200).json(payload);
        };

        return res.status(409).jsopn(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error At Change User Role Model",
            stack:error.stack,
            name:error.name,
            message:error.message
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Changing User Role"
        });

    };
};



let remove_member = async (req,res) => {
    try{

        const obj = {
            target_user_id:req.params.target_user_id,
            caller_id:req.user,
            org_id:req.params.org_id
        };

        const payload = await org_model.remove_member(obj);

        if(payload.status==true){
            return res.status(200).json(payload);
        };

        return res.status(409).json(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error At Remove Member Model",
            stack:error.stack,
            name:error.name,
            message:error.message
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Removing Member"
        });

    };
};



let list_pending_members = async (req,res) => {
    try{

        const obj = {
            org_id:req.params.org_id,
            offset:req.params.offset,
            limit:req.params.limit    
        };

        const payload = await org_model.list_pending_members(obj);

        return res.status(200).json(payload);

    } catch(error){

        console.error({
            system:"Internal Server Error At List Pending Members Model",
            stack:error.stack,
            name:error.name,
            message:error.message
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Listing Pending Members"
        });

    };
};



export default {
    org_and_owner_list,
    list,
    create_org,
    get_org_via_slug,
    update,
    update_logo,
    update_cover,
    delete_org,
    member_list,
    join_request,
    verify,
    change_role,
    remove_member,
    list_pending_members
}