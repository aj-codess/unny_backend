import express from "express";


const course = express.Router();

// use offset and limit on listing routes

// auth
// org filtered
course.get("/:offset/:limit",(req,res)=>{

});


// auth
// create a new cource under an org
// admin or lecturer level auth
course.post("/",(req,res)=>{

});


// auth
// get a course using its slug name
course.get("/:slug",(req,res)=>{

});


// auth
// update course meta data
// admin or lecturer level
course.patch("/:id",(req,res)=>{

});


// auth
// lecturer or admin level auth
// upload or update a course cover image or photo
course.patch("/:id/cover",(req,res)=>{

});


// auth
// creator or lecturer level
course.patch("/:id/archive",(req,res)=>{

});


// auth
// lecturer or creator level
course.delete("/:id",(req,res)=>{

});


// auth
// lecturer or creator level
// list all students currently enrolled in a course
course.get("/:id/enrollments/:offset/:limit",(req,res)=>{

});


// auth
// unenroll
course.delete("/:id/enroll",(req,res)=>{

});


// auth
// pin a course to users profile
course.get("/:id/pin",(req,res)=>{

});



// auth
// unpin a course from users profile
course.delete("/:id/unpin",(req,res)=>{

});


// auth
// list all document for a course
course.get("/:id/documents/:offset/:limit",(req,res)=>{

});


// auth
// upload a new course document
// lecturer level
course.post("/:id/documents",(req,res)=>{

});


// auth
// get document metadata
course.get("/:id/documents/:docId",(req,res)=>{

});


// auth
// update document meta data
// lecturer level
course.patch("/:id/documents/:docId",(req,res)=>{

});


// auth
// upload a new course document
//lecturer level auth
course.patch("/:id/documents/:docId/visibility",(req,res)=>{

});


// auth
// delete document
// lecturer level auth
course.delete("/:id/documents/:docId",(req,res)=>{

});

export default course;