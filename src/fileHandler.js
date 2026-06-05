/**
 * fileHandler.js
 * ---------------
 * Responsible for all file I/O operations.
 * Reads and writes the tasks.json data file that provides persistence
 * across sessions. Handles errors gracefully so the app never crashes
 * on a missing or corrupted data file.
 */

const fs = require("fs");
const path = require("path");

// Resolve the data file path relative to the project root
const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "tasks.json");

/**
 * Ensures the data directory and file exist.
 * Called once on startup so subsequent reads/writes are safe.
 */
function initStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    // Write an empty task list on first run
    fs.writeFileSync(DATA_FILE, JSON.stringify({ tasks: [] }, null, 2), "utf8");
  }
}

/**
 * Reads all tasks from the JSON file.
 * @returns {Array} Array of task objects (empty array if file is missing/corrupt)
 */
function readTasks() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    // Defensive: always return an array
    return Array.isArray(parsed.tasks) ? parsed.tasks : [];
  } catch (err) {
    // Return empty list if file is unreadable or JSON is malformed
    return [];
  }
}

/**
 * Writes the provided task array back to the JSON file.
 * Wraps tasks in an object so the file has a clear schema.
 * @param {Array} tasks - Array of task objects to persist
 * @returns {boolean} true on success, false on failure
 */
function writeTasks(tasks) {
  try {
    const payload = JSON.stringify({ tasks }, null, 2);
    fs.writeFileSync(DATA_FILE, payload, "utf8");
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Returns the absolute path of the data file (used in UI messages).
 * @returns {string}
 */
function getDataFilePath() {
  return DATA_FILE;
}

module.exports = { initStorage, readTasks, writeTasks, getDataFilePath };
