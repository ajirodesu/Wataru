import fs from 'fs-extra';
import path from 'path';
import express from 'express';
import chalk from 'chalk';
import figlet from 'figlet';
import log from './system/utility/log.js';
import { loadAll } from './system/utility/utils.js';
import config from './json/config.json' assert { type: 'json' };
import vip from './json/vip.json' assert { type: 'json' };
import api from './json/api.json' assert { type: 'json' };
import { listen } from './system/listen.js';
import bot from './system/handler/login.js';

const app = express();
const port = 8601;

// Use the imported JSON directly
global.config = config;
global.api = api;
global.vip = vip;
global.bot = bot;
global.utils = loadAll;
global.client = {
  startTime: new Date(),
  commands: new Map(),
  events: new Map(),
  results: new Map(),
  replies: new Map(),
  cooldowns: new Map(),
  reactions: {},
};

// Convert figlet to async function with modern syntax
const generateFiglet = async (text) => {
  return new Promise((resolve, reject) => {
    figlet.text(text, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
};

try {
  // Top-level await for modern ES2024 syntax
  const figletText = await generateFiglet('Wataru');
  console.log(chalk.blue(figletText));

  const loadErrors = await loadAll();

  if (loadErrors) {
    log.error('Errors occurred while loading commands or events:', loadErrors);
  }

  // Check if `global.db` is properly initialized
  if (!global.db || typeof global.db.getAllUserIds !== 'function' || typeof global.db.getAllGroupIds !== 'function') {
    throw new Error('Database methods are not defined in global.db');
  }

  const totalUser = (await global.db.getAllUserIds()).length;
  const totalGroup = (await global.db.getAllGroupIds()).length;

  log.info(`Commands: ${global.client.commands.size}`);
  log.info(`Events: ${global.client.events.size}`);
  log.info(`Users: ${totalUser}`);
  log.info(`Groups: ${totalGroup}`);
  log.info(`Owner: ${global.config.owner}`);

  // Set up express server
  app.get('/', (req, res) => {
    res.send('Online!');
  });

  app.listen(port, () => {
    log.info(`Wataru is running on port ${port}`);
  });

  // Start listening for Telegram messages
  listen({ log, bot });
} catch (error) {
  log.error('Error during startup: ' + error);
}
