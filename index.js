#!/usr/bin/env node
/**
 * index.js
 * ---------
 * Application entry point.
 *
 * Responsibilities:
 *   1. Initialise persistent storage (create data/ and tasks.json if missing)
 *   2. Handle unexpected process errors gracefully
 *   3. Start the interactive CLI loop
 */

const { initStorage } = require("./src/fileHandler");
const { runApp }      = require("./src/cli");

// ── Graceful exit on Ctrl+C ──────────────────────────────────────────────────
process.on("SIGINT", () => {
  const chalk = require("chalk");
  console.log("\n");
  console.log(chalk.magenta.bold("  Goodbye! Stay productive. 👋"));
  console.log();
  process.exit(0);
});

// ── Catch unhandled errors without a raw stack trace ─────────────────────────
process.on("uncaughtException", (err) => {
  const chalk = require("chalk");
  console.error(chalk.red("\n  Unexpected error: ") + err.message);
  process.exit(1);
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────
initStorage(); // Ensure data file is ready before any reads/writes
runApp();      // Enter the main menu loop
