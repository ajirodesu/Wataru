const fs = require('fs-extra');
const path = require('path');
const { create, clear } = require('./cache.js');

// Initialize the cache once at startup.
const ready = (async () => {
  try {
    await create();
    await clear();
  } catch (error) {
    console.error('Error initializing cache:', error);
  }
})();

/**
 * Loads modules from a specified directory and registers them into the provided store.
 *
 * @param {string} directory - The absolute path to the directory containing modules.
 * @param {Map} moduleStore - The Map in which to store the loaded modules.
 * @param {string} moduleType - A label used for logging (e.g., 'command' or 'event').
 * @returns {Promise<Object>} - An object containing any errors keyed by filename.
 */
async function loadModulesFromDirectory(directory, moduleStore, moduleType) {
  const errors = {};

  // Attempt to read the directory
  let files;
  try {
    files = await fs.readdir(directory);
  } catch (error) {
    console.error(`Error reading ${moduleType} directory at ${directory}: ${error.message}`);
    errors[directory] = error;
    return errors;
  }

  // Filter for JavaScript files only
  const jsFiles = files.filter(file => file.endsWith('.js'));

  // Process each file individually
  for (const file of jsFiles) {
    const filePath = path.join(directory, file);
    try {
      const moduleImport = require(filePath);
      const moduleExport = moduleImport.default || moduleImport;

      // Ensure the module has the required properties
      if (!moduleExport) {
        throw new Error('Module does not export anything');
      }
      if (!moduleExport.meta) {
        throw new Error('Module does not export meta');
      }
      if (!moduleExport.onStart) {
        throw new Error('Module does not export onStart');
      }

      // Register the module using its meta.name as the key
      moduleStore.set(moduleExport.meta.name, moduleExport);
    } catch (error) {
      console.error(`Error loading ${moduleType} from file ${file}: ${error.message}`);
      errors[file] = error;
    }
  }
  return errors;
}

/**
 * Loads all command and event modules.
 *
 * @returns {Promise<false|Object>} - Returns false if no errors occurred, otherwise an object of errors.
 */
const loadAll = async () => {
  // Ensure cache initialization is complete
  await ready;

  const aggregatedErrors = {};

  // Adjusted paths assuming the current file is in project/system/utility/
  const commandsPath = path.join(__dirname, '..', '..', 'app', 'cmd');
  const eventsPath = path.join(__dirname, '..', '..', 'app', 'evt');

  // Load command modules and capture any errors
  const commandErrors = await loadModulesFromDirectory(
    commandsPath,
    global.client.commands,
    'command'
  );

  // Load event modules and capture any errors
  const eventErrors = await loadModulesFromDirectory(
    eventsPath,
    global.client.events,
    'event'
  );

  // Combine errors from both operations
  Object.assign(aggregatedErrors, commandErrors, eventErrors);

  // Return false if no errors occurred, otherwise return the error details
  return Object.keys(aggregatedErrors).length === 0 ? false : aggregatedErrors;
};

module.exports = loadAll;
