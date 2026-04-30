import "./style.css";

type User = { id: string; name: string; email: string };
type Membership = { role: "ADMIN" | "MEMBER"; project: { id: string; name: string } };
type Task = { id: string; title: string; status: "TODO" | "IN_PROGRESS" | "DONE" };

// ✅ API BASE
const API_BASE =
  (import.meta.env.VITE_API_URL ||
    "https://team-task-manager-production-e1db.up.railway.app") + "/api";

const app = document.querySelector<HTMLDivElement>("#app")!;

let token = localStorage.getItem("token") || "";
let currentUser: User | null = null;

try {
  currentUser = JSON.parse(localStorage.getItem("user") || "null");
} catch {
  currentUser = null;
}

// ================= REQUEST =================
const request = async (path: string, options: RequestInit = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  let data: any = {};
  try {
    data = await res.json();
  } catch {}

  if (!res.ok) throw new Error(data?.message || "Request failed");
  return data;
};

// ================= AUTH =================
const renderAuth = () => {
  app.innerHTML = `
    <main class="wrap">
      <div class="card">
        <h1>Team Task Manager</h1>

        <form id="authForm">
          <input name="name" placeholder="Name (signup only)" />
          <input name="email" type="email" placeholder="Email" required />
          <input name="password" type="password" placeholder="Password" required />

          <select name="mode">
            <option value="login">Login</option>
            <option value="signup">Signup</option>
          </select>

          <button>Continue</button>
        </form>

        <p id="message" class="error"></p>
      </div>
    </main>
  `;

  const form = document.getElementById("authForm") as HTMLFormElement;
  const message = document.getElementById("message")!;

  form.onsubmit = async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const mode = String(fd.get("mode"));

    try {
      const data = await request(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({
          name: String(fd.get("name") || ""),
          email: String(fd.get("email")),
          password: String(fd.get("password")),
        }),
      });

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

// ================= APP =================
const renderApp = async () => {
  try {
    const [projects, dashboard] = await Promise.all([
      request("/projects"),
      request("/dashboard"),
    ]);

    const options = (projects as Membership[])
      .map((p) => `<option value="${p.project.id}">${p.project.name}</option>`)
      .join("");

    app.innerHTML = `
      <main class="wrap">

        <div class="header">
          <h1>Team Task Manager</h1>
          <button id="logoutBtn">Logout</button>
        </div>

        <p>Welcome <strong>${currentUser?.name}</strong></p>

        <div class="card">
          <h3>Dashboard</h3>
          <p>Total: ${dashboard.total}</p>
          <p>Todo: ${dashboard.TODO}</p>
          <p>In Progress: ${dashboard.IN_PROGRESS}</p>
          <p>Done: ${dashboard.DONE}</p>
          <p>Overdue: ${dashboard.overdue}</p>
        </div>

        <div class="grid">

          <div class="card">
            <h3>Create Project</h3>
            <form id="projectForm">
              <input name="name" placeholder="Project name" required />
              <button>Create Project</button>
            </form>
          </div>

          <div class="card">
            <h3>Create Task</h3>
            <form id="taskForm">
              <select name="projectId">${options}</select>
              <input name="title" placeholder="Task title" required />
              <button>Add Task</button>
            </form>
          </div>

        </div>

        <div class="card">
          <h3>Your Projects</h3>
          <ul>
            ${(projects as Membership[])
              .map((p) => `<li>${p.project.name}</li>`)
              .join("")}
          </ul>
        </div>

        <div class="card">
          <h3>Tasks</h3>
          <select id="projectSelect">${options}</select>
          <div id="taskList"></div>
        </div>

      </main>
    `;

    // logout
    document.getElementById("logoutBtn")!.onclick = () => {
      localStorage.clear();
      token = "";
      currentUser = null;
      renderAuth();
    };

    // create project
    const projectForm = document.getElementById("projectForm") as HTMLFormElement;
    projectForm.onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(projectForm);

      await request("/projects", {
        method: "POST",
        body: JSON.stringify({ name: String(fd.get("name")) }),
      });

      renderApp();
    };

    // create task
    const taskForm = document.getElementById("taskForm") as HTMLFormElement;
    taskForm.onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(taskForm);

      await request("/tasks", {
        method: "POST",
        body: JSON.stringify({
          projectId: String(fd.get("projectId")),
          title: String(fd.get("title")),
        }),
      });

      loadTasks(String(fd.get("projectId")));
    };

    // load tasks
    const projectSelect = document.getElementById("projectSelect") as HTMLSelectElement;
    projectSelect.onchange = () => loadTasks(projectSelect.value);

    if (projectSelect.value) loadTasks(projectSelect.value);

  } catch (err) {
    console.error(err);
    renderAuth();
  }
};

// ================= LOAD TASKS =================
const loadTasks = async (projectId: string) => {
  const tasks = (await request(`/tasks/project/${projectId}`)) as Task[];

  const list = document.getElementById("taskList")!;
  list.innerHTML = tasks
    .map(
      (t) => `
      <div class="task">
        <strong>${t.title}</strong>
        <span class="badge ${t.status.toLowerCase()}">${t.status}</span>
      </div>
    `
    )
    .join("");
};

// ================= START =================
if (token && currentUser) renderApp();
else renderAuth();