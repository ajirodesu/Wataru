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
 * Permanently excludes setup folder from git tracking
 */
function excludeSetupFolder() {
  // Add to .gitignore if not already present
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

  // Remove setup folder from git tracking if it was previously tracked
  try {
    // First check if the setup folder is tracked
    const trackedFiles = execSync(
      `git ls-files ${SETUP_DIR_RELATIVE}`,
      { cwd: PROJECT_DIR, encoding: "utf8" }
    )
      .trim()
      .split("\n")
      .filter(Boolean);

    if (trackedFiles.length > 0) {
      // Remove the files from git tracking
      runCommand(
        `git rm -r --cached ${SETUP_DIR_RELATIVE}`,
        "Failed to untrack setup folder"
      );

      // Add the changes to a new commit
      runCommand(
        'git commit -m "Remove setup folder from git tracking"',
        "Failed to commit setup folder removal"
      );

      console.log(`Successfully removed ${SETUP_DIR_RELATIVE}/ from git tracking`);
    }
  } catch (error) {
    console.warn(`Note: Setup folder is already untracked or doesn't exist`);
  }
}

/**
 * Updates the bot to the latest version from GitHub, completely ignoring the setup folder.
 * @returns {Promise<void>} Resolves when update completes successfully.
 */
async function updateBot() {
  console.log("Starting bot update...");

  try {
    // Validate Git installation
    if (!isGitInstalled()) {
      throw new Error("Git is not installed. Please install Git and try again.");
    }

    // Ensure setup folder is completely excluded from git
    excludeSetupFolder();

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

    // Create a temporary exclude file for the update process
    const tempExcludePath = path.join(PROJECT_DIR, '.git', 'info', 'exclude');
    fs.mkdirSync(path.dirname(tempExcludePath), { recursive: true });
    fs.appendFileSync(tempExcludePath, `\n${SETUP_DIR_RELATIVE}/\n`);

    // Fetch and apply updates
    runCommand("git fetch origin", "Failed to fetch from remote repository");

    // Save current HEAD for comparison
    const oldHead = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();

    // Apply updates while keeping setup folder untouched
    runCommand(
      `git reset --hard origin/main -- $(git ls-files | grep -v "^${SETUP_DIR_RELATIVE}/")`,
      "Failed to reset to latest main branch"
    );

    // Install dependencies only if there were actual updates
    const newHead = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    if (oldHead !== newHead) {
      try {
        runCommand("npm install", "Failed to install NPM dependencies");
      } catch (error) {
        console.warn(`Warning: ${error.message}. Update completed without full dependency install.`);
      }
    }

    console.log("Bot updated successfully!");
    console.log(`Note: ${SETUP_DIR_RELATIVE}/ folder was preserved and remains unchanged.`);
  } catch (error) {
    console.error("Update process failed:", error.message);
    throw error;
  }
}

module.exports = { updateBot };