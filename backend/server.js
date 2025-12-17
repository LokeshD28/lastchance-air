// backend/server.js

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

// ------------------ RESEND EMAIL SETUP ------------------
const { Resend } = require("resend");

// Render ENV vars you must set:
// RESEND_API_KEY
// EMAIL_FROM   (example: "LastChance Air <onboarding@resend.dev>")
// FRONTEND_BASE_URL (example: "https://lastchanceair.netlify.app")

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const EMAIL_FROM = process.env.EMAIL_FROM || "onboarding@resend.dev";
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || "http://localhost:3000";

async function sendEmail(to, subject, html) {
  if (!resend) {
    console.log("Resend not configured (missing RESEND_API_KEY)");
    return { ok: false };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html
    });

    if (error) {
      console.error("Resend error:", error);
      return { ok: false, error };
    }

    console.log("Email sent:", data?.id);
    return { ok: true, data };
  } catch (err) {
    console.error("Resend exception:", err);
    return { ok: false, error: err };
  }
}

async function sendBookingEmail(to, booking) {
  if (!to) return;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.5">
      <h2>Booking Confirmed ✈️</h2>
      <p>Your LastChance Air booking is confirmed.</p>
      <hr/>
      <p><strong>Reference:</strong> ${booking.bookingRef}</p>
      <p><strong>Passenger:</strong> ${booking.passengerName} ${
        booking.passengerAge ? `(Age: ${booking.passengerAge})` : ""
      }</p>
      <p><strong>Cabin:</strong> ${booking.cabinClass}</p>
      <p><strong>Seat:</strong> ${booking.seat || "N/A"}</p>
      <p><strong>Meal:</strong> ${booking.meal || "Standard"}</p>
      <p><strong>Drink:</strong> ${booking.drink || "Soft drink"}</p>
      <p><strong>Total Paid:</strong> $${Number(booking.totalPrice || 0).toFixed(2)}</p>
      <p><strong>Status:</strong> ${booking.status}</p>
      <hr/>
      <p>Thank you for using <b>LastChance Air</b>.</p>
    </div>
  `;

  await sendEmail(to, `Your LastChance Air booking ${booking.bookingRef}`, html);
}

// ------------------ MIDDLEWARE ------------------
app.use(cors());
app.use(express.json());

// Serve frontend static files (local dev only)
app.use(express.static(path.join(__dirname, "../frontend")));

// Home page -> frontend (local dev only)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Health check
app.get("/health", (req, res) => {
  res.send("LastChance Air backend is running ✅");
});

// ------------------ SQLITE DATABASE ------------------
const dbPath = path.join(__dirname, "database.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      flight_id TEXT NOT NULL,
      booking_ref TEXT NOT NULL,
      cabin_class TEXT NOT NULL,
      passenger_name TEXT NOT NULL,
      passenger_email TEXT NOT NULL,
      passenger_age INTEGER,
      total_price REAL NOT NULL,
      seat TEXT,
      meal TEXT,
      drink TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
});

// ------------------ MOCK FLIGHT DATA ------------------
const CITIES = [
  { city: "Los Angeles", code: "LAX" },
  { city: "San Francisco", code: "SFO" },
  { city: "Seattle", code: "SEA" },
  { city: "Denver", code: "DEN" },
  { city: "Dallas", code: "DFW" },
  { city: "Chicago", code: "ORD" },
  { city: "New York", code: "JFK" },
  { city: "Boston", code: "BOS" },
  { city: "Miami", code: "MIA" },
  { city: "Atlanta", code: "ATL" },
  { city: "Houston", code: "IAH" },
  { city: "Phoenix", code: "PHX" },
  { city: "Las Vegas", code: "LAS" },
  { city: "Orlando", code: "MCO" },
  { city: "Washington DC", code: "IAD" }
];

const AIRLINES = [
  "SkyWings",
  "AeroConnect",
  "CloudJet",
  "PacificAir",
  "Sunrise Airways",
  "MetroFly",
  "JetStream"
];

let FLIGHTS = [];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateFlights() {
  const flights = [];
  const today = new Date();
  let idCounter = 1;

  for (let dayOffset = 0; dayOffset <= 5; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    const dateStr = date.toISOString().slice(0, 10);

    CITIES.forEach((origin) => {
      CITIES.forEach((dest) => {
        if (origin.code === dest.code) return;

        const count = randomInt(4, 7);
        for (let i = 0; i < count; i++) {
          const depHour = randomInt(6, 23);
          const depMin = randomInt(0, 1) ? "00" : "30";
          const durationHours = randomInt(2, 6);
          const basePrice = randomInt(90, 480);

          let discountPercent = randomInt(10, 35);
          if (dayOffset <= 1) discountPercent += 10;

          flights.push({
            id: idCounter++,
            airline: AIRLINES[randomInt(0, AIRLINES.length - 1)],
            originCity: origin.city,
            originCode: origin.code,
            destinationCity: dest.city,
            destinationCode: dest.code,
            departureDate: dateStr,
            departureTime: `${depHour.toString().padStart(2, "0")}:${depMin}`,
            durationHours,
            basePrice,
            discountPercent,
            seatsAvailable: randomInt(5, 40)
          });
        }
      });
    });
  }

  FLIGHTS = flights;
  console.log("Generated flights:", FLIGHTS.length);
}

generateFlights();

function extractCode(value) {
  if (!value) return null;
  const m = value.match(/\(([A-Z0-9]{3})\)/i);
  if (m) return m[1].toUpperCase();
  if (value.length === 3) return value.toUpperCase();
  return value.slice(-3).toUpperCase();
}

function dealScore(flight) {
  const discount = flight.discountPercent || 0;
  const hoursUntil =
    (new Date(flight.departureDate).getTime() - Date.now()) / 36e5;
  const urgencyScore = Math.max(0, 48 - hoursUntil);
  return discount * 2 + urgencyScore;
}

// ------------------ AUTH ROUTES ------------------
app.post("/api/signup", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  const passwordHash = bcrypt.hashSync(password, 10);
  const createdAt = new Date().toISOString();

  db.run(
    "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)",
    [email, passwordHash, createdAt],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          return res.status(400).json({ error: "Email already registered" });
        }
        console.error("Signup DB error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ id: this.lastID, email });
    }
  );
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
    if (err) {
      console.error("Login DB error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (!row) return res.status(401).json({ error: "Invalid credentials" });

    const ok = bcrypt.compareSync(password, row.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    res.json({ id: row.id, email: row.email });
  });
});

// ✅ Password reset email (demo)
app.post("/api/request-password-reset", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  // demo token (in real life store it in DB)
  const resetToken = Math.random().toString(36).slice(2);
  const resetLink = `${FRONTEND_BASE_URL}/reset?token=${resetToken}`;

  await sendEmail(
    email,
    "Reset your LastChance Air password",
    `<p>Click below to reset your password:</p>
     <p><a href="${resetLink}">${resetLink}</a></p>
     <p><small>(Demo link – token not stored in DB)</small></p>`
  );

  res.json({
    success: true,
    message: "If the email exists, a reset link has been sent."
  });
});

// ------------------ FLIGHTS ROUTES ------------------
app.get("/api/cities", (req, res) => {
  res.json(CITIES);
});

app.get("/api/deals", (req, res) => {
  const now = new Date();
  const threeDays = new Date();
  threeDays.setDate(now.getDate() + 3);

  const list = FLIGHTS.filter((f) => {
    const d = new Date(f.departureDate);
    return d >= now && d <= threeDays;
  })
    .sort((a, b) => dealScore(b) - dealScore(a))
    .slice(0, 24);

  res.json(list);
});

app.get("/api/flights", (req, res) => {
  const { from, to, date } = req.query;

  const codeFrom = extractCode(from);
  const codeTo = extractCode(to);
  if (!codeFrom || !codeTo || !date)
    return res.status(400).json({ error: "Missing from/to/date" });

  const selected = new Date(date);
  const today = new Date();
  const diffDays = (selected - today) / (1000 * 60 * 60 * 24);

  if (diffDays > 5) return res.json([]);

  const list = FLIGHTS.filter((f) => {
    if (f.originCode !== codeFrom || f.destinationCode !== codeTo) return false;
    const fd = new Date(f.departureDate);
    const delta = Math.abs((fd - selected) / (1000 * 60 * 60 * 24));
    return delta <= 1.01;
  }).sort((a, b) => dealScore(b) - dealScore(a));

  res.json(list);
});

app.get("/api/flights/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const flight = FLIGHTS.find((f) => f.id === id);
  if (!flight) return res.status(404).json({ error: "Flight not found" });
  res.json(flight);
});

// ------------------ BOOKINGS ROUTES ------------------
function makeBookingRef() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

app.post("/api/bookings", (req, res) => {
  const {
    userId,
    flightId,
    cabinClass,
    passengerName,
    passengerEmail,
    passengerAge,
    totalPrice,
    seat,
    meal,
    drink
  } = req.body;

  if (!userId || !flightId || !cabinClass || !passengerName || !passengerEmail) {
    return res.status(400).json({ error: "Missing booking fields" });
  }

  const ref = makeBookingRef();
  const createdAt = new Date().toISOString();

  db.run(
    `
    INSERT INTO bookings
      (user_id, flight_id, booking_ref, cabin_class, passenger_name,
       passenger_email, passenger_age, total_price, seat, meal, drink, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      userId,
      String(flightId),
      ref,
      cabinClass,
      passengerName,
      passengerEmail,
      passengerAge || null,
      totalPrice || 0,
      seat || null,
      meal || null,
      drink || null,
      "confirmed",
      createdAt
    ],
    async function (err) {
      if (err) {
        console.error("DB booking error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      const bookingPayload = {
        id: this.lastID,
        bookingRef: ref,
        cabinClass,
        passengerName,
        passengerEmail,
        passengerAge: passengerAge || null,
        totalPrice: totalPrice || 0,
        seat: seat || null,
        meal: meal || "standard",
        drink: drink || "soft-drink",
        status: "confirmed",
        createdAt
      };

      console.log("Booking created:", bookingPayload);

      // ✅ send booking confirmation via Resend (does not block)
      sendBookingEmail(passengerEmail, bookingPayload).catch(console.error);

      res.json({
        success: true,
        booking: bookingPayload
      });
    }
  );
});

