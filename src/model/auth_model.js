
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


        const AT = await token_helper.signToken(user_id,session_id,"",obj.university_name);
        const RT = await token_helper.signRT(user_id,session_id,"",obj.university_name);
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
            payload:userTable_payload.rows[0]
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





let signin = async (obj) => {

    let dbPool = pgDB.getDB();
    const client = await dbPool.connect();

    try{

        await client.query('BEGIN');

        const getUser_payload = await client.query(
            `
            SELECT
    id,password_hash
FROM unnySchema.users
WHERE email = $1       -- email from request body
LIMIT 1;
            `,
            [
                obj.email
            ]
        );


        if(getUser_payload.rowCount === 0){
            return {
                status:false,
                message:"User Not Found",
                not_found : true
            };
        };

        const isMatched = await token_helper.compareHash(obj.password,getUser_payload.rows[0].password_hash);
        if(!isMatched){
            return {
                status:false,
                message:"Password Mismatch"
            };
        };

        const getSession_payload = await client.query(
            `
            SELECT 
            session_id,university_name,role,device_info FROM unnySchema.sessions 
            WHERE user_id=$1;
            `,
            [getUser_payload.rows[0].id]
        );

        let AT;
        let RT;
        let RT_hash;


        for(const session of getSession_payload.rows){
             if (session.device_info === obj.device_info) {

                AT = await token_helper.signToken(getUser_payload.rows[0].id,session.session_id,session.role,session.university_name);
                RT = await token_helper.signRT(getUser_payload.rows[0].id,session.session_id,session.role,session.university_name);
                RT_hash = token_helper.hash_w_HMAC(RT);

                await client.query(
                    `
                    UPDATE unnySchema.sessions 
                    SET token_hash = $1 AND is_active = TRUE AND is_online = TRUE 
                    WHERE session_id = $2 AND user_id = $3 AND device_info = $4;
                    `,
                    [RT_hash,session.session_id,session.user_id,session.device_info]
                );
                
                };

                await client.query('COMMIT');

                return {
                    status:true,
                    message:"Signin Successful",
                    AT_:AT,
                    RT_:RT
                };
        };



            const session_id = snow.get_current_time();

            AT = await token_helper.signToken(getUser_payload.rows[0].id,session_id,getSession_payload.rows[0].role,getSession_payload.rows[0].university_name);
            RT = await token_helper.signRT(getUser_payload.rows[0].id,session_id,getSession_payload.rows[0].role,getSession_payload.rows[0].university_name);
            RT_hash = token_helper.hash_w_HMAC(RT);

            await client.query(
                `
                INSERT INTO unnySchema.sessions (
    session_id,
    user_id,
    token_hash,
    device_info,
    is_active,
    is_online,
    created_at,
    university_name,
    role
)
VALUES (
    $1,    -- externally generated session_id
    $2,    -- user id from Step 1
    $3,    -- hashed refresh token
    $4,    -- device_info
    TRUE,
    TRUE,
    now(),
    $5,
    $6
);
                `,
                [session_id,getUser_payload.rows[0].id,RT_hash,obj.device_info,getSession_payload.rows[0].university_name]
            );

            await client.query('COMMIT');

            return {
                status:true,
                message:"Signin Successful",
                AT_:AT,
                RT_:RT
            };

    } catch(error){

        await client.query('ROLLBACK');

        console.error({
            system:"Internal Server Error With Signing In",
            name:error.name,
            message:error.message,
            stack:error.stack
        });

        return{
            status:false,
            message:"Internal Server Error Signing In"
        };

    } finally{

        client.release();

    };
}



export default {
    initial_writer,
    signin
};