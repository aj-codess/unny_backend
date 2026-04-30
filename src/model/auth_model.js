import uni_mail_resolver from "./../service/university_email_resolver.js";
import pgDB from "./../config/pgDB_config.js";

let initial_writer = async (obj) => {

    let dbPool = pgDB.getDB();
    const client = await dbPool.connect();

    try{

        await client.query('BEGIN');

        

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