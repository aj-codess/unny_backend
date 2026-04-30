
import pgDB from "./../config/pgDB_config.js";
import snow from "./../utility/id_entry.js";


let initial_writer = async (obj) => {

    let dbPool = pgDB.getDB();
    const client = await dbPool.connect();

    try{

        await client.query('BEGIN');

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
                snow.genStringified_id(),
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

        const sessionPayload_table = await client.query(
            `INSERT INTO unnySchema.sessions (
      session_id,
      user_id,
      token_hash,
      device_info,
      is_active,
      is_online,
      created_at
  )
  VALUES (
      $6,    -- externally generated session_id
      $1,    -- same user id from above
      $7,    -- hashed refresh token
      $8,    -- device_info (e.g. "Chrome on Windows", user-agent string)
      TRUE,
      TRUE,
      now()
  )
  RETURNING
      session_id,
      device_info,
      created_at;
            `,
            []
        );

        await client.query('COMMIT');

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