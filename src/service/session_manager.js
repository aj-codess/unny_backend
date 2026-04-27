
const LIMIT = 60;           // 60 request is allowed per user
const WINDOW_SIZE = 60000; // this is equivalent to 1 minute in milliseconds

let sessionMap = new Map();

class Session {
  constructor(id) {
    this.online = true;              // user is connected
    this.connectedAt = Date.now();   // when connection started
    this.lastActive = Date.now();    // updated on every activity
    this.id = id || null;         // store client ip
    this.requestCount = 0;           // initial request count at start
    this.windowStart = Date.now();   // user time tracking
  }

  updateActivity() {
    this.lastActive = Date.now();
  }

  setOffline() {
    this.online = false;
    this.lastActive = Date.now();
  }
}



// Create or update a session
const createSession = (session_id, id) => {
  try {

    const sessionObj = new Session(id);
    sessionMap.set(session_id, sessionObj);

    return sessionObj;
  } catch (error) {
    console.error({
      system: "Internal Server Error Creating Session",
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }
};



// Check if user has an active session
const checkSession = (session_id) => {
  try {

    const session = sessionMap.get(session_id);
    return session ? session.online : false;

  } catch (error) {
    console.error({
      system: "Internal Server Error Checking Session",
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return false;
  }
};



// Update session activity
const updateSessionActivity = (session_id) => {
    try{

        const session = sessionMap.get(session_id);

        if (session) {
            session.updateActivity();
        };

    } catch(error){
        console.error(
            {
                system:"Internal Server Error Updating Session",
                name:error.name,
                message:error.message,
                stack:error.stack
            }
        );
    }
};




// Delete session completely
const deleteSession = (session_id) => {
  try {

    sessionMap.delete(session_id);

  } catch (error) {
    console.error({
      system: "Internal Server Error Deleting Session",
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }
};



// Mark session offline but keep record
const setOffline = (session_id) => {
    try{
        const session = sessionMap.get(session_id);

        if (session) {
            session.setOffline();
        };

    } catch(error){
        console.error(
            {
                system:"Internal Server error Setting User as Offline",
                name:error.name,
                message:error.message,
                stack:error.stack
            }
        );
    }
};




let http_session_core = (session_id,id) => {
  try{

    let session = sessionMap.get(session_id);

    const now = Date.now();

    if(now- session.windowStart < WINDOW_SIZE){

      if(session.requestCount < LIMIT){

        session.requestCount++;
        session.lastActive = Date.now();

        return true;

      } else{

        return false;

      };

    } else{
      session.windowStart = Date.now();
      session.requestCount = 1;
      session.lastActive = Date.now();

      return true;

    };

  } catch(error){
    console.error({
      name:error.name,
      message:error.message,
      stack:error.stack,
      system:"Internal Server Error In http session Core"
    });
  };

  return false;

};



let session_http = (session_id,id) => {
    try{

        let session = checkSession(session_id);

        if(!session){
            createSession(session_id,id);
            return {
              status:true,
              message:null
            }
        };

        let core_session_checks = http_session_core(session_id,id);

        if(core_session_checks){
          return {
            status:true,
            message:null
          };
        };

        return {
          status:false,
          message:"Too Many Requests"
        };

    } catch(error){
        console.error({
            system:"Internal Server Error Updating session",
            name:error.name,
            message:error.message,
            stack:error.stack
        });

        return {
          status:false,
          message:null
        }
    };
};


export default {
    session_http,
    createSession,
    checkSession,
    updateSessionActivity,
    deleteSession,
    setOffline
};