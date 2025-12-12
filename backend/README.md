✈️ LastChance Air – Last-Minute Flight Deals Platform

LastChance Air is a full-stack web application designed to showcase discounted last-minute flight deals.
Users can:
	•	Browse real-time and mock flight offers
	•	Search flights by origin, destination, and date
	•	View detailed flight information
	•	Book tickets with passenger details
	•	Complete a mock payment
	•	See all their bookings in a “My Bookings” dashboard
	•	Create an account using secure authentication (password hashing + SQLite)

This project was built as part of the IS 699 – Information Systems Project at California State University, Long Beach.



🚀 Features

🛫 Realistic Flight Search
	•	Search flights by city & date
	•	Auto-suggestions (autocomplete) for city inputs
	•	Intelligent fallback:
→ If no flights exist for the user’s query, the system generates dynamic mock flights

🎟️ Flight Booking Flow
	•	View flight details
	•	Enter passenger information
	•	Mock payment gateway
	•	Booking confirmation with unique reference ID
	•	Stored in SQLite

👤 User Accounts
	•	Sign up / Login
	•	Passwords stored using bcrypt hashed
	•	User session saved in browser localStorage

🗂️ My Bookings Dashboard
	•	Lists all confirmed bookings
	•	Shows passenger & flight details

💡 Frontend
	•	Pure HTML, CSS, JavaScript (no frameworks required)
	•	Responsive UI
	•	Clean modern airline-style design

🛠️ Backend
	•	Node.js + Express
	•	SQLite3 database
	•	REST API endpoints: /api/signup, /api/login, /api/bookings, etc.




  🌐 Hosting Overview

This project is deployed using:

Backend → Render
	•	Node.js server running Express
	•	SQLite database stored on Render’s disk
	•	Accessible via:
https://YOUR-BACKEND.onrender.com

Frontend → Netlify
	•	Static hosting for HTML/CSS/JS
	•	API calls routed to Render backend
	•	Accessible via:
https://YOUR-FRONTEND.netlify.app



🧠 Technologies Used

Frontend
	•	HTML5
	•	CSS3
	•	Vanilla JavaScript

Backend
	•	Node.js
	•	Express.js
	•	SQLite3
	•	bcryptjs
	•	CORS

Hosting
	•	Render (Web Service)
	•	Netlify (Static Site)
