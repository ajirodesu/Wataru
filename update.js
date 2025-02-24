"use strict";

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// Constants
const REPO_URL = "https://github.com/ajirodesu/wataru.git";
const PROJECT_DIR = path.resolve(__dirname);
const SETUP_DIR = path.join(PROJECT_DIR, "setup");
const TEMP_SETUP_DIR = path.join(PROJECT_DIR, "setup_temp");

/**
 * Executes a shell command with error handling.
 * @param {string} command - The shell command to execute.
 * @param {string} [errorMessage] - Custom error message for failure.
 * @returns {string} Command output, or empty string if none.
 * @throws {Error} If the command fails.
 */
function runCommand(command, errorMessage = `Failed to execute '${command}'`) {
  try {
    const output = execSync(command, { cwd: PROJECT_DIR, stdio: "inherit" });
    console.log(`Executed: ${command}`);
    return output ? output.toString().trim() : "";
  } catch (error) {
    const message = `${errorMessage}: ${error.message}`;
    console.error(message);
    throw new Error(message);
  }
}

/**
 * Checks if Git is available on the system.
 * @returns {boolean} True if Git is installed, false otherwise.
 */
function isGitInstalled() {
  try {
    runCommand("git --version", "Git is not installed on this system");
    return true;
  } catch (error) {
    console.error(error.message);
    return false;
  }
}

/**
 * Updates the bot to the latest version from GitHub, preserving the setup folder and its contents.
 * @returns {Promise<void>} Resolves when update completes successfully.
 */
async function updateBot() {
  console.log("Starting bot update...");

  try {
    // Validate Git installation
    if (!isGitInstalled()) {
      throw new Error("Git is not installed. Please install Git and try again.");
    }

    // Stash the setup folder if it exists
    let setupStashed = false;
    if (fs.existsSync(SETUP_DIR)) {
      fs.cpSync(SETUP_DIR, TEMP_SETUP_DIR, { recursive: true });
      console.log(`Stashed setup folder to ${TEMP_SETUP_DIR}`);
      setupStashed = true;
    }

    // Ensure git is initialized
    runCommand(
      "git rev-parse --is-inside-work-tree || git init",
      "Failed to initialize or verify Git repository"
    );

    // Set or update the remote origin
    if (!REPO_URL) {
      throw new Error("Repository URL is not defined. Please set REPO_URL.");
    }
    runCommand(
      `git remote set-url origin ${REPO_URL} || git remote add origin ${REPO_URL}`,
      "Failed to set Git remote origin"
    );

    // Fetch and pull the latest changes (setup/ may be overwritten)
    runCommand("git fetch origin", "Failed to fetch from remote repository");
    runCommand(
      "git reset --hard origin/main",
      "Failed to reset to latest main branch"
    );

    // Restore the stashed setup folder if it was stashed
    if (setupStashed) {
      fs.rmSync(SETUP_DIR, { recursive: true, force: true }); // Remove updated setup
      fs.cpSync(TEMP_SETUP_DIR, SETUP_DIR, { recursive: true }); // Restore original
      fs.rmSync(TEMP_SETUP_DIR, { recursive: true, force: true }); // Clean up temp
      console.log("Restored original setup folder from stash.");
    }

    // Install dependencies
    try {
      runCommand("npm install", "Failed to install NPM dependencies");
    } catch (error) {
      console.warn(`Warning: ${error.message}. Update completed without full dependency install.`);
    }

    console.log("Bot updated successfully.");
  } catch (error) {
    console.error("Update process failed:", error.message);
    // Clean up temp folder if it exists
    if (fs.existsSync(TEMP_SETUP_DIR)) {
      fs.rmSync(TEMP_SETUP_DIR, { recursive: true, force: true });
    }
    throw error; // Propagate to caller
  }
}

module.exports = { updateBot };