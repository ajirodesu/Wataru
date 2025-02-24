const childProcess = require('child_process');
const util = require('util');

// Promisify exec for async/await usage
const exec = util.promisify(childProcess.exec);

/**
 * Automatically installs missing NPM packages and restarts the bot.
 * @param {Object} params - Placeholder for Wataru parameters (not used here).
 */
exports.install = async function() {
  // Store the original require function
  const originalRequire = module.constructor.prototype.require;

  // Override the require function globally
  module.constructor.prototype.require = function(moduleName) {
    try {
      // Attempt to load the module with the original require
      return originalRequire.call(this, moduleName);
    } catch (error) {
      // Check if the error is due to a missing module
      if (error.code === 'MODULE_NOT_FOUND' && error.message.includes(`Cannot find module '${moduleName}'`)) {
        console.log(`Module '${moduleName}' not found. Attempting to install...`);

        try {
          // Install the package synchronously using npm
          childProcess.execSync(`npm install ${moduleName}`, {
            stdio: 'inherit', // Show installation output in console
            cwd: process.cwd() // Install in the current working directory
          });

          console.log(`Successfully installed '${moduleName}'. Restarting bot...`);

          // Restart the bot process
          restartBot();

          // Return a placeholder to avoid breaking the current execution (though it won’t proceed far due to exit)
          return originalRequire.call(this, moduleName);
        } catch (installError) {
          console.error(`Failed to install '${moduleName}': ${installError.message}`);
          throw installError; // Re-throw to let the caller handle the failure
        }
      }
      // Re-throw unrelated errors
      throw error;
    }
  };
};

/**
 * Restarts the bot process.
 */
function restartBot() {
  // Log the restart attempt
  console.log("Bot restarting now...");

  // Exit the process with a success code (0) to trigger a restart via process manager
  process.exit(0);
}

// Ensure this module runs only once
if (!global.install) {
  exports.install();
  global.install = true;
}