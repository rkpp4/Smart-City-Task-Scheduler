let currentUser = null;
const apiBase = "http://localhost:3000";

const WORKERS = [
  { name: "Rahul Sharma", phone: "+91 98765 43210" },
  { name: "Ankush Patel", phone: "+91 87654 32109" },
  { name: "Amit Kumar", phone: "+91 76543 21098" },
  { name: "Sai Reddy", phone: "+91 65432 10987" },
  { name: "Vikram Singh", phone: "+91 54321 09876" },
];

document.addEventListener("DOMContentLoaded", () => {
  // Auth Tabs
  document
    .getElementById("tab-login")
    .addEventListener("click", (e) => showAuthTab(e, "login-form"));
  document
    .getElementById("tab-register")
    .addEventListener("click", (e) => showAuthTab(e, "register-form"));

  // Auth Forms Submission
  document.getElementById("login-form").addEventListener("submit", handleLogin);
  document
    .getElementById("register-form")
    .addEventListener("submit", handleRegister);

  // Logout
  document.getElementById("logout-btn").addEventListener("click", logout);

  // Modals
  document.querySelectorAll(".close-modal").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const target = e.target.getAttribute("data-target");
      if (target) document.getElementById(target).classList.add("hidden");
    });
  });

  // Photo Upload
  document
    .getElementById("issue-photo-upload")
    .addEventListener("change", handlePhotoUpload);

  // Monitor Update Status Form
  document
    .getElementById("form-update-status")
    .addEventListener("submit", handleUpdateStatus);
  document
    .getElementById("form-submit-issue")
    .addEventListener("submit", handleCitizenSubmit);

  // Check existing session
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  if (token && userStr) {
    currentUser = JSON.parse(userStr);
    loadApp();
  }
});

