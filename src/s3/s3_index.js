import S3Helper from "./s3_helper.js";
import dotenv from "dotenv";
import snow from "./../utility/id_entry.js"


dotenv.config();

let helperObj = Object({
    status:false,
    UploadUrl:"",
    fileUrl:"",
    message:"",
});

const init_s3=async(region)=>{
    try{
        new S3Helper(region);
        console.log("S3 Initialized");

    } catch(error){
        console.error(
            {
                system:"Internal Server Error Initializing s3",
                name:error.name,
                message:error.message,
                stack:error.stack
            }
        )
    }
};



const action_enum = Object.freeze({
  PROFILE_PHOTO: 'profile_photo',
  POST: 'post',
  CHAT_UPLOAD: 'chat_upload',
});


const get_presigned_s3_url = async (action,userId,fileName) => {
    try{

        let obj = new helperObj;

        // search occuring on the key
        // action is expected to be in caps
        if(!Object.hasOwn(action_enum,action)){
            obj.status=false;
            obj.message="Invalid Action";
            return obj;
        };

        let upload_object_key = `${action_enum[action]}/${userId}/${snow.get_current_time()}/${fileName}`;

        const uploadUrl = await S3Helper.generatePresignedUrlAsync(process.env.S3_BUCKET, upload_object_key, 900);
        const fileUrl = `https://${process.env.S3_BUCKET}.s3${process.env.S3_REGION}.amazonaws.com/${upload_object_key}`;

        if(uploadUrl.length>1){
            obj.status=true;
            obj.uploadUrl=uploadUrl;
            obj.fileUrl=fileUrl;
            obj.message="url Signed";
        } else{
            obj.status=false;
            obj.message="Failed Signing";
        };

        return obj;

    } catch(error){

        let fail = new helperObj;
        fail.status=false;
        fail.message="Server Error Signing";

        console.error({
            system:"Internal server Error Getting Presigned Url",
            name:error.name,
            message:error.message,
            stack:error.stack
        });

        return fail;
    }
}



function extractUploadKey(fileUrl) {
  try {
    const prefix = `https://${process.env.S3_BUCKET}.s3${process.env.S3_REGION}.amazonaws.com/`;

    if (!fileUrl.startsWith(prefix)) {
      throw new Error("Invalid file URL: prefix mismatch");
    }

    // Return the remaining part after the prefix (the actual key)
    return fileUrl.slice(prefix.length);
  } catch (error) {
    console.error("Error extracting upload key from file URL:", error.message);
    return null;
  }
}



const upload_verification= async(obj_key_url) => {
    try{
        let obj = new helperObj;

        const checks = await S3Helper.verifyObjectExistsAsync(process.env.S3_BUCKET, obj_key_url);

        if(checks.exists){
            obj.status=true;
            obj.message="Successful Upload";
        } else{
            obj.status=false;
            obj.message="Upload Wasnt Successful";
        };

        return obj;

    } catch(error){
        let fail = new helperObj;
        fail.status=false;
        fail.message="Internal Server Verifying Upload.";

        console.error({
            system:"Internal Server Error Verifying Upload",
            name:error.name,
            message:error.message,
            stack:error.stack
        });
        return fail;
    }
}



const delete_upload = async(obj_key_url) => {
    try{

        let obj = new helperObj;

        const res = await S3Helper.deleteObjectAsync(process.env.S3_BUCKET, obj_key_url);

        if(res.success && res.deleted){
            obj.status = true;
            obj.message = "Upload Deleted Successfully"
        } else{
            obj.status=false;
            obj.message = "Failed Deleting";
        };

        return obj;

    } catch(error){
        let fail = new helperObj;
        fail.status=false;
        fail.message="Error Deleting Post";

        console.error({
            system:"Internal Server Error Deleting Upload",
            name:error.name,
            message:error.message,
            stack:error.stack
        });
        return fail;
    }
}


export default {
    init_s3,
    get_presigned_s3_url,
    upload_verification,
    delete_upload,
    extractUploadKey
}