app.get("/api/bookings/user/:userId", (req, res) => {
  const userId = req.params.userId;

  db.all(
    "SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
    (err, rows) => {
      if (err) {
        console.error("Get bookings error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      const mapped = rows.map((r) => ({
        id: r.id,
        bookingRef: r.booking_ref,
        cabinClass: r.cabin_class,
        passengerName: r.passenger_name,
        passengerEmail: r.passenger_email,
        passengerAge: r.passenger_age,
        totalPrice: r.total_price,
        seat: r.seat,
        meal: r.meal,
        drink: r.drink,
        status: r.status,
        createdAt: r.created_at
      }));

      res.json(mapped);
    }
  );
});

app.post("/api/bookings/:id/cancel", (req, res) => {
  const id = req.params.id;

  db.run(
    "UPDATE bookings SET status = 'cancelled' WHERE id = ?",
    [id],
    function (err) {
      if (err) {
        console.error("Cancel booking error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Booking not found" });
      }
      res.json({ success: true });
    }
  );
});

// Fallback to frontend for browser refresh
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ------------------ START SERVER ------------------
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
  console.log("Resend enabled:", !!process.env.RESEND_API_KEY);
  console.log("EMAIL_FROM:", EMAIL_FROM);
  console.log("FRONTEND_BASE_URL:", FRONTEND_BASE_URL);
});