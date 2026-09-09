process.env.UNIFIED_REALTIME = "1";
process.env.NODE_ENV = process.env.NODE_ENV || "production";

try {
  require("dotenv").config();
} catch {
  /* env comes from the host */
}

globalThis.AsyncLocalStorage = require("node:async_hooks").AsyncLocalStorage;
require("tsx/cjs");
require("../src/server/unified.ts");
