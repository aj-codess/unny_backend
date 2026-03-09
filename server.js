import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";

import connectDb from "./src/config/pgDB_config.js";
import token_helper from "./src/service/token_helper.js";

dotenv.config();
const PORT=process.env.PORT || 5222;

token_helper.writePublicPrivate();
token_helper.loadKeyToMemory();

await connectDb.initDB();

const app=express();
const server=http.createServer(app);

const allowedOrigins = [
  //"http://app.example.com",      // web client
  "http://localhost:5222"         // local dev client
];


const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"], // restrict methods
  allowedHeaders: ["Content-Type", "Authorization", "auth","x-refresh-token"], // restrict headers
  exposedHeaders: ["auth", "x-refresh-token"], // expose your custom headers to clients
  credentials: true, // allow cookies/tokens if needed
  maxAge: 600 // cache preflight for 10 mins
};

// Apply CORS globally
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser(process.env.HASH_PREFIX));


// websocker handler module
//initWebSocket(server);

// when there is an unauthorized with peer server, clear access token and call ping to get a now token

app.use((req, res, next) => {
    res.status(404).json({ message: "Route not found" });
});

server.listen(PORT, () => {

    console.log(`Server is running on http://localhost:${PORT}`);

});