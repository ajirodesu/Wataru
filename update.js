"use strict";

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// Constants
const REPO_URL = "https://github.com/ajirodesu/wataru.git";
const PROJECT_DIR = path.resolve(__dirname);
const CONFIG_PATH = path.join(PROJECT_DIR, "setup", "config.json");
const TEMP_CONFIG_PATH = path.join(PROJECT_DIR, "setup_config_temp.json");

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
 * Updates the bot to the latest version from GitHub, preserving setup/config.json.
 * @returns {Promise<void>} Resolves when update is complete.
 */
async function updateBot() {
  console.log("Starting bot update...");

  try {
    // Check if config file exists and stash it
    let configStashed = false;
    if (fs.existsSync(CONFIG_PATH)) {
      fs.copyFileSync(CONFIG_PATH, TEMP_CONFIG_PATH);
      console.log(`Stashed config file to ${TEMP_CONFIG_PATH}`);
      configStashed = true;
    }

    // Ensure git is initialized
    runCommand("git rev-parse --is-inside-work-tree || git init");

    // Set or update the remote origin
    runCommand(`git remote set-url origin ${REPO_URL} || git remote add origin ${REPO_URL}`);

    // Fetch and pull the latest changes
    runCommand("git fetch origin");
    runCommand("git reset --hard origin/main"); // Overwrites all tracked files

    // Restore the stashed config file if it existed
    if (configStashed) {
      fs.copyFileSync(TEMP_CONFIG_PATH, CONFIG_PATH);
      fs.unlinkSync(TEMP_CONFIG_PATH);
      console.log("Restored original config file from stash.");
    }

    // Install dependencies
    runCommand("npm install");

    console.log("Bot updated successfully.");
  } catch (error) {
    console.error("Update failed:", error.message);
    // Clean up temp file if it exists
    if (fs.existsSync(TEMP_CONFIG_PATH)) {
      fs.unlinkSync(TEMP_CONFIG_PATH);
    }
    throw error; // Let caller handle the failure
  }
}

module.exports = { updateBot };