// Runs the dashboard (Vite) and the remote renderer together.
import { spawn } from "node:child_process";

const procs = [
  spawn(process.execPath, ["node_modules/vite/bin/vite.js"], { stdio: "inherit" }),
  spawn(process.execPath, ["server/remote.mjs"], { stdio: "inherit" }),
];

const shutdown = () => {
  procs.forEach((p) => p.kill());
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
