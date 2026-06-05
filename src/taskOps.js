/**
 * taskOps.js
 * -----------
 * Contains all core task business logic. Each exported function performs
 * a single, well-defined operation on the task list and returns a result
 * object with a { success, message, data? } shape so callers can act on
 * the outcome without knowing implementation details.
 *
 * Data persistence is delegated to fileHandler; this module stays pure
 * regarding business rules only.
 */

const { readTasks, writeTasks } = require("./fileHandler");
const { PRIORITY_WEIGHT, validateTitle, validateDate } = require("./utils");

// ─── ID generation ────────────────────────────────────────────────────────────

/**
 * Generates a short, readable unique ID for a new task.
 * Format: TM-<timestamp-base36>-<random-suffix>
 * @returns {string}
 */
function generateId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `TM-${ts}-${rnd}`;
}

// ─── CRUD operations ──────────────────────────────────────────────────────────

/**
 * Adds a new task to the list.
 * @param {string} title
 * @param {string} priority  - "Low" | "Medium" | "High"
 * @param {string|null} dueDate - ISO date string or empty
 * @returns {{ success: boolean, message: string, data?: Object }}
 */
function addTask(title, priority, dueDate) {
  const titleCheck = validateTitle(title);
  if (!titleCheck.valid) return { success: false, message: titleCheck.message };

  const dateCheck = validateDate(dueDate);
  if (!dateCheck.valid) return { success: false, message: dateCheck.message };

  const tasks = readTasks();
  const newTask = {
    id: generateId(),
    title: title.trim(),
    status: "pending",
    priority: priority || "Medium",
    dueDate: dueDate && dueDate.trim() !== "" ? dueDate.trim() : null,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };

  tasks.push(newTask);
  writeTasks(tasks);

  return {
    success: true,
    message: `Todo "${newTask.title}" added successfully.`,
    data: newTask,
  };
}

/**
 * Returns all tasks, optionally filtered by status, sorted by field.
 * @param {Object} options
 * @param {string} [options.filter]   - "all" | "pending" | "completed"
 * @param {string} [options.sortBy]   - "id" | "priority" | "dueDate" | "createdAt"
 * @returns {{ success: boolean, data: Array, message?: string }}
 */
function getTasks({ filter = "all", sortBy = "createdAt" } = {}) {
  let tasks = readTasks();

  // ── Filter ─────────────────────────────────────────────────────────────────
  if (filter === "pending") {
    tasks = tasks.filter((t) => t.status === "pending");
  } else if (filter === "completed") {
    tasks = tasks.filter((t) => t.status === "completed");
  }

  // ── Sort ───────────────────────────────────────────────────────────────────
  tasks = sortTasks(tasks, sortBy);

  return { success: true, data: tasks };
}

/**
 * Sorts a task array by the given field.
 * @param {Array} tasks
 * @param {string} sortBy
 * @returns {Array} new sorted array (does not mutate original)
 */
function sortTasks(tasks, sortBy) {
  const copy = [...tasks];

  switch (sortBy) {
    case "priority":
      // Descending: High → Medium → Low
      return copy.sort(
        (a, b) =>
          (PRIORITY_WEIGHT[b.priority] || 0) - (PRIORITY_WEIGHT[a.priority] || 0)
      );

    case "dueDate":
      // Ascending: soonest first; null due dates go last
      return copy.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });

    case "title":
      return copy.sort((a, b) => a.title.localeCompare(b.title));

    case "status":
      // Pending first, then completed
      return copy.sort((a, b) => {
        if (a.status === b.status) return 0;
        return a.status === "pending" ? -1 : 1;
      });

    case "createdAt":
    default:
      // Descending: newest first
      return copy.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
  }
}

/**
 * Marks a task as completed by its ID.
 * @param {string} id
 * @returns {{ success: boolean, message: string }}
 */
