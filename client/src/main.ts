import "./style.css";

type User = { id: string; name: string; email: string };
type Membership = { role: "ADMIN" | "MEMBER"; project: { id: string; name: string; description?: string } };
type Task = { id: string; title: string; status: "TODO" | "IN_PROGRESS" | "DONE"; dueDate?: string; assignee?: User };

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const app = document.querySelector<HTMLDivElement>("#app")!;
let token = localStorage.getItem("token") || "";
let currentUser: User | null = JSON.parse(localStorage.getItem("user") || "null");

const request = async (path: string, options: RequestInit = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

const renderAuth = () => {
  app.innerHTML = `
    <main class="wrap">
      <h1>Team Task Manager</h1>
      <p class="muted">Signup or login to manage team projects and tasks.</p>
      <form id="authForm" class="card">
        <input name="name" placeholder="Name (for signup)" />
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Password (min 6)" required />
        <select name="mode">
          <option value="login">Login</option>
          <option value="signup">Signup</option>
        </select>
        <button type="submit">Continue</button>
      </form>
      <p id="message" class="error"></p>
    </main>
  `;

  const form = document.getElementById("authForm") as HTMLFormElement;
  const message = document.getElementById("message")!;
  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const mode = String(fd.get("mode"));
    const payload = {
      name: String(fd.get("name") || ""),
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    };
    try {
      const data = await request(`/auth/${mode}`, { method: "POST", body: JSON.stringify(payload) });
      token = data.token;
      currentUser = data.user;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(currentUser));
      renderApp();
    } catch (err) {
      message.textContent = (err as Error).message;
    }
  };
};

const renderApp = async () => {
  const [projects, dashboard] = await Promise.all([request("/projects"), request("/dashboard")]);
  const projectOptions = (projects as Membership[])
    .map((p) => `<option value="${p.project.id}">${p.project.name} (${p.role})</option>`)
    .join("");

  app.innerHTML = `
    <main class="wrap">
      <header class="header">
        <h1>Team Task Manager</h1>
        <div>
          <span class="muted">${currentUser?.name} (${currentUser?.email})</span>
          <button id="logoutBtn">Logout</button>
        </div>
      </header>

      <section class="grid">
        <div class="card">
          <h3>Dashboard</h3>
          <p>Total: ${dashboard.total}</p>
          <p>Todo: ${dashboard.TODO} | In Progress: ${dashboard.IN_PROGRESS} | Done: ${dashboard.DONE}</p>
          <p class="danger">Overdue: ${dashboard.overdue}</p>
        </div>

        <form id="projectForm" class="card">
          <h3>Create Project</h3>
          <input name="name" placeholder="Project name" required />
          <input name="description" placeholder="Description" />
          <button type="submit">Create</button>
        </form>
      </section>

      <section class="grid">
        <form id="taskForm" class="card">
          <h3>Create Task</h3>
          <select name="projectId" required>${projectOptions}</select>
          <input name="title" placeholder="Task title" required />
          <input name="description" placeholder="Description" />
          <input name="dueDate" type="datetime-local" />
          <button type="submit">Add Task</button>
        </form>
        <div class="card">
          <h3>Tasks</h3>
          <select id="projectTasksSelect">${projectOptions}</select>
          <div id="taskList"></div>
        </div>
      </section>
      <p id="message" class="error"></p>
    </main>
  `;

  (document.getElementById("logoutBtn") as HTMLButtonElement).onclick = () => {
    token = "";
    currentUser = null;
    localStorage.clear();
    renderAuth();
  };

  const message = document.getElementById("message")!;
  const projectForm = document.getElementById("projectForm") as HTMLFormElement;
  projectForm.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(projectForm);
    try {
      await request("/projects", {
        method: "POST",
        body: JSON.stringify({ name: String(fd.get("name")), description: String(fd.get("description") || "") }),
      });
      renderApp();
    } catch (err) {
      message.textContent = (err as Error).message;
    }
  };

  const taskForm = document.getElementById("taskForm") as HTMLFormElement;
  taskForm.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(taskForm);
    const due = String(fd.get("dueDate") || "");
    try {
      await request("/tasks", {
        method: "POST",
        body: JSON.stringify({
          projectId: String(fd.get("projectId")),
          title: String(fd.get("title")),
          description: String(fd.get("description") || ""),
          dueDate: due ? new Date(due).toISOString() : undefined,
        }),
      });
      loadTasks(String(fd.get("projectId")));
    } catch (err) {
      message.textContent = (err as Error).message;
    }
  };

  const projectSelect = document.getElementById("projectTasksSelect") as HTMLSelectElement;
  projectSelect.onchange = () => loadTasks(projectSelect.value);
  if (projectSelect.value) loadTasks(projectSelect.value);
};

const loadTasks = async (projectId: string) => {
  const taskList = document.getElementById("taskList")!;
  const tasks = (await request(`/tasks/project/${projectId}`)) as Task[];
  taskList.innerHTML = tasks
    .map(
      (t) => `
      <div class="task">
        <strong>${t.title}</strong>
        <p>${t.status} ${t.dueDate ? `| Due: ${new Date(t.dueDate).toLocaleString()}` : ""}</p>
        <select data-task="${t.id}">
          <option ${t.status === "TODO" ? "selected" : ""} value="TODO">TODO</option>
          <option ${t.status === "IN_PROGRESS" ? "selected" : ""} value="IN_PROGRESS">IN PROGRESS</option>
          <option ${t.status === "DONE" ? "selected" : ""} value="DONE">DONE</option>
        </select>
      </div>`
    )
    .join("");

  taskList.querySelectorAll("select[data-task]").forEach((el) => {
    (el as HTMLSelectElement).onchange = async () => {
      const taskId = (el as HTMLSelectElement).dataset.task!;
      await request(`/tasks/${taskId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: (el as HTMLSelectElement).value }),
      });
      renderApp();
    };
  });
};

if (token && currentUser) renderApp().catch(renderAuth);
else renderAuth();
