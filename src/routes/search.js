import express from "express";


const search = express.Router();

// use offset and limit on listing routes

// search accross all field
search.get("/",(req,res)=>{

});


// make a search of organization
search.get("/organizations",(req,res)=>{

});

//make a search in courses
search.get("/courses",(req,res)=>{

});


// make a search in documents
search.get("/documents",(req,res)=>{

});

export default search;