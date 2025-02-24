"use strict";

const { execSync } = require("child_process");
const path = require("path");

// Constants
const REPO_URL = "https://github.com/ajirodesu/wataru.git"; // Replace with your repo URL
const PROJECT_DIR = path.resolve(__dirname);

/**
 * Executes a shell command and logs output.
 * @param {string} command - The shell command to run.
 * @returns {string} Command output.
 * @throws {Error} If the command fails.
 */
function runCommand(command) {
  try {
    const output = execSync(command, { cwd: PROJECT_DIR, stdio: "inherit" });
    console.log(`Command executed: ${command}`);
    return output ? output.toString().trim() : "";
  } catch (error) {
    console.error(`Error executing '${command}': ${error.message}`);
    throw error;
  }
}

/**
 * Updates the bot to the latest version from GitHub.
 * @returns {Promise<void>} Resolves when update is complete.
 */
async function updateBot() {
  console.log("Starting bot update...");

  try {
    // Ensure git is initialized
    runCommand("git rev-parse --is-inside-work-tree || git init");

    // Set or update the remote origin
    runCommand(`git remote set-url origin ${REPO_URL} || git remote add origin ${REPO_URL}`);

    // Fetch and pull the latest changes
    runCommand("git fetch origin");
    runCommand("git reset --hard origin/main"); // Assumes 'main' branch; adjust if needed

    // Install dependencies
    runCommand("npm install");

    console.log("Bot updated successfully.");
    // No process.exit here; let the caller handle the restart
  } catch (error) {
    console.error("Update failed:", error.message);
    throw error; // Let caller handle the failure
  }
}

module.exports = { updateBot };