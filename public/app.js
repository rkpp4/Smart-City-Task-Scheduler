let currentUser = null;

const apiBase =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://smart-city-task-scheduler.onrender.com";

const WORKERS = [
  { name: "Rahul Sharma", phone: "+91 98765 43210" },
  { name: "Ankush Patel", phone: "+91 87654 32109" },
  { name: "Amit Kumar", phone: "+91 76543 21098" },
  { name: "Sai Reddy", phone: "+91 65432 10987" },
  { name: "Vikram Singh", phone: "+91 54321 09876" },
];

let currentPhotoBase64 = null;
let currentResolutionBase64 = null;

/* ================= INIT ================= */

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

  document.querySelectorAll(".close-modal").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const target = e.target.getAttribute("data-target");

      if (target) document.getElementById(target).classList.add("hidden");
    });
  });

  const token = localStorage.getItem("token");

  const userStr = localStorage.getItem("user");

  if (token && userStr) {
    currentUser = JSON.parse(userStr);

    loadApp();
  }
});

/* ================= AUTH ================= */

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

  const res = await fetch(`${apiBase}/login`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await res.json();

  if (!data.token) return alert(data.error);

  localStorage.setItem("token", data.token);

  localStorage.setItem("user", JSON.stringify(data.user));

  currentUser = data.user;

  loadApp();
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
    alert("Registration successful");

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

/* ================= APP LOAD ================= */

function loadApp() {
  document.getElementById("auth-section").classList.add("hidden");

  document.getElementById("app-layout").classList.remove("hidden");

  document.getElementById("user-profile").textContent = currentUser.name;

  document.getElementById("user-role-badge").textContent =
    currentUser.role === "citizen" ? "Citizen" : "Monitor";

  buildSidebar();

  loadDashboardStats();
}

/* ================= SIDEBAR ================= */

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

    li.innerHTML = link.label;

    li.onclick = () => {
      document
        .querySelectorAll("#sidebar-nav li")
        .forEach((el) => el.classList.remove("active"));

      li.classList.add("active");

      hideAllViews();

      document.getElementById("page-title").textContent = link.label;

      link.handler();
    };

    nav.appendChild(li);
  });
}

/* ================= VIEW SWITCH ================= */

function hideAllViews() {
  document
    .querySelectorAll(".view-container .view")
    .forEach((v) => v.classList.add("hidden"));
}

/* ================= PHOTO HANDLING ================= */

function handlePhotoUpload(e) {
  const file = e.target.files[0];

  const reader = new FileReader();

  reader.onload = (ev) => (currentPhotoBase64 = ev.target.result);

  reader.readAsDataURL(file);
}

function handleResolutionUpload(e) {
  const file = e.target.files[0];

  const reader = new FileReader();

  reader.onload = (ev) => (currentResolutionBase64 = ev.target.result);

  reader.readAsDataURL(file);
}

/* ================= ISSUE SUBMISSION ================= */

function loadSubmitIssue() {
  hideAllViews();

  document.getElementById("view-submit-issue").classList.remove("hidden");
}

async function handleCitizenSubmit(e) {
  e.preventDefault();

  const body = {
    title: issue - title.value,

    category: issue - category.value,

    location: issue - location.value,

    priority: issue - priority.value,

    description: issue - description.value,

    photo: currentPhotoBase64,
  };

  await fetch(`${apiBase}/issues`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  loadMyIssues();
}
