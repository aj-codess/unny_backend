import express from "express";


const organizations = express.Router();

// use offsets and limits on listing routes

// auth
organizations.get("/:offset/:limit",(req,res)=>{
    organization_controller.list(req,res);
});


// auth
// heavily secured since only university high official is allowed to create an organization
organizations.post("/",(req,res)=>{
    organization_controller.create_org(req,res);
});


// open
organizations.get("/:slug",(req,res)=>{
    organization_controller.get_org_via_slug(req,res);
});


// auth
//org owner only
organizations.patch("/:id",(req,res)=>{
    organization_controller.update(req,res);
});


// auth
organizations.patch("/:id/logo",(req,res)=>{
    organization_controller.update_logo(req,res);
});

// auth
organizations.patch("/:id/cover",(req,res)=>{
    organization_controller.update_cover(req,res);
});


// auth
// admin level soft delete
organizations.delete("/:id",(req,res)=>{
    organization_controller.delete_org(req,res);
});


// auth
// list all members with roles
organizations.get("/:id/members/:offset/:limit",(req,res)=>{
    organization_controller.member_list(req,res);
});


// auth
organizations.post("/:id/members/join",(req,res)=>{
    organization_controller.join_request(req,res);
});



// high level auth
// instance where a org owner verifys a user to make sure user belong to the org and assigns a role; either student or lecturer
organizations.post("/:id/member/:userId/verify",(req,res)=>{
    organization_controller.verify(req,res);
});


// auth
// admin changes members role
organizations.patch("/:id/members/:userId/:role",(req,res)=>{
    organization_controller.change_role(req,res);
});


// auth
// owner level of auth
organizations.delete("/:id/members/:userId",(req,res)=>{
    organization_controller.remove_member(req,res);
});


// auth
// admin level
// get list of unverified lecturers
organizations.get("/:id/members/:userId",(req,res)=>{
    organization_controller.list_pending_members(req,res);
});


export default organizations;