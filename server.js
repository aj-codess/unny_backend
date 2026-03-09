import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";

import connectDb from "./src/config/pgDB_config.js";
import token_helper from "./src/service/token_helper.js";

import auth from "./src/routes/auth.js";
import admin from "./src/routes/admin.js";
import course from "./src/routes/courses.js";
import notification from "./src/routes/notification.js";
import organizations from "./src/routes/organizations.js";
import search from "./src/routes/search.js";
import users from "./src/routes/users.js";

dotenv.config();
const PORT=process.env.PORT || 8080;

token_helper.writePublicPrivate();
token_helper.loadKeyToMemory();

await connectDb.initDB();

const app=express();
const server=http.createServer(app);

const allowedOrigins = [
  //"http://app.example.com",      // web client
  "http://localhost:8080/api/v1"         // local dev client
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
app.use("/auth",auth);
app.use("/users",users);
app.use("/organizations",organizations);
app.use("/courses",course);
app.use("/notification",notification);
app.use("/search",search);
app.use("/admin",admin);
app.use("/refresh_token",refresh);
app.use((req, res, next) => {
    res.status(404).json({ message: "Route not found" });
});

server.listen(PORT, () => {

    console.log(`Server is running on http://localhost:${PORT}/api/v1`);

});