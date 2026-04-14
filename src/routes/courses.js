import express from "express";
import auth_mid from "./../middleware/authenticator.js";
import course_controller from "./../controller/course_controller.js";


const course = express.Router();

// use offset and limit on listing routes

// auth
// org filtered
course.get("/:offset/:limit",(req,res)=>{
    course_controller.get_course(req,res);
});


// auth
// create a new cource under an org
// admin or lecturer level auth
course.post("/",(req,res)=>{
    course_controller.create_course(req,res);
});


// auth
// get a course using its slug name
course.get("/:slug",(req,res)=>{
    course_controller.get_via_slug(req,res);
});


// auth
// update course meta data
// admin or lecturer level
course.patch("/:id",(req,res)=>{
    course_controller.update_meta_data(req,res);
});


// auth
// lecturer or admin level auth
// upload or update a course cover image or photo
course.patch("/:id/cover",(req,res)=>{
    course_controller.load_date(req,res);
});


// auth
// creator or lecturer level
course.patch("/:id/archive",(req,res)=>{
    course_controller.archive(req,res);
});


// auth
// lecturer or creator level
course.delete("/:id",(req,res)=>{
    course_controller.delete_course(req,res);
});


// auth
// lecturer or creator level
// list all students currently enrolled in a course
course.get("/:id/enrollments/:offset/:limit",(req,res)=>{
    course_controller.enrolled(req,res);
});


// lecturer level auth
// unenroll
course.delete("/:id/unenroll",(req,res)=>{
    course_controller.unenroll_student(req,res);
});



// auth
// unenroll
course.delete("/:id/enroll",(req,res)=>{
    course_controller.enroll(req,res);
});


// auth
// pin a course to users profile
course.get("/:id/pin",(req,res)=>{
    course_controller.pin(req,res);
});



// auth
// unpin a course from users profile
course.delete("/:id/unpin",(req,res)=>{
    course_controller.unpin(req,res);
});


// auth
// list all document for a course
course.get("/:id/documents/:offset/:limit",(req,res)=>{
    course_controller.get_docs(req,res);
});


// auth
// upload a new course document
// lecturer level
course.post("/:id/documents",(req,res)=>{
    course_controller.upload_doc(req,res);
});


// auth
// get document metadata
course.get("/:id/documents/:docId",(req,res)=>{
    course_controller.get_doc_about(req,res);
});


// auth
// update document meta data
// lecturer level
course.patch("/:id/documents/:docId",(req,res)=>{
    course_controller.update_doc_about(req,res);
});


// auth
// change document visibility
//lecturer level auth
course.patch("/:id/documents/:docId/:visibility",(req,res)=>{
    course_controller.doc_visibility(req,res);
});


// auth
// delete document
// lecturer level auth
course.delete("/:id/documents/:docId",(req,res)=>{
    course_controller.delete_doc(req,res);
});

export default course;