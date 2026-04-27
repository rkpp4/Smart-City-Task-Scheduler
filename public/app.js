let currentUser = null;
const apiBase = "http://localhost:3000";

let currentPhotoBase64 = null;
let currentResolutionBase64 = null;

const WORKERS = [
  { name: "Rahul Sharma", phone: "+91 98765 43210" },
  { name: "Ankush Patel", phone: "+91 87654 32109" },
  { name: "Amit Kumar", phone: "+91 76543 21098" },
  { name: "Sai Reddy", phone: "+91 65432 10987" },
  { name: "Vikram Singh", phone: "+91 54321 09876" },
];

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("tab-login")
    .addEventListener("click", (e) => showAuthTab(e, "login-form"));

  document
    .getElementById("tab-register")
    .addEventListener("click", (e) => showAuthTab(e, "register-form"));

  document.getElementById("login-form").addEventListener("submit", handleLogin);

  document
    .getElementById("register-form")
    .addEventListener("submit", handleRegister);

  document.getElementById("logout-btn").addEventListener("click", logout);

  document
    .getElementById("issue-photo-upload")
    .addEventListener("change", handlePhotoUpload);

  document
    .getElementById("resolution-photo-upload")
    ?.addEventListener("change", handleResolutionUpload);

  document
    .getElementById("form-update-status")
    .addEventListener("submit", handleUpdateStatus);

  document
    .getElementById("form-submit-issue")
    .addEventListener("submit", handleCitizenSubmit);

  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (token && user) {
    currentUser = JSON.parse(user);
    loadApp();
  }
});

function showAuthTab(e, formId) {
  document
    .querySelectorAll(".tabs button")
    .forEach((btn) => btn.classList.remove("active"));

  e.target.classList.add("active");

  document.getElementById("login-form").style.display =
    formId === "login-form" ? "block" : "none";

  document.getElementById("register-form").style.display =
    formId === "register-form" ? "block" : "none";
}

async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById("login-email").value;

  const password = document.getElementById("login-password").value;

  try {
    const res = await fetch(`${apiBase}/login`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!data.token) return alert(data.error);

    localStorage.setItem("token", data.token);

    localStorage.setItem("user", JSON.stringify(data.user));

    currentUser = data.user;

    loadApp();
  } catch (err) {
    alert("Login failed");
  }
}

