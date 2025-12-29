import { useEffect, useState } from "react";
import {
  getTasks,
  createTask,
  updateTask as apiUpdateTask,
  deleteTask as apiDeleteTask,
} from "./api/tasks";

function App() {
  /* ---------- State ---------- */
  const [loadMsg, setLoadMsg] = useState("⏳ Waking up the server… loading can take up to 60 seconds on free-tier hosting.");
  const [tasks, setTasks] = useState([]); // Task list
  const [title, setTitle] = useState(""); // Add input value

  const [loading, setLoading] = useState(true); // Initial fetch
  const [saving, setSaving] = useState(false); // POST state
  const [updating, setUpdating] = useState(false); // edit title
  const [deletingId, setDeletingId] = useState(null); // Per-item DELETE
  const [togglingId, setTogglingId] = useState(null); // Per-item completed toggle

  const [editingId, setEditingId] = useState(null); // Which task is being edited
  const [editTitle, setEditTitle] = useState(""); // Edit input value

  const [error, setError] = useState(""); // User-facing errors

  /* ---------- Read ---------- */
  const loadTasks = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getTasks();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  // Fetch once on mount, loading message
  useEffect(() => {
    let mounted = true;

    const timer = setTimeout(() => {
      if (mounted) {
        setLoadMsg(
          "⏳ Still starting up… free-tier hosting can take up to 60 seconds on the first visit."
        );
      }
    }, 10000);

    loadTasks();

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  /* ---------- Create ---------- */
  const addTask = async (e) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    setSaving(true);
    setError("");

    try {
      await createTask(trimmed);
      setTitle("");
      await loadTasks(); // keep backend as source of truth
    } catch (err) {
      setError(err?.message || "Failed to add task");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Delete ---------- */
  const deleteTask = async (id) => {
    if (!id) return;

    setDeletingId(id);
    setError("");

    const prev = tasks;
    setTasks(prev.filter((t) => (t.id ?? t._id) !== id));

    try {
      await apiDeleteTask(id);
    } catch (err) {
      setTasks(prev); // rollback on failure
      setError(err?.message || "Failed to delete task");
    } finally {
      setDeletingId(null);
    }
  };

  /* ---------- Edit helpers ---------- */
  const startEdit = (task) => {
    const id = task.id ?? task._id;
    setEditingId(id);
    setEditTitle(task.title);
    setError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setError("");
  };

  /* ---------- Update title ---------- */
  const updateTaskTitle = async (id) => {
    const trimmed = editTitle.trim();
    if (!trimmed) return;

    setUpdating(true);
    setError("");

    try {
      await apiUpdateTask(id, { title: trimmed });
      await loadTasks();
      cancelEdit();
    } catch (err) {
      setError(err?.message || "Failed to update task");
    } finally {
      setUpdating(false);
    }
  };

  /* ---------- Toggle completed ---------- */
  const toggleCompleted = async (task) => {
    const id = task.id ?? task._id;
    if (!id) return;

    setTogglingId(id);
    setError("");

    const prev = tasks;

    // UI update
    setTasks(
      prev.map((t) =>
        (t.id ?? t._id) === id ? { ...t, completed: !t.completed } : t
      )
    );

    try {
      await apiUpdateTask(id, { completed: !task.completed });
    } catch (err) {
      setTasks(prev); // rollback
      setError(err?.message || "Failed to toggle completed");
    } finally {
      setTogglingId(null);
    }
  };

  /* ---------- UI states ---------- */
    if (loading) {
    return (
      <div className="app">
        <h1 className="main_title">Tiny Tasks</h1>
        <p className="loading">{loadMsg}</p>
        <p className="loading_msg">
          If it’s your first visit, the backend may need a short warm-up.
        </p>

        {/* Optional: give them something to do */}
        <button
          className="loading_btn"
          type="button"
          onClick={loadTasks}
        >
          Retry
        </button>
      </div>
    );
  }
  return (
    <div className="app">
      <h1 className="main_title">Tiny Tasks</h1>

      {/* Show errors but keep UI visible */}
      {error ? <p className="error">{error}</p> : null}

      {/* Add task */}
      <form onSubmit={addTask} style={{ marginBottom: 12 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New task..."
        />
        <button disabled={saving}>{saving ? "Adding..." : "Add"}</button>
      </form>

      {/* List / empty state */}
      {tasks.length === 0 ? (
        <p>No tasks yet</p>
      ) : (
        <ul>
          {tasks.map((task) => {
            const id = task.id ?? task._id;

            return (
              <li
                key={id}
              >
                {editingId === id ? (
                  <>
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />

                    <button
                      type="button"
                      className="disabled"
                      disabled={updating}
                      onClick={() => updateTaskTitle(id)}
                    >
                      {updating ? "Saving..." : "Save"}
                    </button>

                    <button
                      type="button"
                      disabled={updating}
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      type="checkbox"
                      checked={!!task.completed}
                      disabled={togglingId === id}
                      onChange={() => toggleCompleted(task)}
                    />

                    <span
                      className={`task-title ${task.completed ? "completed" : ""}`}
                    >
                      {task.title}
                    </span>

                    <button type="button" onClick={() => startEdit(task)}>
                      Edit
                    </button>

                    <button
                      type="button"
                      className="secondary"
                      disabled={deletingId === id}
                      onClick={() => deleteTask(id)}
                    >
                      {deletingId === id ? "Deleting..." : "Delete"}
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default App;
