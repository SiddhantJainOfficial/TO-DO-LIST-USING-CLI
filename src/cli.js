/**
 * cli.js
 * -------
 * Drives the interactive menu loop. Each exported "screen" function handles
 * one user interaction: gathering input via readline-sync, delegating work
 * to taskOps, and printing feedback via utils.
 *
 * The main export is `runApp()`, which is called from index.js.
 */

const readlineSync = require("readline-sync");
const chalk = require("chalk");

const {
  addTask,
  getTasks,
  completeTask,
  deleteTask,
  editTask,
  searchTasks,
  clearCompleted,
  getStatistics,
} = require("./taskOps");

const {
  color,
  PRIORITY_LEVELS,
  sectionHeader,
  printBanner,
  printSuccess,
  printError,
  printInfo,
  printWarning,
  renderTaskCard,
  divider,
  validateMenuChoice,
  formatPriority,
} = require("./utils");

// ─── Main menu definition ──────────────────────────────────────────────────────

const MENU_ITEMS = [
  { label: "Add a new todo",                icon: "+" },
  { label: "View todo list",                icon: "≡" },
  { label: "View pending todos",            icon: "○" },
  { label: "View completed todos",          icon: "✔" },
  { label: "Mark a todo as completed",      icon: "✓" },
  { label: "Edit / update a todo",          icon: "✎" },
  { label: "Delete a todo",                 icon: "✕" },
  { label: "Search todos by keyword",       icon: "⌕" },
  { label: "Todo statistics",               icon: "◈" },
  { label: "Clear all completed todos",     icon: "⌫" },
  { label: "Exit",                          icon: "⏻" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Pauses execution until the user presses Enter.
 */
function pause() {
  console.log();
  readlineSync.question(color.muted("  Press Enter to return to menu..."));
}

/**
 * Prompts the user to choose a sort order and returns the key.
 * @returns {string}
 */
function chooseSortOrder() {
  console.log(color.muted("\n  Sort by:"));
  const sortOptions = ["Created date (newest first)", "Priority (High → Low)", "Due date (soonest first)", "Title (A → Z)", "Status (Pending first)"];
  const sortKeys    = ["createdAt", "priority", "dueDate", "title", "status"];

  sortOptions.forEach((opt, i) => {
    console.log(color.muted(`    ${i + 1}. ${opt}`));
  });

  const raw = readlineSync.question(color.info("\n  Sort choice [1-5, default 1]: "));
  const n = parseInt(raw, 10);
  if (n >= 1 && n <= sortOptions.length) return sortKeys[n - 1];
  return "createdAt";
}

/**
 * Renders an array of tasks or a "none found" message.
 * @param {Array}  tasks
 * @param {string} emptyMessage
 */
function renderTaskList(tasks, emptyMessage) {
  if (tasks.length === 0) {
    printInfo(emptyMessage);
    return;
  }
  tasks.forEach((task, i) => renderTaskCard(task, i + 1));
  console.log();
  divider();
  printInfo(`${tasks.length} todo${tasks.length !== 1 ? "s" : ""} shown.`);
}

/**
 * Prompts the user to enter a task ID and validates it.
 * @param {string} promptText
 * @returns {string|null} The trimmed ID string, or null if the user cancels.
 */
function promptForId(promptText) {
  const id = readlineSync.question(color.info(`\n  ${promptText}: `)).trim();
  if (!id) {
    printWarning("No ID entered. Operation cancelled.");
    return null;
  }
  return id;
}

// ─── Screen: Add task ──────────────────────────────────────────────────────────

function screenAddTask() {
  sectionHeader("Add New Todo");

  // Title
  const title = readlineSync.question(color.info("  Todo title: "));

  // Priority
  console.log(color.muted("\n  Priority level:"));
  PRIORITY_LEVELS.forEach((p, i) => {
    console.log(`    ${i + 1}. ${formatPriority(p)}`);
  });
  const priorityRaw = readlineSync.question(color.info("\n  Choose priority [1-3, default 2]: "));
  const priorityIdx = parseInt(priorityRaw, 10);
  const priority = (priorityIdx >= 1 && priorityIdx <= 3)
    ? PRIORITY_LEVELS[priorityIdx - 1]
    : "Medium";

  // Due date
  const dueDate = readlineSync.question(
    color.info("  Due date (YYYY-MM-DD, leave blank to skip): ")
  );

  const result = addTask(title, priority, dueDate);
  result.success ? printSuccess(result.message) : printError(result.message);

  pause();
}

// ─── Screen: View tasks ────────────────────────────────────────────────────────

function screenViewTasks(filter = "all") {
  const labelMap = { all: "Todo List", pending: "Pending Todos", completed: "Completed Todos" };
  sectionHeader(labelMap[filter] || "Todos");

  const sortBy = chooseSortOrder();
  const result = getTasks({ filter, sortBy });

  const emptyMap = {
    all: "No todos found. Add your first todo!",
    pending: "No pending todos. Great job!",
    completed: "No completed todos yet.",
  };

  renderTaskList(result.data, emptyMap[filter]);
  pause();
}

// ─── Screen: Complete task ─────────────────────────────────────────────────────

function screenCompleteTask() {
  sectionHeader("Mark Todo as Completed");

  // Show pending tasks first for reference
  const { data: pending } = getTasks({ filter: "pending", sortBy: "createdAt" });
  if (pending.length === 0) {
    printInfo("No pending todos to complete!");
    pause();
    return;
  }
  renderTaskList(pending, "");

  const id = promptForId("Enter Todo ID to mark as completed");
  if (!id) { pause(); return; }

  const result = completeTask(id);
  result.success ? printSuccess(result.message) : printError(result.message);

  pause();
}

// ─── Screen: Edit task ─────────────────────────────────────────────────────────

function screenEditTask() {
  sectionHeader("Edit / Update Todo");

  const { data: allTasks } = getTasks({ filter: "all", sortBy: "createdAt" });
  if (allTasks.length === 0) {
    printInfo("No todos to edit.");
    pause();
    return;
  }
  renderTaskList(allTasks, "");

  const id = promptForId("Enter Todo ID to edit");
  if (!id) { pause(); return; }

  // Fetch the task to show current values
  const task = allTasks.find((t) => t.id === id);
  if (!task) {
    printError(`No todo found with ID "${id}".`);
    pause();
    return;
  }

  console.log(color.muted(`\n  Current title   : ${task.title}`));
  console.log(color.muted(`  Current priority: ${task.priority}`));
  console.log(color.muted(`  Current due date: ${task.dueDate || "None"}`));
  console.log(color.muted("\n  (Leave blank to keep current value)"));

  const newTitle    = readlineSync.question(color.info("\n  New title: "));
  
  console.log(color.muted("\n  New priority:"));
  PRIORITY_LEVELS.forEach((p, i) => console.log(`    ${i + 1}. ${formatPriority(p)}`));
  const priorityRaw = readlineSync.question(color.info("\n  Choose priority [1-3]: "));
  const priorityIdx = parseInt(priorityRaw, 10);
  const newPriority = (priorityIdx >= 1 && priorityIdx <= 3)
    ? PRIORITY_LEVELS[priorityIdx - 1]
    : "";

  const newDueDate = readlineSync.question(
    color.info("  New due date (YYYY-MM-DD, or 'clear' to remove): ")
  );

  const updates = {
    title: newTitle,
    priority: newPriority,
    dueDate: newDueDate.trim().toLowerCase() === "clear" ? "" : newDueDate,
  };

  const result = editTask(id, updates);
  result.success ? printSuccess(result.message) : printError(result.message);

  pause();
}

// ─── Screen: Delete task ───────────────────────────────────────────────────────

function screenDeleteTask() {
  sectionHeader("Delete Todo");

  const { data: allTasks } = getTasks({ filter: "all", sortBy: "createdAt" });
  if (allTasks.length === 0) {
    printInfo("No todos to delete.");
    pause();
    return;
  }
  renderTaskList(allTasks, "");

  const id = promptForId("Enter Todo ID to delete");
  if (!id) { pause(); return; }

  // Confirm before deleting
  const task = allTasks.find((t) => t.id === id);
  if (!task) {
    printError(`No todo found with ID "${id}".`);
    pause();
    return;
  }

  const confirm = readlineSync.question(
    color.warning(`\n  ⚠  Are you sure you want to delete "${task.title}"? (y/N): `)
  );

  if (confirm.trim().toLowerCase() !== "y") {
    printInfo("Deletion cancelled.");
    pause();
    return;
  }

  const result = deleteTask(id);
  result.success ? printSuccess(result.message) : printError(result.message);

  pause();
}

// ─── Screen: Search ────────────────────────────────────────────────────────────

function screenSearch() {
  sectionHeader("Search Todos");

  const keyword = readlineSync.question(color.info("  Enter search keyword: "));
  const result = searchTasks(keyword);

  if (!result.success) {
    printError(result.message);
    pause();
    return;
  }

  console.log();
  printInfo(`Results for "${keyword}":`);
  renderTaskList(result.data, "No todos match your search.");
  pause();
}

// ─── Screen: Statistics ────────────────────────────────────────────────────────

function screenStatistics() {
  sectionHeader("Todo Statistics");

  const { data: stats } = getStatistics();

  const bar = (count, total, width = 30) => {
    if (total === 0) return color.muted("─".repeat(width));
    const filled = Math.round((count / total) * width);
    return color.completed("█".repeat(filled)) + color.muted("░".repeat(width - filled));
  };

  console.log();
  console.log(`  ${color.title("Total Todos  ")}  ${chalk.white.bold(stats.total)}`);
  console.log();

  console.log(`  ${color.pending("Pending      ")}  ${chalk.yellow.bold(stats.pending)}`);
  console.log(`  ${color.muted("             ")}  ${bar(stats.pending, stats.total)}`);
  console.log();

  console.log(`  ${color.completed("Completed    ")}  ${chalk.green.bold(stats.completed)}`);
  console.log(`  ${color.muted("             ")}  ${bar(stats.completed, stats.total)}`);
  console.log();

  console.log(`  ${chalk.red("Overdue      ")}  ${chalk.red.bold(stats.overdue)}`);
  console.log();

  divider("─", 45);
  console.log(color.muted("  Priority breakdown (pending todos)"));
  console.log();
  console.log(`    ${color.high("High   ")}  ${stats.byPriority.High}`);
  console.log(`    ${color.medium("Medium ")}  ${stats.byPriority.Medium}`);
  console.log(`    ${color.low("Low    ")}  ${stats.byPriority.Low}`);
  console.log();
  divider("─", 45);
  console.log(`  Completion rate:  ${chalk.cyan.bold(stats.completionRate + "%")}`);
  console.log();

  pause();
}

// ─── Screen: Clear completed ───────────────────────────────────────────────────

function screenClearCompleted() {
  sectionHeader("Clear All Completed Todos");

  const { data: completed } = getTasks({ filter: "completed", sortBy: "completedAt" });

  if (completed.length === 0) {
    printInfo("No completed todos to clear.");
    pause();
    return;
  }

  printInfo(`You have ${completed.length} completed todo${completed.length !== 1 ? "s" : ""}.`);

  const confirm = readlineSync.question(
    color.warning(`\n  ⚠  Permanently delete all ${completed.length} completed todo(s)? (y/N): `)
  );

  if (confirm.trim().toLowerCase() !== "y") {
    printInfo("Operation cancelled.");
    pause();
    return;
  }

  const result = clearCompleted();
  result.success ? printSuccess(result.message) : printError(result.message);

  pause();
}

// ─── Main menu loop ────────────────────────────────────────────────────────────

/**
 * Renders the main menu and returns the user's validated choice (1-based).
 * @returns {number}
 */
function showMainMenu() {
  printBanner();

  // Quick stats in header
  const { data: stats } = getStatistics();
  console.log(
    `  ${color.muted("Todo List:")}  ` +
    `${color.pending(stats.pending + " pending")}  ·  ` +
    `${color.completed(stats.completed + " completed")}` +
    (stats.overdue > 0 ? `  ·  ${chalk.red.bold(stats.overdue + " overdue")}` : "")
  );
  console.log();
  divider();

  MENU_ITEMS.forEach((item, i) => {
    const num = color.muted(`  ${String(i + 1).padStart(2, " ")}.`);
    const icon = color.accent(` ${item.icon} `);
    console.log(`${num}${icon}${chalk.white(item.label)}`);
  });

  divider();

  let choice = null;
  while (choice === null) {
    const raw = readlineSync.question(color.info("\n  Choose an option [1-11]: "));
    const validation = validateMenuChoice(raw, 1, MENU_ITEMS.length);
    if (validation.valid) {
      choice = validation.value;
    } else {
      printError(validation.message);
    }
  }

  return choice;
}

/**
 * Application entry point. Runs the main menu loop until the user exits.
 */
function runApp() {
  while (true) {
    const choice = showMainMenu();

    switch (choice) {
      case 1:  screenAddTask();                   break;
      case 2:  screenViewTasks("all");            break;
      case 3:  screenViewTasks("pending");        break;
      case 4:  screenViewTasks("completed");      break;
      case 5:  screenCompleteTask();              break;
      case 6:  screenEditTask();                  break;
      case 7:  screenDeleteTask();                break;
      case 8:  screenSearch();                    break;
      case 9:  screenStatistics();               break;
      case 10: screenClearCompleted();           break;
      case 11:
        console.clear();
        console.log();
        console.log(color.accent("  Goodbye! Stay productive. 👋"));
        console.log();
        process.exit(0);
    }
  }
}

module.exports = { runApp };
