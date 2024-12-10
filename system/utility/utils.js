import fs from 'fs-extra';
import path from 'path';
import log from './log.js';
import { create, clear } from './cache.js';

// Ensure cache directory is created and cleared before loading commands and events
await create();
await clear();

export const loadAll = async function() {
    const errs = {};
    const commandsPath = path.join(process.cwd(), 'app', 'cmd');
    const eventsPath = path.join(process.cwd(), 'app', 'event');

    try {
        // Load commands
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            try {
                const cmdModule = await import(path.join(commandsPath, file));
                const cmd = cmdModule.default || cmdModule;
                if (!cmd) {
                    throw new Error('does not export anything');
                } else if (!cmd.config) {
                    throw new Error('does not export config');
                } else if (!cmd.onCommand) {
                    throw new Error('does not export onCommand');
                }
                global.client.commands.set(cmd.config.name, cmd);
            } catch (error) {
                log.error(`Error loading command ${file}: ${error.message}`);
                errs[file] = error;
            }
        }

        // Load events
        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
        for (const file of eventFiles) {
            try {
                const evtModule = await import(path.join(eventsPath, file));
                const evt = evtModule.default || evtModule;
                if (!evt) {
                    throw new Error('does not export anything');
                } else if (!evt.config) {
                    throw new Error('does not export config');
                } else if (!evt.onEvent) {
                    throw new Error('does not export event');
                }
                global.client.events.set(evt.config.name, evt);
            } catch (error) {
                log.error(`Error loading event ${file}: ${error.message}`);
                errs[file] = error;
            }
        }
    } catch (error) {
        log.error(`Unexpected error: ${error.stack}`);
    }

    return Object.keys(errs).length === 0 ? false : errs;
}

export default loadAll;