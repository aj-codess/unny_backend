import admin_model from "./../model/admin_model.js";

let getAllUsers = async(req,res) => {
    try{

        const limit_  = parseInt(req.params.limit,  10);
        const offset_ = parseInt(req.params.offset, 10);

        if (isNaN(limit_) || isNaN(offset_) || limit_ < 1 || offset_ < 0) {
            return res.status(400).json({
                status: false,
                message: "Invalid pagination parameters"
            });
        };

        const obj = {
            offset:offset_,
            limit:limit_
        };

        const payload = await admin_model.get_all_users(obj);

        if(payload.status==true){
            return res.status(200).json(payload);
        };

        return res.status(500).json(payload);

    } catch(error){

        console.error({
            name:error.name,
            stack:error.stack,
            message:error.message,
            system:"Internal Server Error At Getting Users Via Admin Comtroller"
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Getting Users"
        });

    };
};



let activate = async (req,res) => {
    try{

        const obj = {
            target_id:req.params.id
        };

        const payload = await admin_model.activate_user(obj);

        if(payload.status==false && payload.not_found==true){
            return res.status(404).json(payload);
        } else if(payload.status==true){
            return res.status(200).json(payload);
        };

        return res.status(500).json(payload);

    } catch(error){

        console.error({
            name:error.name,
            stack:error.stack,
            message:error.message,
            system:"Internal Server Error At Activate User Controller"
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Activating Users Account"
        });

    };
};



let deactivate = async (req,res) => {
    try{

        const obj = {
            target_id : req.params.id
        };

        const payload = await admin_model.deactivate_user(obj);

        if(payload.status==false && payload.not_found==true){
            return res.status(404).json(payload);
        } else if(payload.status == true){
            return res.status(200).json(payload);
        };

        return res.status(500).json(payload);

    } catch(error){

        console.error({
            name:error.name,
            stack:error.stack,
            message:error.message,
            system:"Internal Server Error At Deactivate Controller"
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Deactivating Users"
        });

    };
};


let statistic = async (req,res) => {
    try{

        const statistic_payload = await admin_model.get_stats();

        return res.status(200).json(statistic_payload);

    } catch(error){

        console.error({
            name:error.name,
            stack:error.stack,
            message:error.message,
            system:"Internal Server Error At Get Statistic Controller"
        });

        return res.status(500).json({
            status:false,
            message:"Internal Server Error Getting User Statistic"
        });

    };
};


export default {
    getAllUsers,
    activate,
    deactivate,
    statistic
}