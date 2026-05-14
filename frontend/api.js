const API_BASE_URL = "http://localhost:8000/api/tasks";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (res.status === 204) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.detail || "요청 실패"), { status: res.status });
  }
  return res.json();
}

export const api = {
  listTasks: (status) =>
    request(status ? `?status_filter=${status}` : ""),
  getTask: (id) => request(`/${id}`),
  createTask: (body) => request("", { method: "POST", body: JSON.stringify(body) }),
  updateTask: (id, body) => request(`/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteTask: (id) => request(`/${id}`, { method: "DELETE" }),
};
