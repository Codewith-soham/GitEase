import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import authRoutes from './modules/auth/auth.routes.js'
import { errorMiddleware } from "./middleware/error.middleware.js";

const app = express();

//cors config -> allows frontend to run on different port/domain
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  }),
);

//common middleware config
app.use(express.json({ limit: "10mb" })); //parses incoming json data from req.body - supports larger payloads for profiles, images, etc.
app.use(express.urlencoded({ extended: true, limit: "10mb" })); //parses form data (data from html forms)
app.use(express.static("public")); //used to serve static files like images and pdfs stuff
app.use(cookieParser()); //parses cookies sent by the client required to read jwt refresh tokens
app.use(morgan("dev"));

app.use('/api/auth/v1', authRoutes)
app.use(errorMiddleware)

export { app };
