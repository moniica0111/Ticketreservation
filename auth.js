
const API_BASE_URL = "https://ticketreservation-1ezt.onrender.com";

const signupForm = document.getElementById("signupForm");

if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const fullName = document.getElementById("fullName").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword =
            document.getElementById("confirmPassword").value;
        const message = document.getElementById("signupMessage");
        const button = signupForm.querySelector("button[type='submit']");

        message.textContent = "";

        if (!fullName || !email) {
            message.textContent = "Please complete all required fields.";
            return;
        }

        if (password.length < 8) {
            message.textContent = "Password must contain at least 8 characters.";
            return;
        }

        if (password !== confirmPassword) {
            message.textContent = "Passwords do not match.";
            return;
        }

        button.disabled = true;
        button.textContent = "Creating account...";

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    full_name: fullName,
                    email,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Unable to create account.");
            }

            message.textContent =
                "Account created successfully. You can now log in.";

            signupForm.reset();
        } catch (error) {
            message.textContent =
                error.message === "Failed to fetch"
                    ? "Could not contact the server. The signup API may not be implemented yet."
                    : error.message;
        } finally {
            button.disabled = false;
            button.textContent = "Create Account";
        }
    });
}
