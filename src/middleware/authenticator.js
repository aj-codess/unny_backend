import express from "express";
import token_helper from "./../service/token_helper.js";
import session_index from "./../service/session_manager.js";

const mid_auth = express.Router();

mid_auth.use(async (req, res, next) => {
  try {

    const authHeader = req.headers["auth"];

    const tokenFromHeader =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;


    const tokenFromCookie = req.cookies?.chatAuth;

    const token = tokenFromHeader || tokenFromCookie;

    if (!token) {
      console.log("no token Provided");
      return res.status(401).json({ status: false, message: "No token provided" });
    }

    const decode = await token_helper.verifyToken(token);

    if(decode){

      req.user=decode.id;
      req.session=decode.session;
      req.role=decode.role;
      req.org=decode.org;

      if(session_index.session_http(req.session,req.user)){
        next();
      } else{
        return res.status(429).json({status:false,message:"Too Many Request"});
      };

    } else{
      console.log("The token was invalid");
      return res.status(401).json({status:false,message:"Invalid token"});
    };

  } catch (error) {

    console.error("Auth middleware error:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
    
  }

});

export default mid_auth;