function showAuthTab(e, formId) {
  document
    .querySelectorAll(".tabs button")
    .forEach((b) => b.classList.remove("active"));
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      currentUser = data.user;
      loadApp();
    } else alert(data.error);
  } catch (err) {
    alert("Login failed " + err.message);
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
  try {
    const res = await fetch(`${apiBase}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.error) alert(data.error);
    else {
      alert("Registration success, please login");
      document.getElementById("tab-login").click();
    }
  } catch (err) {
    alert("Register failed " + err.message);
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  currentUser = null;
  document.getElementById("app-layout").classList.add("hidden");
  document.getElementById("auth-section").classList.remove("hidden");
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + localStorage.getItem("token"),
  };
}

// ------ App Loading ------
function loadApp() {
  document.getElementById("auth-section").classList.add("hidden");
  document.getElementById("app-layout").classList.remove("hidden");

  document.getElementById("user-profile").textContent = currentUser.name;
  document.getElementById("user-role-badge").textContent =
    currentUser.role === "citizen" ? "Citizen" : "Monitor";

  buildSidebar();
  loadDashboardStats(); // Default load
}

function buildSidebar() {
  const nav = document.getElementById("sidebar-nav");
  nav.innerHTML = "";

  const links = [
    {
      id: "dashboard",
      icon: "fa-chart-pie",
      label: "Dashboard Overview",
      roles: ["citizen", "monitor"],
      handler: loadDashboardStats,
    },
    {
      id: "submit-issue",
      icon: "fa-plus-circle",
      label: "File a Report",
      roles: ["citizen"],
      handler: loadSubmitIssue,
    },
    {
      id: "my-issues",
      icon: "fa-folder-open",
      label: "My Tracking",
      roles: ["citizen"],
      handler: loadMyIssues,
    },
    {
      id: "all-issues",
      icon: "fa-satellite-dish",
      label: "Control Center",
      roles: ["monitor"],
      handler: loadAllIssues,
    },
  ];

  links.forEach((link) => {
    if (link.roles.includes(currentUser.role)) {
      const li = document.createElement("li");
      li.innerHTML = `<i class="fas ${link.icon}"></i> ${link.label}`;
      li.addEventListener("click", () => {
        document
          .querySelectorAll("#sidebar-nav li")
          .forEach((el) => el.classList.remove("active"));
        li.classList.add("active");
        hideAllViews();
        document.getElementById("page-title").textContent = link.label;
        link.handler();
      });
      nav.appendChild(li);
    }
  });

  if (nav.firstChild) nav.firstChild.classList.add("active");
}

function hideAllViews() {
  document
    .querySelectorAll(".view-container .view")
    .forEach((v) => v.classList.add("hidden"));
}

// ------ Citizen Views ------
let currentPhotoBase64 = null;

function handlePhotoUpload(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      currentPhotoBase64 = event.target.result;
      const preview = document.getElementById("issue-photo-preview");
      preview.src = currentPhotoBase64;
      preview.style.display = "block";
    };
    reader.readAsDataURL(file);
  }
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
  try {
    const res = await fetch(`${apiBase}/issues`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    if (res.status === 401) {
      alert("Session expired or invalid. Please log in again.");
      logout();
      return;
    }
    if (res.ok) {
      e.target.reset();
      document.getElementById("issue-photo-preview").style.display = "none";
      currentPhotoBase64 = null;
      document.querySelectorAll("#sidebar-nav li")[2].click(); // navigate to My issues
    } else alert("Error submitting");
  } catch (e) {
    console.error(e);
  }
}

async function loadMyIssues() {
  document.getElementById("view-my-issues").classList.remove("hidden");
  const tbody = document.getElementById("my-issues-tbody");
  tbody.innerHTML =
    '<tr><td colspan="5" style="text-align:center;">Loading...</td></tr>';

  try {
    const res = await fetch(`${apiBase}/my-issues`, { headers: authHeaders() });
    if (res.status === 401) {
      alert("Session expired or invalid. Please log in again.");
      logout();
      return;
    }
    const issues = await res.json();
    tbody.innerHTML = "";
    if (issues.length === 0)
      tbody.innerHTML =
        '<tr><td colspan="5" style="text-align:center; color: var(--text-muted);">No reports found.</td></tr>';

    issues.forEach((i) => {
      const stClass = i.status.replace(" ", "-");
      const photoBtn = i.photo
        ? `<button onclick="viewPhoto('${i.photo}')" class="btn-sm btn-photo"><i class="fas fa-camera"></i> Issue Photo</button>`
        : "";
      const resBtn = i.resolutionPhoto
        ? `<button onclick="viewPhoto('${i.resolutionPhoto}')" class="btn-sm btn-photo" style="background:#10b981"><i class="fas fa-check-circle"></i> Resolution Photo</button>`
        : "";

      let progressText = "Pending Monitor Review";
      if (i.assignedWorkerName) {
        progressText = `<b>Worker:</b> ${i.assignedWorkerName}<br><b>Contact:</b> ${i.assignedWorkerPhone}`;
      }

      tbody.innerHTML += `<tr>
                <td><b>${i.title}</b><br><span style="font-size:0.85em; color:var(--text-muted);">${i.description.substring(0, 40)}...</span><br>${photoBtn} ${resBtn}</td>
                <td>${i.category}</td><td>${i.location}</td>
                <td class="priority-badge priority-${i.priority}">${i.priority}</td>
                <td>
                    <span class="badge status-${stClass}">${i.status}</span>
                    <div style="margin-top:8px; font-size:0.85em; color:var(--text-muted)">${progressText}</div>
                </td>
            </tr>`;
    });
  } catch (e) {
    tbody.innerHTML = "Error loading";
  }
}

// ------ Monitor Views ------
async function loadAllIssues() {
  document.getElementById("view-all-issues").classList.remove("hidden");
  const tbody = document.getElementById("all-issues-tbody");
  tbody.innerHTML =
    '<tr><td colspan="7" style="text-align:center;">Loading...</td></tr>';
  try {
    const res = await fetch(`${apiBase}/issues`, { headers: authHeaders() });
    if (res.status === 401) {
      alert("Session expired or invalid. Please log in again.");
      logout();
      return;
    }
    const issues = await res.json();
    window.allIssuesCache = issues;
    tbody.innerHTML = "";
    if (issues.length === 0)
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align:center; color: var(--text-muted);">No active system reports.</td></tr>';

    issues.forEach((i) => {
      const stClass = i.status.replace(" ", "-");
      const citizenName = i.createdBy ? i.createdBy.name : "Unknown";
      const photoBtn = i.photo
        ? `<button onclick="viewPhoto('${i.photo}')" class="btn-sm btn-photo"><i class="fas fa-image"></i> Photo</button>`
        : "";

      let actions = "";

      // Replaced 'Approve/Assign' with direct Status Update Workflow
      actions += `<button onclick="openStatusModal('${i._id}', '${i.status}')" class="btn-sm btn-action hover-glow"><i class="fas fa-edit"></i> Update</button>`;

      tbody.innerHTML += `<tr>
                <td><b>${i.title}</b><br>${photoBtn}</td>
                <td>${citizenName}</td>
                <td>${i.category}</td>
                <td>${i.location}</td>
                <td class="priority-badge priority-${i.priority}">${i.priority}</td>
                <td><span class="badge status-${stClass}">${i.status}</span></td>
                <td>${actions}</td>
            </tr>`;
    });
  } catch (e) {
    tbody.innerHTML = "Error loading";
  }
}

function openStatusModal(id, currentStatus) {
  document.getElementById("update-issue-id").value = id;
  document.getElementById("update-status-select").value =
    currentStatus !== "Submitted" ? currentStatus : "Approved";
  document.getElementById("update-remark").value = "";

  const workerField = document.getElementById("update-worker-container");
  const photoField = document.getElementById("update-photo-container");

  // Create the worker dropdown if it doesn't exist yet
  if (workerField && workerField.querySelector("select").options.length <= 1) {
    const select = workerField.querySelector("select");
    WORKERS.forEach((w) => {
      select.innerHTML += `<option value="${w.name}|${w.phone}">${w.name} (${w.phone})</option>`;
    });
  }

  const checkStatus = () => {
    const s = document.getElementById("update-status-select").value;
    if (workerField)
      workerField.style.display =
        s === "In Progress" || s === "Assigned" ? "block" : "none";
    if (photoField)
      photoField.style.display = s === "Resolved" ? "block" : "none";
  };

  document.getElementById("update-status-select").onchange = checkStatus;
  checkStatus();

  document.getElementById("modal-update-status").classList.remove("hidden");
}

let currentResolutionBase64 = null;
document.addEventListener("DOMContentLoaded", () => {
  const resUpload = document.getElementById("resolution-photo-upload");
  if (resUpload) {
    resUpload.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          currentResolutionBase64 = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }
});

async function handleUpdateStatus(e) {
  e.preventDefault();
  const issueId = document.getElementById("update-issue-id").value;
  const status = document.getElementById("update-status-select").value;
  const remark = document.getElementById("update-remark").value;

  const payload = { status };

  if (status === "In Progress" || status === "Assigned") {
    const wVal = document.getElementById("update-worker-select").value;
    if (wVal) {
      const [wName, wPhone] = wVal.split("|");
      payload.assignedWorkerName = wName;
      payload.assignedWorkerPhone = wPhone;
    }
  }
  if (status === "Resolved" && currentResolutionBase64) {
    payload.resolutionPhoto = currentResolutionBase64;
  }

  try {
    const res = await fetch(`${apiBase}/issues/status/${issueId}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    if (res.status === 401) {
      alert("Session expired or invalid. Please log in again.");
      logout();
      return;
    }

    if (remark) {
      await fetch(`${apiBase}/issues/remarks/${issueId}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ remark }),
      });
    }

    document.getElementById("modal-update-status").classList.add("hidden");
    currentResolutionBase64 = null;
    loadAllIssues();
  } catch (e) {
    console.error(e);
  }
}

function viewPhoto(base64Str) {
  document.getElementById("modal-photo-img").src = base64Str;
  document.getElementById("modal-view-photo").classList.remove("hidden");
}

// ------ Dashboard Stats ------
async function loadDashboardStats() {
  document.getElementById("view-dashboard").classList.remove("hidden");
  document.getElementById("page-title").textContent = "Nexus Command Center";
  hideAllViews();
  document.getElementById("view-dashboard").classList.remove("hidden");

  const container = document.getElementById("analytics-cards");
  container.innerHTML =
    '<p style="color:var(--text-muted)">Loading system matrices...</p>';

  const icons = {
    total: { icon: "fa-globe", color: "rgba(79, 70, 229, 0.15)" },
    submitted: { icon: "fa-inbox", color: "rgba(100, 116, 139, 0.15)" },
    approved: { icon: "fa-thumbs-up", color: "rgba(59, 130, 246, 0.15)" },
    inProgress: {
      icon: "fa-spinner fa-spin",
      color: "rgba(245, 158, 11, 0.15)",
    },
    resolved: { icon: "fa-check-circle", color: "rgba(16, 185, 129, 0.15)" },
    closed: { icon: "fa-lock", color: "rgba(5, 150, 105, 0.15)" },
  };

  try {
    const res = await fetch(`${apiBase}/dashboard/stats`, {
      headers: authHeaders(),
    });
    if (res.status === 401) {
      alert("Session expired or invalid. Please log in again.");
      logout();
      return;
    }
    const stats = await res.json();

    // Remove 'assigned' since we removed employee feature. Filter it out mentally.
    delete stats.assigned;

    container.innerHTML = "";
    for (let key in stats) {
      const displayTitle = key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase());
      const displayIcon = icons[key]?.icon || "fa-chart-bar";
      const displayColor = icons[key]?.color || "rgba(99, 102, 241, 0.15)";

      container.innerHTML += `
            <div class="stat-card glass-panel" style="border-top: 3px solid ${displayColor};">
                <div class="stat-icon" style="background: ${displayColor}"><i class="fas ${displayIcon}" style="color: var(--primary);"></i></div>
                <div class="stat-info">
                    <h4>${displayTitle}</h4>
                    <p style="color: var(--text-main);">${stats[key]}</p>
                </div>
            </div>`;
    }
  } catch (e) {
    container.innerHTML = "Error loading stats";
  }
}