async function handleRegister(e) {
  e.preventDefault();

  const body = {
    name: document.getElementById("reg-name").value,

    email: document.getElementById("reg-email").value,

    password: document.getElementById("reg-password").value,

    role: document.getElementById("reg-role").value,
  };

  const res = await fetch(`${apiBase}/register`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (data.error) alert(data.error);
  else {
    alert("Registered successfully");

    document.getElementById("tab-login").click();
  }
}

function logout() {
  localStorage.clear();

  location.reload();
}

function authHeaders() {
  return {
    "Content-Type": "application/json",

    Authorization: "Bearer " + localStorage.getItem("token"),
  };
}

function loadApp() {
  document.getElementById("auth-section").classList.add("hidden");

  document.getElementById("app-layout").classList.remove("hidden");

  document.getElementById("user-profile").textContent = currentUser.name;

  document.getElementById("user-role-badge").textContent =
    currentUser.role === "citizen" ? "Citizen" : "Monitor";

  buildSidebar();

  loadDashboardStats();
}

function buildSidebar() {
  const nav = document.getElementById("sidebar-nav");

  nav.innerHTML = "";

  const links = [
    {
      label: "Dashboard Overview",
      roles: ["citizen", "monitor"],
      handler: loadDashboardStats,
    },

    {
      label: "File a Report",
      roles: ["citizen"],
      handler: loadSubmitIssue,
    },

    {
      label: "My Tracking",
      roles: ["citizen"],
      handler: loadMyIssues,
    },

    {
      label: "Control Center",
      roles: ["monitor"],
      handler: loadAllIssues,
    },
  ];

  links.forEach((link) => {
    if (!link.roles.includes(currentUser.role)) return;

    const li = document.createElement("li");

    li.textContent = link.label;

    li.onclick = () => {
      hideAllViews();

      document.getElementById("page-title").textContent = link.label;

      link.handler();
    };

    nav.appendChild(li);
  });
}

function hideAllViews() {
  document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
}

function handlePhotoUpload(e) {
  const file = e.target.files[0];

  const reader = new FileReader();

  reader.onload = (event) => (currentPhotoBase64 = event.target.result);

  reader.readAsDataURL(file);
}

function handleResolutionUpload(e) {
  const file = e.target.files[0];

  const reader = new FileReader();

  reader.onload = (event) => (currentResolutionBase64 = event.target.result);

  reader.readAsDataURL(file);
}

function loadSubmitIssue() {
  document.getElementById("view-submit-issue").classList.remove("hidden");
}

async function handleCitizenSubmit(e) {
  e.preventDefault();

  const body = {
    title: document.getElementById("issue-title").value,

    category: document.getElementById("issue-category").value,

    location: document.getElementById("issue-location").value,

    priority: document.getElementById("issue-priority").value,

    description: document.getElementById("issue-description").value,

    photo: currentPhotoBase64,
  };

  const res = await fetch(`${apiBase}/issues`, {
    method: "POST",

    headers: authHeaders(),

    body: JSON.stringify(body),
  });

  if (!res.ok) return alert("Submit failed");

  currentPhotoBase64 = null;

  loadMyIssues();
}

async function loadMyIssues() {
  document.getElementById("view-my-issues").classList.remove("hidden");

  const res = await fetch(`${apiBase}/my-issues`, {
    headers: authHeaders(),
  });

  const issues = await res.json();

  const tbody = document.getElementById("my-issues-tbody");

  tbody.innerHTML = "";

  issues.forEach((i) => {
    tbody.innerHTML += `

<tr>

<td>${i.title}</td>

<td>${i.category}</td>

<td>${i.location}</td>

<td>${i.status}</td>

<td>

${
  i.resolutionPhoto
    ? `<button onclick="viewPhoto('${i.resolutionPhoto}')">Resolution</button>`
    : ""
}

</td>

</tr>

`;
  });
}

async function loadAllIssues() {
  document.getElementById("view-all-issues").classList.remove("hidden");

  const res = await fetch(`${apiBase}/issues`, {
    headers: authHeaders(),
  });

  const issues = await res.json();

  const tbody = document.getElementById("all-issues-tbody");

  tbody.innerHTML = "";

  issues.forEach((i) => {
    tbody.innerHTML += `

<tr>

<td>${i.title}</td>

<td>${i.category}</td>

<td>${i.location}</td>

<td>${i.status}</td>

<td>

<button onclick="openStatusModal('${i._id}')">

Update

</button>

</td>

</tr>

`;
  });
}

function openStatusModal(id) {
  document.getElementById("update-issue-id").value = id;

  document.getElementById("modal-update-status").classList.remove("hidden");
}

async function handleUpdateStatus(e) {
  e.preventDefault();

  const issueId = document.getElementById("update-issue-id").value;

  const status = document.getElementById("update-status-select").value;

  const payload = { status };

  if (status === "Resolved") payload.resolutionPhoto = currentResolutionBase64;

  await fetch(
    `${apiBase}/issues/status/${issueId}`,

    {
      method: "PUT",

      headers: authHeaders(),

      body: JSON.stringify(payload),
    },
  );

  currentResolutionBase64 = null;

  loadAllIssues();

  loadMyIssues();

  loadDashboardStats();
}

function viewPhoto(base64) {
  document.getElementById("modal-photo-img").src = base64;

  document.getElementById("modal-view-photo").classList.remove("hidden");
}

async function loadDashboardStats() {
  hideAllViews();

  document.getElementById("view-dashboard").classList.remove("hidden");

  const res = await fetch(`${apiBase}/dashboard/stats`, {
    headers: authHeaders(),
  });

  const stats = await res.json();

  document.getElementById("analytics-cards").innerHTML = Object.entries(stats)
    .map(([k, v]) => `<div>${k}: ${v}</div>`)

    .join("");
}
