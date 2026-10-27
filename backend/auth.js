
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "./db.js";

const router = express.Router();

function createToken(user) {
    return jwt.sign(
        { sub: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
    );
}

router.post("/signup", async (req, res) => {
    try {
        const { full_name, email, password } = req.body;

        if (
            typeof full_name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({ error: "All fields are required." });
        }

        const name = full_name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (!name || name.length > 100) {
            return res.status(400).json({ error: "Enter a valid name." });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return res.status(400).json({ error: "Enter a valid email." });
        }

        if (password.length < 8 || password.length > 72) {
            return res.status(400).json({
                error: "Password must contain 8–72 characters."
            });
        }

        const hash = await bcrypt.hash(password, 12);

        const result = await pool.query(
            `INSERT INTO public.users
             (full_name, email, password_hash, role)
             VALUES ($1, $2, $3, 'attendee')
             RETURNING id, full_name, email, role`,
            [name, normalizedEmail, hash]
        );

        res.status(201).json({
            message: "Account created. You can now log in.",
            user: result.rows[0]
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                error: "This email is already registered."
            });
        }

        console.error("SIGNUP ERROR:", error);

res.status(500).json({
    error: "Registration failed.",
    details: error.message,
    code: error.code
});
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (typeof email !== "string" || typeof password !== "string") {
            return res.status(400).json({ error: "Email and password are required." });
        }

        const result = await pool.query(
            `SELECT id, full_name, email, password_hash, role
             FROM public.users WHERE email = $1`,
            [email.trim().toLowerCase()]
        );

        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const token = createToken(user);

        res.json({
            message: "Login successful.",
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Login failed." });
    }
});

export default router;
