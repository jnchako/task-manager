
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const reloadButton = document.getElementById("reloadButton");

const API_URL = "https://mia1te0nv5.execute-api.us-east-2.amazonaws.com";


const COGNITO_DOMAIN =
    "https://us-east-2ngnekevyf.auth.us-east-2.amazoncognito.com";

const CLIENT_ID = "5ipc21is90ci2ti6d5m34ir82p";

const REDIRECT_URI =
    "https://staging.d2kvj1fl4cbuz8.amplifyapp.com/";

const loginButton = document.getElementById("loginButton");
const logoutButton = document.getElementById("logoutButton");
const welcomeMessage = document.getElementById("welcomeMessage");

// Generate a random PKCE verifier
function generateVerifier() {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);

    return Array.from(bytes, byte =>
        byte.toString(16).padStart(2, "0")
    ).join("");
}

// Convert bytes to Base64URL
function base64url(bytes) {
    return btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

// Generate PKCE challenge
async function generateChallenge(verifier) {
    const encoded = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest("SHA-256", encoded);

    return base64url(new Uint8Array(digest));
}

// Redirect user to Cognito
loginButton.addEventListener("click", async () => {
    console.log("Login button clicked!");
    const verifier = generateVerifier();
    const challenge = await generateChallenge(verifier);

    const state = generateVerifier();

    sessionStorage.setItem("pkce_verifier", verifier);
    sessionStorage.setItem("oauth_state", state);

    const params = new URLSearchParams({
        response_type: "code",
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: "openid email profile",
        code_challenge_method: "S256",
        code_challenge: challenge,
        state: state
    });

    window.location.href =
        `${COGNITO_DOMAIN}/oauth2/authorize?${params}`;
});

// Exchange authorization code for tokens
async function handleLoginCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) return;

    const returnedState = params.get("state");
    const savedState = sessionStorage.getItem("oauth_state");
    const verifier = sessionStorage.getItem("pkce_verifier");

    if (!savedState || returnedState !== savedState || !verifier) {
        throw new Error("Invalid login state.");
    }

    // Prevent reuse of the same authorization state
    sessionStorage.removeItem("oauth_state");
    sessionStorage.removeItem("pkce_verifier");

    const response = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            client_id: CLIENT_ID,
            code: code,
            redirect_uri: REDIRECT_URI,
            code_verifier: verifier
        })
    });

    if (!response.ok) {
        throw new Error("Login token exchange failed.");
    }

    const tokens = await response.json();

    sessionStorage.setItem("access_token", tokens.access_token);
    sessionStorage.setItem("id_token", tokens.id_token);

    window.history.replaceState({}, "", REDIRECT_URI);

    showLoggedInUser();
}

// Decode JWT claims for display only
function decodeJwt(token) {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalized));
}

// Update login interface
function showLoggedInUser() {
    const idToken = sessionStorage.getItem("id_token");

    if (!idToken) {
        loginButton.hidden = false;
        logoutButton.hidden = true;
        welcomeMessage.textContent = "";
        return;
    }

    const claims = decodeJwt(idToken);

    const username =
        claims.name ||
        claims.email ||
        claims["cognito:username"] ||
        "User";

    welcomeMessage.textContent = `Hello, ${username}!`;

    loginButton.hidden = true;
    logoutButton.hidden = false;
}

// Logout
logoutButton.addEventListener("click", () => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("id_token");

    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        logout_uri: REDIRECT_URI
    });

    window.location.href =
        `${COGNITO_DOMAIN}/logout?${params}`;
});

// Process login callback when page opens
handleLoginCallback()
    .then(() => {
        showLoggedInUser();
        return loadTasks();
    })
    .catch(error => {
        console.error("Authentication error:", error);
        alert("Login failed. Please try again.");
    });


// Load tasks from server
async function loadTasks() {
    try {
        const accessToken = sessionStorage.getItem("access_token");

        if (!accessToken) {
            taskList.replaceChildren();
            return;
        }

        const response = await fetch(`${API_URL}/tasks`, {
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to load tasks.");
        }

        const data = await response.json();

        taskList.replaceChildren();

        data.tasks.forEach(function (task) {
            const taskElement = document.createElement("div");

            taskElement.classList.add("task");

            // Safely display task as text, not HTML
            taskElement.textContent = task;

            taskList.appendChild(taskElement);
        });

    } catch (error) {
        console.error("Error loading tasks:", error);
        alert("Unable to load tasks. Please try again.");
    }
}

// Add a task to server
taskForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    // Remove unnecessary surrounding whitespace
    const task = taskInput.value.trim();

    // Validate empty input
    if (task.length === 0) {
        alert("Please enter a task.");
        return;
    }

    // Validate maximum length
    if (task.length > 200) {
        alert("Task must be 200 characters or fewer.");
        return;
    }

    try {
        const accessToken = sessionStorage.getItem("access_token");

        if (!accessToken) {
            alert("Please log in before adding tasks.");
            return;
        }

        const response = await fetch(`${API_URL}/tasks`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                task: task
            })
        });

        if (!response.ok) {
            throw new Error("Failed to save task.");
        }

        taskInput.value = "";

        await loadTasks();

    } catch (error) {
        console.error("Error adding task:", error);
        alert("Unable to save task. Please try again.");
    }
});


// Reload tasks
reloadButton.addEventListener("click", function () {
    loadTasks();
});

// Load tasks when page opens
loadTasks();
