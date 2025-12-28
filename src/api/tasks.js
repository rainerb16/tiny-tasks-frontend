const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/tasks";

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `Request failed (${res.status})`);
  }

  return res.json();
}

export function getTasks() {
  return request(API_URL);
}

export function createTask(title) {
  return request(API_URL, {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export function updateTask(id, data) {
  return request(`${API_URL}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteTask(id) {
  return request(`${API_URL}/${id}`, {
    method: "DELETE",
  });
}
