"use strict";

const { execSync } = require("child_process");
const path = require("path");

// Constants
const REPO_URL = "https://github.com/ajirodesu/wataru.git";
const PROJECT_DIR = path.resolve(__dirname);
const SETUP_DIR_RELATIVE = "setup"; // Relative to PROJECT_DIR
const SETUP_DIR = path.join(PROJECT_DIR, SETUP_DIR_RELATIVE);

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
 * Updates the bot to the latest version from GitHub, excluding the entire setup folder.
 * @returns {Promise<void>} Resolves when update completes successfully.
 */
async function updateBot() {
  console.log("Starting bot update...");

  try {
    // Validate Git installation
    if (!isGitInstalled()) {
      throw new Error("Git is not installed. Please install Git and try again.");
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

    // Mark all files in setup/ as skip-worktree to exclude from updates
    try {
      // List all tracked files in setup/ and apply skip-worktree
      const trackedFiles = execSync(`git ls-files ${SETUP_DIR_RELATIVE}`, { cwd: PROJECT_DIR })
        .toString()
        .trim()
        .split("\n")
        .filter(Boolean); // Remove empty lines
      if (trackedFiles.length > 0) {
        runCommand(
          `git update-index --skip-worktree ${trackedFiles.join(" ")}`,
          "Failed to exclude setup folder contents from updates"
        );
      } else {
        console.log("No tracked files in setup/ to exclude.");
      }
    } catch (error) {
      console.warn(`Warning: ${error.message}. Proceeding with update anyway.`);
    }

    // Fetch and pull the latest changes (setup/ remains untouched)
    runCommand("git fetch origin", "Failed to fetch from remote repository");
    runCommand(
      "git reset --hard origin/main",
      "Failed to reset to latest main branch"
    );

    // Install dependencies
    try {
      runCommand("npm install", "Failed to install NPM dependencies");
    } catch (error) {
      console.warn(`Warning: ${error.message}. Update completed without full dependency install.`);
    }

    console.log("Bot updated successfully.");
  } catch (error) {
    console.error("Update process failed:", error.message);
    throw error; // Propagate to caller (e.g., update.js)
  }
}

module.exports = { updateBot };