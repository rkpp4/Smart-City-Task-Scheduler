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
    { name: "Vikram Singh", phone: "+91 54321 09876" }
];


document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('tab-login')
        .addEventListener('click', e => showAuthTab(e, 'login-form'));

    document.getElementById('tab-register')
        .addEventListener('click', e => showAuthTab(e, 'register-form'));

    document.getElementById('login-form')
        .addEventListener('submit', handleLogin);

    document.getElementById('register-form')
        .addEventListener('submit', handleRegister);

    document.getElementById('logout-btn')
        .addEventListener('click', logout);

    document.querySelectorAll('.close-modal').forEach(btn => {

        btn.addEventListener('click', e => {

            const target =
                e.target.getAttribute('data-target');

            if (target)
                document
                    .getElementById(target)
                    .classList.add('hidden');

        });

    });

    document
        .getElementById('issue-photo-upload')
        .addEventListener('change', handlePhotoUpload);

    document
        .getElementById('form-update-status')
        .addEventListener('submit', handleUpdateStatus);

    document
        .getElementById('form-submit-issue')
        .addEventListener('submit', handleCitizenSubmit);


    const token = localStorage.getItem('token');

    const userStr = localStorage.getItem('user');

    if (token && userStr) {

        currentUser = JSON.parse(userStr);

        loadApp();

    }

});


function showAuthTab(e, formId) {

    document
        .querySelectorAll('.tabs button')
        .forEach(b => b.classList.remove('active'));

    e.target.classList.add('active');

    document.getElementById('login-form').style.display =
        formId === 'login-form' ? 'block' : 'none';

    document.getElementById('register-form').style.display =
        formId === 'register-form' ? 'block' : 'none';

}


async function handleLogin(e) {

    e.preventDefault();

    const email =
        document.getElementById('login-email').value;

    const password =
        document.getElementById('login-password').value;

    try {

        const res = await fetch(`${apiBase}/login`, {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({ email, password })

        });

        const data = await res.json();

        if (data.token) {

            localStorage.setItem('token', data.token);

            localStorage.setItem('user',
                JSON.stringify(data.user));

            currentUser = data.user;

            loadApp();

        }

        else alert(data.error);

    }

    catch (err) {

        alert('Login failed ' + err.message);

    }

}


async function handleRegister(e) {

    e.preventDefault();

    const body = {

        name:
            document.getElementById('reg-name').value,

        email:
            document.getElementById('reg-email').value,

        password:
            document.getElementById('reg-password').value,

        role:
            document.getElementById('reg-role').value

    };

    try {

        const res =
            await fetch(`${apiBase}/register`, {

                method: 'POST',

                headers:
                    { 'Content-Type': 'application/json' },

                body: JSON.stringify(body)

            });

        const data = await res.json();

        if (data.error)

            alert(data.error);

        else {

            alert('Registration success, please login');

            document.getElementById('tab-login').click();

        }

    }

    catch (err) {

        alert('Register failed ' + err.message);

    }

}


function logout() {

    localStorage.removeItem('token');

    localStorage.removeItem('user');

    currentUser = null;

    location.reload();

}


function authHeaders() {

    return {

        'Content-Type': 'application/json',

        'Authorization':
            'Bearer ' + localStorage.getItem('token')

    };

}


function loadApp() {

    document
        .getElementById('auth-section')
        .classList.add('hidden');

    document
        .getElementById('app-layout')
        .classList.remove('hidden');


    document
        .getElementById('user-profile')
        .textContent = currentUser.name;


    document
        .getElementById('user-role-badge')
        .textContent =
        currentUser.role === 'citizen'
            ? 'Citizen'
            : 'Monitor';


    buildSidebar();

    loadDashboardStats();

}


/* ======================
   CITIZEN ISSUE TRACKING
====================== */

