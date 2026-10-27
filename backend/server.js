
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db.js";
import eventsRouter from "./events.js";
import authRouter from "./auth.js";
import reservationsRouter from "./reservations.js";

dotenv.config();

const app = express();

app.use(cors({
    origin: [
        "https://ticket-reservation-six.vercel.app",
        "http://localhost:5500",
        "http://127.0.0.1:5500"
    ]
}));
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Ticket Reservation System API is Running!");
});

app.get("/api/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({ message: "Database connected", time: result.rows[0].now });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Database connection failed." });
    }
});

app.use("/api/events", eventsRouter);
app.use("/api/auth", authRouter);
app.use("/api/reservations", reservationsRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
