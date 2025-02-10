const { spawn } = require("child_process");
const path = require("path");
const express = require("express");

const app = express();
const SCRIPT_FILE = "main.js";
const SCRIPT_PATH = path.join(__dirname, SCRIPT_FILE);
const PORT = process.env.PORT || 3000;

/**
 * Handles incoming requests and confirms the bot is running.
 */
app.get("/", (req, res) => {
    res.send("Wataru Bot is now running.");
});

/**
 * Starts the Express server.
 */
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

/**
 * Spawns the main bot process and restarts it if necessary.
 */
function startBot() {
    console.log(`Starting bot process: ${SCRIPT_FILE}`);

    const botProcess = spawn("node", [SCRIPT_PATH], {
        cwd: __dirname,
        stdio: "inherit",
        shell: true
    });

    botProcess.on("close", (exitCode) => {
        console.error(`Bot process exited with code ${exitCode}`);

        if (exitCode === 1) {
            console.log("Restarting bot...");
            setTimeout(startBot, 3000); // Small delay to prevent crash loops
        }
    });
}

startBot();
