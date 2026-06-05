/**
 * utils.js
 * ---------
 * Shared helpers used across the application:
 *   - Colored output via chalk
 *   - Date formatting
 *   - Input validation helpers
 *   - Terminal display helpers (dividers, banners, tables)
 *
 * Centralising these prevents duplication and makes it easy to
 * restyle the entire app from one file.
 */

const chalk = require("chalk");

// ─── Color palette ────────────────────────────────────────────────────────────
const color = {
  // Status colors
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.cyan,
  muted: chalk.gray,
  bold: chalk.bold,

  // Priority colors
  high: chalk.red.bold,
  medium: chalk.yellow.bold,
  low: chalk.green.bold,

  // Task status colors
  pending: chalk.yellow,
  completed: chalk.green,

  // UI accent
  accent: chalk.magenta.bold,
  header: chalk.blue.bold,
  title: chalk.white.bold,
};

// ─── Priority helpers ─────────────────────────────────────────────────────────

/** Ordered list used for sorting and validation */
const PRIORITY_LEVELS = ["Low", "Medium", "High"];

/** Numeric weight for sort comparisons (higher = more urgent) */
const PRIORITY_WEIGHT = { Low: 1, Medium: 2, High: 3 };

/**
 * Returns a chalk-styled priority badge string.
 * @param {string} priority
 * @returns {string}
 */
function formatPriority(priority) {
  const map = {
    High: color.high("● High"),
    Medium: color.medium("● Medium"),
    Low: color.low("● Low"),
  };
  return map[priority] || chalk.gray("● Unknown");
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

/**
 * Formats an ISO date string into a human-readable form.
 * @param {string|null} isoString
 * @returns {string}
 */
function formatDate(isoString) {
  if (!isoString) return color.muted("—");
  const d = new Date(isoString);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Determines if a due date is overdue (past today and task still pending).
 * @param {string|null} dueDate - ISO date string
 * @param {string} status
 * @returns {boolean}
 */
function isOverdue(dueDate, status) {
  if (!dueDate || status === "completed") return false;
  return new Date(dueDate) < new Date();
}

/**
 * Formats a due date with an overdue warning if applicable.
 * @param {string|null} dueDate
 * @param {string} status
 * @returns {string}
 */
function formatDueDate(dueDate, status) {
  if (!dueDate) return color.muted("No due date");
  const formatted = formatDate(dueDate);
  if (isOverdue(dueDate, status)) {
    return chalk.red.bold(`${formatted} ⚠ OVERDUE`);
  }
  return formatted;
}

/**
 * Validates a date string in YYYY-MM-DD format.
 * @param {string} input
 * @returns {{ valid: boolean, message?: string }}
 */
function validateDate(input) {
  if (!input || input.trim() === "") return { valid: true }; // optional field
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(input.trim())) {
    return { valid: false, message: "Date must be in YYYY-MM-DD format." };
  }
  const d = new Date(input.trim());
  if (isNaN(d.getTime())) {
    return { valid: false, message: "Invalid calendar date." };
  }
  return { valid: true };
}

// ─── Input validation ─────────────────────────────────────────────────────────

/**
 * Checks that a task title is non-empty and within length limits.
 * @param {string} input
 * @returns {{ valid: boolean, message?: string }}
 */
function validateTitle(input) {
  if (!input || input.trim().length === 0) {
    return { valid: false, message: "Todo title cannot be empty." };
  }
  if (input.trim().length > 120) {
    return { valid: false, message: "Todo title must be 120 characters or fewer." };
  }
  return { valid: true };
}

/**
 * Checks that a numeric menu choice falls within the valid range.
 * @param {string} input - Raw string from readline
 * @param {number} min
 * @param {number} max
 * @returns {{ valid: boolean, value?: number, message?: string }}
 */
function validateMenuChoice(input, min, max) {
  const n = parseInt(input, 10);
  if (isNaN(n) || n < min || n > max) {
    return {
      valid: false,
      message: `Please enter a number between ${min} and ${max}.`,
    };
  }
  return { valid: true, value: n };
}

// ─── Terminal display helpers ─────────────────────────────────────────────────

/** Prints a full-width horizontal rule */
function divider(char = "─", width = 60) {
  console.log(color.muted(char.repeat(width)));
}

/** Prints the app banner on startup */
function printBanner() {
  console.clear();
  console.log();
  console.log(color.accent("  ████████╗ ██████╗  ██████╗  ██████╗ "));
  console.log(color.accent("  ╚══██╔══╝██╔═══██╗ ██╔══██╗██╔═══██╗"));
  console.log(color.accent("     ██║   ██║   ██║ ██║  ██║██║   ██║"));
  console.log(color.accent("     ██║   ██║   ██║ ██║  ██║██║   ██║"));
  console.log(color.accent("     ██║   ╚██████╔╝ ██████╔╝╚██████╔╝"));
  console.log(color.accent("     ╚═╝    ╚═════╝  ╚═════╝  ╚═════╝ "));
  console.log();
  console.log(color.title("         TodoList CLI  v1.0.0"));
  console.log(color.muted("       Your productivity, organized."));
  console.log();
}

/**
 * Prints a section header with surrounding dividers.
 * @param {string} title
 */
function sectionHeader(title) {
  console.log();
  divider();
  console.log(color.header(`  ${title}`));
  divider();
}

/**
 * Prints a success message.
 * @param {string} message
 */
function printSuccess(message) {
  console.log(color.success(`\n  ✔  ${message}`));
}

/**
 * Prints an error message.
 * @param {string} message
 */
function printError(message) {
  console.log(color.error(`\n  ✖  ${message}`));
}

/**
 * Prints an info message.
 * @param {string} message
 */
function printInfo(message) {
  console.log(color.info(`\n  ℹ  ${message}`));
}

/**
 * Prints a warning message.
 * @param {string} message
 */
function printWarning(message) {
  console.log(color.warning(`\n  ⚠  ${message}`));
}

/**
 * Renders a single task as a formatted card in the terminal.
 * @param {Object} task
 * @param {number} index - Display index (1-based)
 */
function renderTaskCard(task, index) {
  const statusIcon = task.status === "completed"
    ? color.completed("✔")
    : color.pending("○");

  const titleText = task.status === "completed"
    ? chalk.strikethrough.gray(task.title)
    : color.title(task.title);

  console.log(
    `\n  ${color.muted(String(index).padStart(2, "0"))}  ${statusIcon}  ${titleText}`
  );
  console.log(
    `       ${color.muted("ID:")} ${chalk.cyan(task.id)}  ` +
    `${color.muted("Priority:")} ${formatPriority(task.priority)}  ` +
    `${color.muted("Due:")} ${formatDueDate(task.dueDate, task.status)}`
  );
  console.log(
    `       ${color.muted("Created:")} ${formatDate(task.createdAt)}` +
    (task.completedAt
      ? `  ${color.muted("Completed:")} ${formatDate(task.completedAt)}`
      : "")
  );
}

module.exports = {
  color,
  PRIORITY_LEVELS,
  PRIORITY_WEIGHT,
  formatPriority,
  formatDate,
  formatDueDate,
  isOverdue,
  validateDate,
  validateTitle,
  validateMenuChoice,
  divider,
  printBanner,
  sectionHeader,
  printSuccess,
  printError,
  printInfo,
  printWarning,
  renderTaskCard,
};
