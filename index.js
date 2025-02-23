"use strict";

const { spawn } = require("child_process");
const path = require("path");
const express = require("express");

const app = express();
const SCRIPT_FILE = "main.js";
const SCRIPT_PATH = path.join(__dirname, SCRIPT_FILE);
const PORT = process.env.PORT || 3000;

let botProcess = null;

/**
 * Express route to confirm the bot server is running.
 */
app.get("/", (req, res) => {
  res.send("Wataru Bot is now running.");
});

/**
 * Starts the Express server.
 */
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

/**
 * Spawns the bot process and sets up automatic restart if needed.
 */
function startBot() {
  console.log(`Starting bot process: ${SCRIPT_FILE}`);

  botProcess = spawn("node", [SCRIPT_PATH], {
    cwd: __dirname,
    stdio: "inherit",
    shell: true,
  });

  // Log any errors that occur during process startup.
  botProcess.on("error", (err) => {
    console.error("Failed to start bot process:", err);
  });

  // Listen for the bot process to exit.
  botProcess.on("close", (exitCode) => {
    console.error(`Bot process exited with code ${exitCode}`);

    // If exitCode is 1, assume an error occurred and restart after a short delay.
    if (exitCode === 1) {
      console.log("Restarting bot process in 3 seconds...");
      setTimeout(startBot, 3000);
    } else {
      console.log("Bot process exited with a non-restart code. Shutting down.");
      process.exit(exitCode);
    }
  });
}

/**
 * Handles graceful shutdown by terminating the bot process before exiting.
 */
function shutdown() {
  console.log("Shutting down gracefully...");
  if (botProcess) {
    botProcess.kill();
  }
  process.exit(0);
}

// Listen for termination signals to gracefully shut down.
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Start the bot process.
startBot();
