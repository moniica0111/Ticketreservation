
import express from "express";
import bcrypt from "bcryptjs";
import pool from "./db.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
    try {
        const fullName = req.body.full_name?.trim();
        const email = req.body.email?.trim().toLowerCase();
        const password = req.body.password;

        if (!fullName || !email || typeof password !== "string") {
            return res.status(400).json({
                error: "Name, email, and password are required."
            });
        }

        if (fullName.length > 100 || password.length < 8 || password.length > 72) {
            return res.status(400).json({
                error: "Name must be at most 100 characters and password must contain 8–72 characters."
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
            return res.status(400).json({ error: "Enter a valid email address." });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const result = await pool.query(
            `INSERT INTO public.users (full_name, email, password_hash, role)
             VALUES ($1, $2, $3, 'attendee')
             RETURNING id, full_name, email, role, created_at`,
            [fullName, email, passwordHash]
        );

        return res.status(201).json({
            message: "Account created successfully. You can now log in.",
            user: result.rows[0]
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                error: "An account with this email already exists."
            });
        }

        console.error("Signup error:", error.message);
        return res.status(500).json({ error: "Unable to create account." });
    }
});

export default router;
