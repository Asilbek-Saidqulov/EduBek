export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL || "",
  DIRECT_URL: process.env.DIRECT_URL || "",
  EDUBEK_SESSION_SECRET: process.env.EDUBEK_SESSION_SECRET || "default_session_secret_change_in_prod",
  EDUBEK_REFRESH_SECRET: process.env.EDUBEK_REFRESH_SECRET || "default_refresh_secret_change_in_prod",
  EDUBEK_ENCRYPTION_KEY: process.env.EDUBEK_ENCRYPTION_KEY || "default_encryption_key_32bytes!!",
  EDUBEK_GUEST_SECRET: process.env.EDUBEK_GUEST_SECRET || "default_guest_secret_change_in_prod",
  EDUBEK_ALLOWED_ORIGINS: process.env.EDUBEK_ALLOWED_ORIGINS || "",
};