function completeTask(id) {
  const tasks = readTasks();
  const idx = tasks.findIndex((t) => t.id === id);

  if (idx === -1) return { success: false, message: `No todo found with ID "${id}".` };
  if (tasks[idx].status === "completed") {
    return { success: false, message: `Todo "${tasks[idx].title}" is already completed.` };
  }

  tasks[idx].status = "completed";
  tasks[idx].completedAt = new Date().toISOString();
  writeTasks(tasks);

  return { success: true, message: `Todo "${tasks[idx].title}" marked as completed.` };
}

/**
 * Deletes a task by its ID.
 * @param {string} id
 * @returns {{ success: boolean, message: string, data?: Object }}
 */
function deleteTask(id) {
  const tasks = readTasks();
  const idx = tasks.findIndex((t) => t.id === id);

  if (idx === -1) return { success: false, message: `No todo found with ID "${id}".` };

  const [removed] = tasks.splice(idx, 1);
  writeTasks(tasks);

  return { success: true, message: `Todo "${removed.title}" deleted.`, data: removed };
}

/**
 * Edits the title, priority, and/or due date of an existing task.
 * Only fields provided (non-null, non-empty) are updated.
 * @param {string} id
 * @param {Object} updates - { title?, priority?, dueDate? }
 * @returns {{ success: boolean, message: string }}
 */
function editTask(id, updates) {
  const tasks = readTasks();
  const idx = tasks.findIndex((t) => t.id === id);

  if (idx === -1) return { success: false, message: `No todo found with ID "${id}".` };

  const task = tasks[idx];

  if (updates.title !== undefined && updates.title.trim() !== "") {
    const check = validateTitle(updates.title);
    if (!check.valid) return { success: false, message: check.message };
    task.title = updates.title.trim();
  }

  if (updates.priority !== undefined && updates.priority !== "") {
    task.priority = updates.priority;
  }

  if (updates.dueDate !== undefined) {
    if (updates.dueDate.trim() === "") {
      task.dueDate = null; // Allow clearing the due date
    } else {
      const check = validateDate(updates.dueDate);
      if (!check.valid) return { success: false, message: check.message };
      task.dueDate = updates.dueDate.trim();
    }
  }

  writeTasks(tasks);
  return { success: true, message: `Todo "${task.title}" updated successfully.` };
}

/**
 * Searches tasks whose title contains the keyword (case-insensitive).
 * @param {string} keyword
 * @returns {{ success: boolean, data: Array, message?: string }}
 */
function searchTasks(keyword) {
  if (!keyword || keyword.trim() === "") {
    return { success: false, message: "Search keyword cannot be empty." };
  }
  const lower = keyword.trim().toLowerCase();
  const tasks = readTasks();
  const results = tasks.filter((t) => t.title.toLowerCase().includes(lower));
  return { success: true, data: results };
}

/**
 * Removes all tasks whose status is "completed".
 * @returns {{ success: boolean, message: string, count: number }}
 */
function clearCompleted() {
  const tasks = readTasks();
  const remaining = tasks.filter((t) => t.status !== "completed");
  const count = tasks.length - remaining.length;

  writeTasks(remaining);
  return {
    success: true,
    message: count > 0
      ? `${count} completed todo${count !== 1 ? "s" : ""} cleared.`
      : "No completed todos to clear.",
    count,
  };
}

/**
 * Returns summary statistics about the current task list.
 * @returns {{ success: boolean, data: Object }}
 */
function getStatistics() {
  const tasks = readTasks();
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const pending = total - completed;

  // Priority breakdown (pending tasks only)
  const byPriority = { High: 0, Medium: 0, Low: 0 };
  tasks
    .filter((t) => t.status === "pending")
    .forEach((t) => {
      if (byPriority[t.priority] !== undefined) byPriority[t.priority]++;
    });

  // Overdue count
  const now = new Date();
  const overdue = tasks.filter(
    (t) => t.status === "pending" && t.dueDate && new Date(t.dueDate) < now
  ).length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    success: true,
    data: { total, completed, pending, overdue, byPriority, completionRate },
  };
}

module.exports = {
  addTask,
  getTasks,
  completeTask,
  deleteTask,
  editTask,
  searchTasks,
  clearCompleted,
  getStatistics,
};
