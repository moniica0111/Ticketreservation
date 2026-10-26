
import express from "express";
import pool from "./db.js";

const router = express.Router();

// Get published events
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, 
             json_agg(
               json_build_object(
                 'id', t.id,
                 'name', t.name,
                 'price', t.price,
                 'quantity_total', t.quantity_total
               )
             ) AS ticket_types
      FROM events e
      LEFT JOIN ticket_types t ON t.event_id = e.id
      WHERE e.status = 'published'
      GROUP BY e.id
      ORDER BY e.event_date
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to fetch events" });
  }
});

// Create an event
router.post("/", async (req, res) => {
  const {
    organizer_id,
    title,
    description,
    venue,
    event_date,
    sales_cutoff
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO events
       (organizer_id, title, description, venue, event_date, sales_cutoff)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        organizer_id,
        title,
        description,
        venue,
        event_date,
        sales_cutoff
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to create event" });
  }
});

export default router;
