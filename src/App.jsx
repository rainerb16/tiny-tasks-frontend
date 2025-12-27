import { useEffect, useState } from "react";

// Backend endpoint
const API_URL = "http://localhost:3000/tasks";

function App() {
  /* ---------- State ---------- */
  const [tasks, setTasks] = useState([]); // Task list
  const [title, setTitle] = useState(""); // Add input value

  const [loading, setLoading] = useState(true); // Initial fetch
  const [saving, setSaving] = useState(false); // POST state
  const [updating, setUpdating] = useState(false); // PATCH state
  const [deletingId, setDeletingId] = useState(null); // Per-item DELETE

  const [editingId, setEditingId] = useState(null); // Which task is being edited
  const [editTitle, setEditTitle] = useState(""); // Edit input value

  const [error, setError] = useState(""); // User-facing errors

  /* ---------- Read ---------- */
  const loadTasks = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(API_URL);
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Load failed (${res.status})`);
      }
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  // Fetch once on mount
  useEffect(() => {
    loadTasks();
  }, []);

  /* ---------- Create ---------- */
  const addTask = async (e) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    setSaving(true);
    setError("");

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Create failed (${res.status})`);
      }

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
    setDeletingId(id);
    setError("");

    const prev = tasks;
    setTasks(prev.filter((t) => (t.id ?? t._id) !== id));

    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Delete failed (${res.status})`);
      }
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

  /* ---------- Update (PATCH) ---------- */
  const updateTask = async (id) => {
    const trimmed = editTitle.trim();
    if (!trimmed) return;

    setUpdating(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Update failed (${res.status})`);
      }

      await loadTasks();
      cancelEdit();
    } catch (err) {
      setError(err?.message || "Failed to update task");
    } finally {
      setUpdating(false);
    }
  };

  /* ---------- UI states ---------- */
  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: 16 }}>
      <h1>Tiny Tasks</h1>

      {/* Show errors but keep UI visible for debugging */}
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

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
                style={{ display: "flex", gap: 8, alignItems: "center" }}
              >
                {editingId === id ? (
                  <>
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />

                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => updateTask(id)}
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
                    <span>{task.title}</span>

                    <button type="button" onClick={() => startEdit(task)}>
                      Edit
                    </button>

                    <button
                      type="button"
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
