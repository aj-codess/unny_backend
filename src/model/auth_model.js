
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
      now(),
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
      session_id,
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
  );`,
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


                return {
                    status:true,
                    message:"Signin Successful",
                    AT_:AT,
                    RT_:RT
                };
        };

        await client.query('COMMIT');

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

        return {
            status:false,
            message:"Internal Server Error Signing In"
        };

    } finally{

        client.release();

    };
}



let logout_module = async (obj) => {

    let dbPool = pgDB.getDB();
    const client = await dbPool.connect();

    try{

        await client.query('BEGIN');

        let log = await client.query(
            `
            UPDATE unnySchema.sessions
SET token_hash = NULL AND
    is_active = FALSE AND
    is_online = FALSE
WHERE
    session_id = $1
    AND user_id = $2
    AND device_info = $3
RETURNING session_id;
            `,
            [obj.session_id,obj.user_id,obj.device_info]
        );

        await client.query('COMMIT');

        if(log.rowCount > 0) {

            return {
                status:true,
                message:"logged out successfully"
            };

        } else{

            return {
                status:false,
                message:"logged out failed"
            };

        };

    } catch(error){

        await client.query('ROLLBACK');

        console.error(
            {
                name:error.name,
                stack:error.stack,
                message:error.message,
                system:"Internal Server Error logging out"
            }
        );

        return {
            status:false,
            message:"Internal Server Error Logging Out"
        };

    } finally{

        client.release();

    };
}




let refresh_token = async(obj) => {

    let dbPool = pgDB.getDB();
    const client = await dbPool.connect();

    try{

        await client.query('BEGIN');

        const decode = await token_helper.verifyToken(obj.token);

        if(!decode){
            return {
                status:false,
                message:"Invalid Token"
            };
        };

        const old_token_hash = token_helper.hashValue(obj.token);
        const AT = await token_helper.signToken(decode.id,decode.session,decode.role,decode.org);
        const RT = await token_helper.signRT(decode.id,decode.session,decode.role,decode.org);
        const new_token_hash = token_helper.hashValue(RT);

        const get_session = await client.query(
            `
            UPDATE unnySchema.sessions 
            SET token_hash = $1 AND 
                is_active = TRUE AND
                is_online = now()
            WHERE 
            session_id = $2 
            AND user_id = $3 
            AND token_hash = $4 
            AND device_info = $5;
            `,
            [new_token_hash,decode.session,decode.id,old_token_hash,obj.device_info]
        );

        await client.query('COMMIT');

        if(get_session.rowCount > 0){

            return {
                status:true,
                AT_:AT,
                RT_:RT
            };

        } else{

            return {
                status:false,
            };

        };

    } catch(error){

        await client.query('ROLLBACK');

        console.error(
            {
                name:error.name,
                stack:error.stack,
                message:error.message,
                system:"Internal Server Error Refreshing Token"
            }
        );

        return {
            status:false,
            message:"Internal Server Error Refreshing Token"
        };

    } finally{

        client.release();

    };
}



const init_forget_pass = async(obj) => {

    let dbPool = pgDB.getDB();
    const client = await dbPool.connect();

    try{

        await client.query('BEGIN');

        const user_getter = await client.query(
            `
            SELECT id FROM unnySchema.users 
            WHERE email = $1;
            `,
            [obj.mail]
        );

        if(user_getter.rowCount == 0){
            return {
                status:false,
                message:`User With ${obj.mail} Not Found`,
                notFound : true
            };
        };

        const otp_key = snow.generateSecureOTP();
        const session_id = snow.get_current_time();

        await client.query(
            `
            INSERT INTO unnySchema.reset_otps (
                session_id,
                user_id,
                otp,
                is_verified,
                created_at,
            ) VALUES (
              $1,
              $2,
              $3,
              FALSE,
              now()
             );
            `,
            [session_id,user_getter.rows[0].id,otp_key]
        );

        await client.query('COMMIT');

        // send otp key via gmail service
        console.log(`otp key is - ${otp_key}`);

        const AT_ = await token_helper.signToken(user_getter.rows[0].id,session_id,"","");

        return {
            status:true,
            message:`OTP key Sent To ${obj.mail}`,
            AT:AT_
        };

    } catch(error){

        await client.query('ROLLBACK');

        console.error(
            {
                name:error.name,
                stack:error.stack,
                message:error.message,
                system:"Internal Server Error In Changing Password"
            }
        );

        return {
            status:false,
            message:"Internal Server Error In Forget Password"
        };

    } finally{

        client.release();

    };
}



const otp_verifier = async(obj) =>{

    let dbPool = pgDB.getDB();
    const client = await dbPool.connect();

    try{

        await client.query('BEGIN');

        const serialized_AT = await token_helper.verifyToken(obj.token);

        const isVerified = await client.query(
            `
            UPDATE unnySchema.reset_otps 
            SET is_verified = TRUE 
            WHERE session_id = $1 AND user_id AND otp = $3 AND expires_at > now() 
            RETURNING 1;
            `,
            [serialized_AT.session,serialized_AT.id,obj.otp_key]
        );

        await client.query('COMMIT');

        if(isVerified.rowCount > 0){

            return {
                status:true,
                message:"OTP Verified"
            };

        };

        return {
            status:false,
            message:"Failed OTP Verification"
        };

    } catch(error){

        await client.query('ROLLBACK');

        console.error(
            {
                name:error.name,
                stack:error.stack,
                message:error.message,
                system:"Internal Server Error In Verify OTP Model"
            }
        );

        return {
            status:false,
            message:"Internal Server Error While Verifying OTP"
        };

    } finally{

        client.release();

    };
}




const new_pass_override = async(obj) => {

    let dbPool = pgDB.getDB();
    const client = await dbPool.connect();

    try{

        await client.query('BEGIN');

        const serialized_token = await token_helper.verifyToken(obj.token);

        if(!serialized_token){

            return {
                status:false,
                message:"Wrong Credentials"
            };

        };

        const reset_otp_data = await client.query(
            `
            SELECT 1 FROM unnySchema.reset_otps 
            WHERE session_id = $1 AND user_id = $2 AND is_verified = TRUE;
            `,
            [serialized_token.session,serialized_token.id]
        );

        if(reset_otp_data.rowCount > 0){

            const pass_hash = token_helper.hashValue(`${obj.new_password}`);

            await client.query(
                `
                UPDATE unnySchema.users 
                SET password_hash = $1 
                WHERE id = $2;
                `,
                [pass_hash,serialized_token.id]
            );

            await client.query('COMMIT');

            return {
                status:true,
                message:"New Password Saved"
            };

        };

        await client.query('COMMIT');

        return {
            status:false,
            message:"Incorrect Data Recieved"
        };

    } catch(error){

        await client.query('ROLLBACK');

         console.error(
            {
                name:error.name,
                stack:error.stack,
                message:error.message,
                system:"Internal Server Error Override New Password Model"
            }
        );

        return {
            status:false,
            message:"Internal Server Error While Overriding New Password"
        };

    } finally{

        client.release();

    }
}


export default {
    initial_writer,
    signin,
    logout_module,
    refresh_token,
    init_forget_pass,
    otp_verifier,
    new_pass_override
};