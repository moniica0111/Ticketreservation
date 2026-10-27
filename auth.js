
const API_BASE_URL = "https://ticketreservation-1ezt.onrender.com";

async function sendRequest(path, body) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Request failed.");
    }

    return data;
}

const signupForm = document.getElementById("signupForm");

if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const message = document.getElementById("signupMessage");
        const button = signupForm.querySelector("button[type='submit']");
        const full_name = document.getElementById("fullName").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (password !== confirmPassword) {
            message.textContent = "Passwords do not match.";
            return;
        }

        button.disabled = true;
        message.textContent = "Creating account...";

        try {
            const data = await sendRequest("/api/auth/signup", {
                full_name, email, password
            });

            message.textContent = data.message;
            signupForm.reset();
        } catch (error) {
            message.textContent = error.message;
        } finally {
            button.disabled = false;
        }
    });
}

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const message = document.getElementById("loginMessage");
        const button = loginForm.querySelector("button[type='submit']");
        button.disabled = true;
        message.textContent = "Signing in...";

        try {
            const data = await sendRequest("/api/auth/login", {
                email: document.getElementById("email").value.trim(),
                password: document.getElementById("password").value
            });

            // For a real deployment, prefer a secure HttpOnly cookie.
            // This is a basic project demo using sessionStorage.
            sessionStorage.setItem("ticketToken", data.token);
            sessionStorage.setItem("ticketUser", JSON.stringify(data.user));

            message.textContent = "Login successful. Opening events...";
            window.location.href = "index.html";
        } catch (error) {
            message.textContent = error.message;
        } finally {
            button.disabled = false;
        }
    });
}
