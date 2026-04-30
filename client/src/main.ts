import "./style.css";

type User = { id: string; name: string; email: string };
type Membership = { role: "ADMIN" | "MEMBER"; project: { id: string; name: string } };

// ✅ API BASE FIX
const API_BASE =
  (import.meta.env.VITE_API_URL ||
    "https://team-task-manager-production-e1db.up.railway.app") + "/api";

const app = document.querySelector<HTMLDivElement>("#app")!;

let token = localStorage.getItem("token") || "";

// ✅ SAFE USER PARSE
let currentUser: User | null = null;
try {
  currentUser = JSON.parse(localStorage.getItem("user") || "null");
} catch {
  currentUser = null;
}

// ✅ SAFE REQUEST
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
      <h1>Team Task Manager</h1>
      <form id="authForm" class="card">
        <input name="name" placeholder="Name (signup only)" />
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Password" required />
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
    const projects = (await request("/projects")) as Membership[];

    app.innerHTML = `
      <main class="wrap">
        <h1>Team Task Manager</h1>
        <p>Welcome ${currentUser?.name}</p>

        <button id="logoutBtn">Logout</button>

        <h3>Your Projects</h3>
        <ul>
          ${projects.map((p) => `<li>${p.project.name}</li>`).join("")}
        </ul>
      </main>
    `;

    document.getElementById("logoutBtn")!.onclick = () => {
      localStorage.clear();
      token = "";
      currentUser = null;
      renderAuth();
    };
  } catch (err) {
    console.error(err);
    renderAuth();
  }
};

// ================= START =================
if (token && currentUser) renderApp();
else renderAuth();