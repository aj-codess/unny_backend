import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as crypto from "crypto";
import fs from "fs";
import path from "path";


  const KEY_DIR = path.resolve("./assets/keys");
  const PUBLIC_KEY_PATH = path.join(KEY_DIR,"public.pem");
  const PRIVATE_KEY_PATH = path.join(KEY_DIR,"private.pem");

  const writePublicPrivate=async()=>{
    try{

      // Ensure directory exists
    if (!fs.existsSync(KEY_DIR)) {
      fs.mkdirSync(KEY_DIR, { recursive: true });
    }

    // If both keys already exist, DO NOTHING
    if (fs.existsSync(PUBLIC_KEY_PATH) && fs.existsSync(PRIVATE_KEY_PATH)) {
      console.log(" RSA keys already exist. Skipping generation.");
      return;
    }

    console.log(" Generating RSA key pair...");

    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    fs.writeFileSync(PUBLIC_KEY_PATH, publicKey, { mode: 0o644 });
    fs.writeFileSync(PRIVATE_KEY_PATH, privateKey, { mode: 0o600 });

    console.log("RSA keys Generated....");

    } catch(error){
      console.log("Error Writing private and public key to File - ",error);
      process.exit(1);
    }
  };


  let publicKey;
  let privateKey;

  const loadKeyToMemory=async()=>{
    try{
      privateKey = fs.readFileSync('./assets/keys/private.pem', 'utf8');
      publicKey = fs.readFileSync('./assets/keys/public.pem', 'utf8');
    } catch(error){
      console.log("Error Loading Persistent Key to Memory - ",error);
      process.exit(1);
    }
  };
  


  const signToken = async (id,session) => {

    return new Promise((resolve, reject) => {
      jwt.sign(
        { id: id, session:session},
        privateKey,
        {
        algorithm: 'RS256',
        expiresIn: '10m',
      },
        (err, token) => {
          if (err) {
            reject(err);
          } else {
            resolve(token);
          }
        }
      );
    });

  };



 const signRT = async (id, session) => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      { id: id, session:session },
      privateKey,
      {
        algorithm: 'RS256',
        expiresIn: '7d',
      },
      (err, token) => {
        if (err) {
          reject(err);
        } else {
          resolve(token);
        }
      }
    );
  });
};



const verifyToken = async (token) => {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        publicKey,
        { algorithms: ['RS256']},
        (err, decoded) => {
          if (err) {
            reject(err);
          } else {
            resolve(decoded);
          }
        }
      );
    });
  };



  const SALT_ROUNDS = 12;

const hashValue = async (plainValue) => {
  try{
    return await bcrypt.hash(plainValue, SALT_ROUNDS);
  } catch(error){
    console.error(
      {
        system:"Internal Server Error Hashing Value",
        name:error.name,
        message:error.message,
        stack:error.stack
      }
    );
  }
};



const compareHash = async (plainValue, hashedValue) => {
  try{
    return await bcrypt.compare(plainValue, hashedValue);
  } catch(error){
    console.error(
      {
        system:"Internal Server Error comparing hash",
        name:error.name,
        message:error.message,
        stack:error.stack
      }
    )
  }
};



// dont make comparism with the above when hased with the below
const hash_w_HMAC=(token)=>{
  try{

    return crypto
    .createHmac("sha256", process.env.SECRET_KEY)
    .update(token)
    .digest("hex");

  } catch(error){
    console.error(
      {
        system:"Internal Server Error Hashing with HMAC",
        name:error.name,
        message:error.message,
        stack:error.stack
      }
    )
  }
}


  export default {
    verifyToken,
    signToken,
    writePublicPrivate,
    loadKeyToMemory,
    signRT,
    hashValue,
    compareHash,
    hash_w_HMAC
  }