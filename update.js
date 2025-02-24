"use strict";
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// Constants
const REPO_URL = "https://github.com/ajirodesu/wataru.git";
const PROJECT_DIR = path.resolve(__dirname);
const SETUP_DIR_RELATIVE = "setup";
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
    const output = execSync(command, { 
      cwd: PROJECT_DIR, 
      stdio: "inherit",
      encoding: "utf8"
    });
    console.log(`Executed: ${command}`);
    return output ? output.trim() : "";
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
 * Creates a .gitignore file if it doesn't exist and ensures setup folder is ignored
 */
function ensureGitIgnore() {
  const gitignorePath = path.join(PROJECT_DIR, '.gitignore');
  const setupIgnorePattern = `/${SETUP_DIR_RELATIVE}/`;

  let content = '';
  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, 'utf8');
  }

  if (!content.includes(setupIgnorePattern)) {
    fs.appendFileSync(gitignorePath, `\n${setupIgnorePattern}\n`);
    console.log(`Added ${SETUP_DIR_RELATIVE}/ to .gitignore`);
  }
}

/**
 * Excludes setup folder contents from git updates using skip-worktree
 */
function excludeSetupFolder() {
  try {
    // Get list of tracked files in setup directory
    const trackedFiles = execSync(
      `git ls-files ${SETUP_DIR_RELATIVE}`,
      { cwd: PROJECT_DIR, encoding: "utf8" }
    )
      .trim()
      .split("\n")
      .filter(Boolean);

    if (trackedFiles.length > 0) {
      // Mark each file as skip-worktree
      for (const file of trackedFiles) {
        runCommand(
          `git update-index --skip-worktree "${file}"`,
          `Failed to exclude ${file} from updates`
        );
      }
      console.log(`Excluded ${trackedFiles.length} files in ${SETUP_DIR_RELATIVE}/ from updates`);
    } else {
      console.log(`No tracked files found in ${SETUP_DIR_RELATIVE}/`);
    }
  } catch (error) {
    console.warn(`Warning: Failed to exclude setup folder: ${error.message}`);
  }
}

/**
 * Updates the bot to the latest version from GitHub, preserving the setup folder.
 * @returns {Promise<void>} Resolves when update completes successfully.
 */
async function updateBot() {
  console.log("Starting bot update...");

  try {
    // Validate Git installation
    if (!isGitInstalled()) {
      throw new Error("Git is not installed. Please install Git and try again.");
    }

    // Ensure setup folder is properly ignored
    ensureGitIgnore();

    // Initialize git if needed
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

    // Exclude setup folder from updates
    excludeSetupFolder();

    // Save any local changes in setup folder
    if (fs.existsSync(SETUP_DIR)) {
      runCommand(
        `git stash push ${SETUP_DIR_RELATIVE}`,
        "Failed to stash setup folder changes"
      );
    }

    // Fetch and apply updates
    runCommand("git fetch origin", "Failed to fetch from remote repository");
    runCommand(
      "git reset --hard origin/main",
      "Failed to reset to latest main branch"
    );

    // Restore setup folder changes if they were stashed
    try {
      runCommand("git stash pop", "Failed to restore setup folder changes");
    } catch (error) {
      console.warn("No stashed changes to restore");
    }

    // Install dependencies
    try {
      runCommand("npm install", "Failed to install NPM dependencies");
    } catch (error) {
      console.warn(`Warning: ${error.message}. Update completed without full dependency install.`);
    }

    console.log("Bot updated successfully!");
  } catch (error) {
    console.error("Update process failed:", error.message);
    throw error;
  }
}

module.exports = { updateBot };