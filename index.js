import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import log from './system/utility/log.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function start() {
	const child = spawn('node', ['main.js'], {
		cwd: __dirname,
		stdio: 'inherit',
		shell: true
	});

	child.on('close', (code) => {
		if (code === 2) {
			log.info('Restarting Project...');
			start();
		}
	});
}

start();