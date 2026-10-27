
const API_BASE_URL = "https://ticketreservation-1ezt.onrender.com";

// Send requests to the backend
async function sendRequest(path, body) {
    let response;

    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
    } catch (error) {
        throw new Error(
            "Cannot connect to the server. Please try again in a moment."
        );
    }

    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error(
            `Server returned an invalid response (HTTP ${response.status}).`
        );
    }

    if (!response.ok) {
        throw new Error(
            data.error || `Request failed (HTTP ${response.status}).`
        );
    }

    return data;
}

// Display messages safely
function showMessage(element, message, isError = false) {
    if (!element) {
        alert(message);
        return;
    }

    element.textContent = message;
    element.style.color = isError ? "#dc2626" : "#15803d";
}

// SIGNUP
const signupForm = document.getElementById("signupForm");

if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const message = document.getElementById("signupMessage");
        const button = signupForm.querySelector(
            "button[type='submit']"
        );

        const full_name = document
            .getElementById("fullName").value.trim();

        const email = document
            .getElementById("email").value.trim().toLowerCase();

        const password = document
            .getElementById("password").value;

        const confirmPassword = document
            .getElementById("confirmPassword").value;

        if (!full_name || !email || !password || !confirmPassword) {
            showMessage(message, "Please fill in all fields.", true);
            return;
        }

        if (password !== confirmPassword) {
            showMessage(message, "Passwords do not match.", true);
            return;
        }

        if (password.length < 8 || password.length > 72) {
            showMessage(
                message,
                "Password must contain 8–72 characters.",
                true
            );
            return;
        }

        button.disabled = true;
        showMessage(message, "Creating your account...");

        try {
            const data = await sendRequest("/api/auth/signup", {
                full_name,
                email,
                password
            });

            showMessage(
                message,
                data.message || "Account created successfully!"
            );

            signupForm.reset();

            // Open login after successful registration
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1200);

        } catch (error) {
            showMessage(message, error.message, true);
            console.error("Signup error:", error);

        } finally {
            button.disabled = false;
        }
    });
}

// LOGIN
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const message = document.getElementById("loginMessage");
        const button = loginForm.querySelector(
            "button[type='submit']"
        );

        const email = document
            .getElementById("email").value.trim().toLowerCase();

        const password = document
            .getElementById("password").value;

        if (!email || !password) {
            showMessage(
                message,
                "Please enter your email and password.",
                true
            );
            return;
        }

        button.disabled = true;
        showMessage(message, "Signing in...");

        try {
            const data = await sendRequest("/api/auth/login", {
                email,
                password
            });

            sessionStorage.setItem("ticketToken", data.token);
            sessionStorage.setItem(
                "ticketUser",
                JSON.stringify(data.user)
            );

            showMessage(message, "Login successful! Opening website...");

            setTimeout(() => {
                window.location.href = "index.html";
            }, 500);

        } catch (error) {
            showMessage(message, error.message, true);
            console.error("Login error:", error);

        } finally {
            button.disabled = false;
        }
    });
}