async function loadMyIssues() {

    document
        .getElementById('view-my-issues')
        .classList.remove('hidden');

    const tbody =
        document.getElementById('my-issues-tbody');

    tbody.innerHTML = 'Loading...';


    const res =
        await fetch(`${apiBase}/my-issues`,
            { headers: authHeaders() });

    const issues = await res.json();


    tbody.innerHTML = '';


    issues.forEach(i => {

        const stClass =
            i.status.replace(" ", "-");


        const photoBtn = i.photo ?

            `<button onclick="viewPhoto('${i.photo}')"
             class="btn-sm btn-photo">
             Issue Photo
             </button>` : "";


        const resBtn = i.resolutionPhoto ?

            `<button onclick="viewPhoto('${i.resolutionPhoto}')"
             class="btn-sm btn-photo"
             style="background:#10b981">
             Resolution Photo
             </button>` : "";


        let progressText =
            "Pending Monitor Review";


        if (i.assignedWorkerName)

            progressText =
                `<b>Worker:</b>
                 ${i.assignedWorkerName}`;


        tbody.innerHTML += `

<tr>

<td>

<b>${i.title}</b><br>

${photoBtn}

${resBtn}

</td>

<td>${i.category}</td>

<td>${i.location}</td>

<td>${i.priority}</td>

<td>

<span class="badge status-${stClass}">
${i.status}
</span>

</td>

</tr>

`;

    });

}


/* ======================
   MONITOR CONTROL PANEL
====================== */

async function loadAllIssues() {

    document
        .getElementById('view-all-issues')
        .classList.remove('hidden');

    const tbody =
        document.getElementById('all-issues-tbody');


    const res =
        await fetch(`${apiBase}/issues`,
            { headers: authHeaders() });

    const issues =
        await res.json();


    tbody.innerHTML = "";


    issues.forEach(i => {

        const stClass =
            i.status.replace(" ", "-");


        const citizenName =
            i.createdBy
                ? i.createdBy.name
                : 'Unknown';


        const photoBtn =
            i.photo ?

            `<button onclick="viewPhoto('${i.photo}')"
             class="btn-sm btn-photo">
             Issue Photo
             </button>` : "";


        const resBtn =
            i.resolutionPhoto ?

            `<button onclick="viewPhoto('${i.resolutionPhoto}')"
             class="btn-sm btn-photo"
             style="background:#10b981">
             Resolution Photo
             </button>` : "";


        tbody.innerHTML += `

<tr>

<td>

<b>${i.title}</b><br>

${photoBtn}

${resBtn}

</td>

<td>${citizenName}</td>

<td>${i.category}</td>

<td>${i.location}</td>

<td>${i.priority}</td>

<td>

<span class="badge status-${stClass}">
${i.status}
</span>

</td>

<td>

<button
onclick="openStatusModal('${i._id}',
'${i.status}')">

Update

</button>

</td>

</tr>

`;

    });

}


/* ======================
   STATUS UPDATE HANDLER
====================== */

async function handleUpdateStatus(e) {

    e.preventDefault();

    const issueId =
        document.getElementById('update-issue-id').value;

    const status =
        document.getElementById('update-status-select').value;

    const remark =
        document.getElementById('update-remark').value;


    const payload = { status };


    if (currentResolutionBase64)

        payload.resolutionPhoto =
            currentResolutionBase64;


    await fetch(
        `${apiBase}/issues/status/${issueId}`,

        {

            method: 'PUT',

            headers: authHeaders(),

            body: JSON.stringify(payload)

        }

    );


    if (remark)

        await fetch(
            `${apiBase}/issues/remarks/${issueId}`,

            {

                method: 'PUT',

                headers: authHeaders(),

                body: JSON.stringify({ remark })

            }

        );


    document
        .getElementById('modal-update-status')
        .classList.add('hidden');


    currentResolutionBase64 = null;


    loadAllIssues();

    loadMyIssues();

    loadDashboardStats();

}


/* ======================
   PHOTO VIEWER
====================== */

function viewPhoto(base64Str) {

    document
        .getElementById('modal-photo-img')
        .src = base64Str;


    document
        .getElementById('modal-view-photo')
        .classList.remove('hidden');

}