
import express from "express";
import jwt from "jsonwebtoken";
import pool from "./db.js";

const router = express.Router();

function requireAttendee(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: "Please log in first." });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);

        if (req.user.role !== "attendee") {
            return res.status(403).json({ error: "Attendee access required." });
        }

        next();
    } catch {
        res.status(401).json({ error: "Your session is invalid or expired." });
    }
}

// Create a 10-minute ticket hold.
router.post("/", requireAttendee, async (req, res) => {
    const ticketTypeId = req.body.ticket_type_id;
    const quantity = Number(req.body.quantity);

    if (!ticketTypeId || !Number.isInteger(quantity) ||
        quantity < 1 || quantity > 10) {
        return res.status(400).json({
            error: "Choose a valid ticket type and quantity (1–10)."
        });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Lock this ticket type while checking and reserving inventory.
        const ticketResult = await client.query(
            `SELECT t.*, e.status AS event_status, e.sales_cutoff,
                    e.event_date
             FROM public.ticket_types t
             JOIN public.events e ON e.id = t.event_id
             WHERE t.id = $1
             FOR UPDATE OF t`,
            [ticketTypeId]
        );

        if (!ticketResult.rowCount) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Ticket type not found." });
        }

        const ticket = ticketResult.rows[0];

        if (ticket.event_status !== "published" ||
            new Date(ticket.sales_cutoff) <= new Date() ||
            new Date(ticket.event_date) <= new Date()) {
            await client.query("ROLLBACK");
            return res.status(409).json({ error: "Ticket sales are closed." });
        }

        const activeHolds = await client.query(
            `SELECT COALESCE(SUM(quantity), 0)::int AS quantity
             FROM public.reservations
             WHERE ticket_type_id = $1
               AND status = 'pending'
               AND hold_expires_at > NOW()`,
            [ticketTypeId]
        );

        const confirmed = Number(ticket.quantity_sold);
        const held = Number(activeHolds.rows[0].quantity);
        const available = Number(ticket.quantity_total) - confirmed - held;

        if (quantity > available) {
            await client.query("ROLLBACK");
            return res.status(409).json({
                error: "Not enough tickets available.",
                available: Math.max(0, available)
            });
        }

        const hold = await client.query(
            `INSERT INTO public.reservations
             (attendee_id, ticket_type_id, quantity, status, hold_expires_at)
             VALUES ($1, $2, $3, 'pending', NOW() + INTERVAL '10 minutes')
             RETURNING id, ticket_type_id, quantity, status, hold_expires_at`,
            [req.user.sub, ticketTypeId, quantity]
        );

        await client.query("COMMIT");

        res.status(201).json({
            message: "Tickets held for 10 minutes.",
            reservation: hold.rows[0],
            total: Number(ticket.price) * quantity
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error(error.message);
        res.status(500).json({ error: "Could not reserve tickets." });
    } finally {
        client.release();
    }
});

// Mock payment: confirms the reservation before its hold expires.
router.post("/:id/pay", requireAttendee, async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const result = await client.query(
            `SELECT r.*, t.price
             FROM public.reservations r
             JOIN public.ticket_types t ON t.id = r.ticket_type_id
             WHERE r.id = $1 AND r.attendee_id = $2
             FOR UPDATE OF r`,
            [req.params.id, req.user.sub]
        );

        if (!result.rowCount) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Reservation not found." });
        }

        const reservation = result.rows[0];

        if (reservation.status !== "pending" ||
            new Date(reservation.hold_expires_at) <= new Date()) {
            await client.query(
                `UPDATE public.reservations
                 SET status = 'expired'
                 WHERE id = $1 AND status = 'pending'`,
                [reservation.id]
            );
            await client.query("COMMIT");
            return res.status(409).json({ error: "The ticket hold has expired." });
        }

        const amount = Number(reservation.price) * Number(reservation.quantity);

        // Demonstration-only mock payment; this is not a real payment gateway.
        await client.query(
            `UPDATE public.reservations
             SET status = 'confirmed'
             WHERE id = $1`,
            [reservation.id]
        );

        await client.query(
            `UPDATE public.ticket_types
             SET quantity_sold = quantity_sold + $1
             WHERE id = $2`,
            [reservation.quantity, reservation.ticket_type_id]
        );

        await client.query(
            `INSERT INTO public.payments
             (reservation_id, amount, status, payment_reference)
             VALUES ($1, $2, 'approved', $3)`,
            [reservation.id, amount, `MOCK-${reservation.id}`]
        );

        await client.query("COMMIT");

        res.json({
            message: "Mock payment approved. Booking confirmed.",
            reservation_id: reservation.id,
            amount
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error(error.message);
        res.status(500).json({ error: "Payment could not be processed." });
    } finally {
        client.release();
    }
});

export default router;
