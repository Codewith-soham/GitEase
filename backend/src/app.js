import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import authRoutes from './modules/auth/auth.routes.js'
import { errorMiddleware } from "./middleware/error.middleware.js";
import repositoryRouter from './modules/repository/repository.route.js'
import automationRouter from './modules/automation/automation.routes.js'
import gitRouter from './modules/git/git.routes.js'

const app = express();

app.use(helmet());

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
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter)
app.use('/api/auth/v1', authLimiter, authRoutes)
app.use('/api/repository/v1', repositoryRouter)
app.use('/api/automation/v1', automationRouter)
app.use('/api/git/v1', gitRouter)
app.use(errorMiddleware)

export { app };
