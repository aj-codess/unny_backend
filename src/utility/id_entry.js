import {createGenerator} from "./snowflake/index.js";

let snow_class = null;

const snow_init = (workerId,datacenterId) => {
    try{

        if(snow_class == null){
            snow_class = createGenerator({workerId,datacenterId});
            return true;
        } else if(snow_class != null){
            return true
        };

    } catch(error){
        console.error({
            system:"Internal Server Error Initializing Snowflake",
            name:error.name,
            stack:error.stack,
            message:error.message
        });
    };
    return false;
};



const gen_bigInt = () => {
    try{

        return snow_class.nextId();

    } catch(error){
        console.error({
            system:"Error Getting Id In BigInt",
            name:error.name,
            stack:error.stack,
            message:error.message
        });
    }
}


const parse_id = (id) => {
    try{

        return snow_class.parse(id);

    } catch(error){
        console.error({
            system:"Error Getting id Details",
            name:error.name,
            stack:error.stack,
            message:error.message
        });
    }
}


const genStringified_id = () => {
    try{

        return snow_class.nextIdString();

    } catch(error){
        console.error({
            system:"Error Getting Stringified id",
            name:error.name,
            stack:error.stack,
            message:error.message
        });
    };
}



const genHex_id = () => {
    try{

        return snow_class.nextIdHex();

    } catch(error){

        console.error({
            system:"Error Getting Hex id",
            name:error.name,
            stack:error.stack,
            message:error.message
        });

    }
};


const get_current_time = () => {
    return Date.now();
};



let generateSecureOTP = () => {

    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    // Mod 100000 keeps it 5 digits, padStart handles leading zeros
    return String(array[0] % 100000).padStart(5, '0');

}


export default {
    snow_init,
    gen_bigInt,
    parse_id,
    genStringified_id,
    genHex_id,
    get_current_time,
    generateSecureOTP
}