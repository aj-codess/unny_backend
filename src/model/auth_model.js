
import pgDB from "./../config/pgDB_config.js";
import snow from "./../utility/id_entry.js";
import token_helper from "./../service/token_helper.js";


let initial_writer = async (obj) => {

    let dbPool = pgDB.getDB();
    const client = await dbPool.connect();

    try{

        await client.query('BEGIN');

        const user_id = snow.genStringified_id();
        const session_id = snow.get_current_time();

        const userTable_payload = await client.query(
            `INSERT INTO unnySchema.users (
      id,
      full_name,
      username,
      email,
      password_hash,
      is_active,
      is_email_verified,
      created_at,
      updated_at,
      bio,
      profile_image_url,
      cover_image_url,
      university_name
  )
  VALUES (
      $1,   -- externally generated user id
      $2,   -- full_name
      $3,   -- username
      $4,   -- email
      $5,   -- password_hash (bcrypt hash)
      TRUE,
      FALSE,
      now(),
      now()
      $6,
      $7,
      $8,
      $9
  )
  RETURNING
      id,
      full_name,
      username,
      email,
      is_active,
      is_email_verified,
      created_at,
      bio,
      profile_image_url,
      cover_image_url,
      university_name;`,
            [
                user_id,
                obj.fullname,
                obj.username,
                obj.email,
                obj.password,
                obj.bio,
                obj.profile_url,
                obj.cover_url,
                obj.university_name
            ]
        );


        const AT = await token_helper.signToken(user_id,session_id,"temp",obj.university_name);
        const RT = await token_helper.signRT(user_id,session_id,"temp",obj.university_name);
        const hashed_RT = token_helper.hash_w_HMAC(RT);


        await client.query(
            `INSERT INTO unnySchema.sessions (
      session_id
      user_id,
      token_hash,
      device_info,
      is_active,
      is_online,
      created_at,
      university_name
  )
  VALUES (
      $1,    -- externally generated session_id
      $2,    -- same user id from above
      $3,    -- hashed refresh token
      $4,    -- device_info (e.g. "Chrome on Windows", user-agent string)
      TRUE,
      TRUE,
      now(),
      $5
  )`,
            [session_id,user_id,hashed_RT,obj.device_info,obj.university_name]
        );

        await client.query('COMMIT');

        return {
            status:true,
            message:"Account Created Successfully",
            AT_:AT,
            RT_:RT,
            payload:userTable_payload
        };

    } catch(error){

        await client.query('ROLLBACK');

        console.error({
            system:"Internal Server Error With Signup",
            name:error.name,
            message:error.message,
            stack:error.stack
        });

        return{
            status:false,
            message:"Internal Server Error"
        };

    } finally{

        client.release();

    };

    return {
        status:false,
        message:"Invalid data"
    };

};


export default {
    initial_writer
};