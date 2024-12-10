// cache.js
import fs from 'fs';
import path from 'path';
import log from './log.js';

const cacheDir = path.join(process.cwd(), 'app/temp');

export const create = async () => {
  try {
    await fs.promises.mkdir(cacheDir, { recursive: true });
  } catch (err) {
    log.error(`Error creating cache directory: ${err.message}`);
  }
};

export const clear = async () => {
  try {
    const files = await fs.promises.readdir(cacheDir);
    if (files.length) {
      const deletePromises = files.map(async (file) => {
        const filePath = path.join(cacheDir, file);
        try {
          await fs.promises.unlink(filePath);
          return file;
        } catch (err) {
          log.error(`Error deleting file: ${filePath} - ${err.message}`);
          return null;
        }
      });

      const deletedFiles = (await Promise.all(deletePromises)).filter(Boolean);
      if (deletedFiles.length) {
        log.system(`${deletedFiles.length} cache files have been cleared: ${deletedFiles.join(', ')}`);
      }
    }
  } catch (err) {
    log.error(`Error clearing cache: ${err.message}`);
  }
};

export const watch = async () => {
  try {
    await create(); // Ensure cache directory exists before watching
    fs.watch(cacheDir, (eventType, filename) => {
      if (eventType === 'rename' && filename) {
        setTimeout(async () => {
          const files = await fs.promises.readdir(cacheDir);
          if (files.length) {
            log.system(`${files.length} cache files detected. Clearing cache now.`);
            await clear();
          }
        }, 5000); // 5-second delay before detecting
      }
    });
  } catch (err) {
    log.error(`Error watching cache directory: ${err.message}`);
  }
};

await create();
await watch();
