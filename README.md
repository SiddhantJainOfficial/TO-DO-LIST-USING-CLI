# TodoList CLI

A feature-rich, interactive command-line To-Do List Manager built with Node.js and JavaScript. TodoList CLI helps you organise your work with todo priorities, due dates, search, sorting, and statistics — all from your terminal.

---

## Features

| Feature                | Description                                                             |
| ---------------------- | ----------------------------------------------------------------------- |
| **Add todos**          | Create todos with a title, priority level, and optional due date        |
| **View todo list**     | Browse todos with flexible sort options                                 |
| **Complete todos**     | Mark any pending todo as done                                           |
| **Edit todos**         | Update title, priority, or due date of any existing todo                |
| **Delete todos**       | Remove todos with a confirmation prompt                                 |
| **Search**             | Find todos by keyword (case-insensitive)                                |
| **Statistics**         | Visual progress bar, priority breakdown, overdue count, completion rate |
| **Clear completed**    | Bulk-remove all completed todos                                         |
| **Persistent storage** | All data saved to a local JSON file — survives restarts                 |
| **Colour output**      | Priority badges, overdue warnings, status icons                         |

<img width="724" height="645" alt="image" src="https://github.com/user-attachments/assets/89f96d35-4915-4731-89ea-1dfd25fe5e1d" />

---

## Tech Stack

- **Runtime:** Node.js (v14+)
- **Language:** JavaScript (ES6+)
- **Persistence:** `fs` module → `data/tasks.json`
- **Dependencies:**
  - [`chalk`](https://www.npmjs.com/package/chalk) — terminal colour styling
  - [`readline-sync`](https://www.npmjs.com/package/readline-sync) — synchronous CLI prompts

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/SiddhantJainOfficial/taskmaster-cli.git
cd taskmaster-cli

# 2. Install dependencies
npm install

# 3. Run the application
npm start
```

> **Optional:** Install globally to run from anywhere
>
> ```bash
> npm install -g .
> taskmaster
> ```

---

## Usage

Launch the app and use the numbered menu to navigate:

```
  01.  +  Add a new todo
  02.  ≡  View todo list
  03.  ○  View pending todos
  04.  ✔  View completed todos
  05.  ✓  Mark a todo as completed
  06.  ✎  Edit / update a todo
  07.  ✕  Delete a todo
  08.  ⌕  Search todos by keyword
  09.  ◈  Todo statistics
  10.  ⌫  Clear all completed todos
  11.  ⏻  Exit
```

### Adding a todo

1. Select **1** from the menu.
2. Enter a todo title (max 120 characters).
3. Choose a priority: `Low`, `Medium`, or `High`.
4. Optionally set a due date in `YYYY-MM-DD` format, or press Enter to skip.

### Editing a todo

1. Select **6** from the menu.
2. Find the Todo ID from the displayed list.
3. Enter the ID and provide updated values (blank input keeps the current value).
4. Enter `clear` for the due date field to remove an existing date.

### Deleting a todo

Deletion requires explicit confirmation (`y`) to prevent accidental data loss.

---

## Project Structure

```
taskmaster-cli/
│
├── index.js              # Entry point — bootstraps storage and starts the menu loop
│
├── src/
│   ├── cli.js            # All menu screens and user-facing interaction logic
│   ├── taskOps.js        # Core business logic (CRUD, search, stats, sort)
│   ├── fileHandler.js    # File I/O — reads/writes data/tasks.json
│   └── utils.js          # Shared helpers: colours, formatting, validation
│
├── data/
│   └── tasks.json        # Persistent todo store (auto-created on first run)
│
├── package.json
│   └── README.md
```

### Module responsibilities

**`index.js`**  
The application shell. Initialises storage, attaches `SIGINT` / `uncaughtException` handlers, and calls `runApp()`.

**`src/cli.js`**  
Contains one "screen" function per menu item. Each screen handles user prompts, calls the appropriate `taskOps` function, and prints feedback. The `runApp()` loop lives here.

**`src/taskOps.js`**  
Pure business logic. Every exported function returns `{ success, message, data? }` so callers can branch on success/failure without knowing implementation details. Sorting, filtering, ID generation, and statistics are all here.

**`src/fileHandler.js`**  
Thin I/O layer. `initStorage()` ensures the data directory and file exist. `readTasks()` / `writeTasks()` handle JSON parsing/serialisation with error catching.

**`src/utils.js`**  
Shared constants and helpers: chalk colour palette, `renderTaskCard()`, `formatDate()`, `validateTitle()`, `validateDate()`, `printSuccess()`, etc.

---

## Todo Data Schema

Each todo in `tasks.json` follows this schema:

```json
{
  "id": "TM-LXYZ1A2-B3C",
  "title": "Write unit tests",
  "status": "pending",
  "priority": "High",
  "dueDate": "2025-06-15",
  "createdAt": "2025-06-01T09:00:00.000Z",
  "completedAt": null
}
```

| Field         | Type         | Description                      |
| ------------- | ------------ | -------------------------------- |
| `id`          | string       | Auto-generated unique identifier |
| `title`       | string       | Todo description (max 120 chars) |
| `status`      | string       | `"pending"` or `"completed"`     |
| `priority`    | string       | `"Low"`, `"Medium"`, or `"High"` |
| `dueDate`     | string\|null | ISO date `YYYY-MM-DD` or `null`  |
| `createdAt`   | string       | ISO 8601 timestamp               |
| `completedAt` | string\|null | ISO 8601 timestamp or `null`     |

---

## Sort Options

When viewing todos you can sort by:

| Option       | Behaviour                                     |
| ------------ | --------------------------------------------- |
| Created date | Newest first (default)                        |
| Priority     | High → Medium → Low                           |
| Due date     | Soonest first; todos with no due date go last |
| Title        | Alphabetical A → Z                            |
| Status       | Pending first, then completed                 |

---
