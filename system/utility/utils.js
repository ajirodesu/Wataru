const fs = require('fs-extra');
const path = require('path');
const { create, clear } = require('./cache.js');

const ready = (async function () {
  await create();
  await clear();
})();

const loadAll = async function () {
  await ready;

  const errs = {};
  // Adjusted paths assuming utils.js is in project/system/utility/
  const commandsPath = path.join(__dirname, '..', '..', 'app', 'cmd');
  const eventsPath = path.join(__dirname, '..', '..', 'app', 'evt');

  try {
    // Load commands
    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((file) => file.endsWith('.js'));

    for (const file of commandFiles) {
      try {
        const cmdModule = require(path.join(commandsPath, file));
        const cmd = cmdModule.default || cmdModule;
        if (!cmd) {
          throw new Error('does not export anything');
        } else if (!cmd.meta) {
          throw new Error('does not export meta');
        } else if (!cmd.onStart) {
          throw new Error('does not export onStart');
        }
        global.client.commands.set(cmd.meta.name, cmd);
      } catch (error) {
        console.error(`Error loading command ${file}: ${error.message}`);
        errs[file] = error;
      }
    }

    // Load events
    const eventFiles = fs
      .readdirSync(eventsPath)
      .filter((file) => file.endsWith('.js'));

    for (const file of eventFiles) {
      try {
        const evtModule = require(path.join(eventsPath, file));
        const evt = evtModule.default || evtModule;
        if (!evt) {
          throw new Error('does not export anything');
        } else if (!evt.meta) {
          throw new Error('does not export meta');
        } else if (!evt.onStart) {
          throw new Error('does not export onStart');
        }
        global.client.events.set(evt.meta.name, evt);
      } catch (error) {
        console.error(`Error loading event ${file}: ${error.message}`);
        errs[file] = error;
      }
    }
  } catch (error) {
    console.error(`Unexpected error: ${error.stack}`);
  }

  return Object.keys(errs).length === 0 ? false : errs;
};

module.exports = loadAll;
