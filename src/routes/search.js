import express from "express";


const search = express.Router();

// use offset and limit on listing routes

// search accross all field
search.get("/",(req,res)=>{
    search_controller.all(req,res);
});


// make a search of organization
search.get("/organizations",(req,res)=>{
    search_controller.org(req,res);
});

//make a search in courses
search.get("/courses",(req,res)=>{
    search_controller.course(req,res);
});


// make a search in documents
search.get("/documents",(req,res)=>{
    search_controller.docs(req,res);
});

export default search;