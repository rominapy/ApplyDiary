import dotenv from "dotenv";

dotenv.config();

function readEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(readEnv("PORT", "4000")),
  jwtSecret: readEnv("JWT_SECRET", "replace-me-in-production"),
  jwtExpiresIn: readEnv("JWT_EXPIRES_IN", "7d"),
  clientOrigin: readEnv("CLIENT_ORIGIN", "http://localhost:5173")
};
