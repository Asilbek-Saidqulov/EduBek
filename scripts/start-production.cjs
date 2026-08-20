require("dotenv").config();

globalThis.AsyncLocalStorage =
  require("node:async_hooks").AsyncLocalStorage;

require("tsx/cjs");
require("../src/server/index.ts");