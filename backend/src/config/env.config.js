import { cleanEnv, str, port, makeValidator } from "envalid";

const secret = makeValidator((input) => {
  if (typeof input !== "string" || input.length < 32) {
    throw new Error("must be at least 32 characters long");
  }
  return input;
});

const base64Key32 = makeValidator((input) => {
  const decoded = Buffer.from(input, "base64");
  if (decoded.length !== 32) {
    throw new Error("must decode to exactly 32 bytes — generate with: openssl rand -base64 32");
  }
  return input;
});

const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ["development", "production", "test"], default: "development" }),
  PORT: port({ default: 5000 }),
  MONGO_URL: str(),
  CORS_ORIGIN: str({ default: "http://localhost:3000" }),
  FRONTEND_URL: str({ default: "http://localhost:3000/dashboard" }),
  CLIENT_ID: str(),
  CLIENT_SECRET: str(),
  JWT_ACCESS_TOKEN: secret(),
  JWT_ACCESS_TOKEN_EXPIRY: str({ default: "15m" }),
  JWT_REFRESH_TOKEN: secret(),
  JWT_REFRESH_TOKEN_EXPIRY: str({ default: "7d" }),
  AGENT_JWT_SECRET: secret(),
  AGENT_JWT_SECRET_EXPIRY: str({ default: "30d" }),
  TOKEN_ENCRYPTION_KEY: base64Key32(),
});

export default env;
