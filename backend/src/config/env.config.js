import { cleanEnv, str, port } from "envalid";

const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ["development", "production", "test"], default: "development" }),
  PORT: port({ default: 5000 }),
  MONGO_URL: str(),
  CORS_ORIGIN: str({ default: "http://localhost:3000" }),
  FRONTEND_URL: str({ default: "http://localhost:3000/dashboard" }),
  CLIENT_ID: str(),
  CLIENT_SECRET: str(),
  JWT_ACCESS_TOKEN: str(),
  JWT_ACCESS_TOKEN_EXPIRY: str({ default: "15m" }),
  JWT_REFRESH_TOKEN: str(),
  JWT_REFRESH_TOKEN_EXPIRY: str({ default: "7d" }),
  AGENT_JWT_SECRET: str(),
  AGENT_JWT_SECRET_EXPIRY: str({ default: "30d" }),
});

export default env;
