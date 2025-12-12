// frontend/app.js

const API_BASE = "http://localhost:4000"; // change to Render URL when hosting

// ----- DOM ELEMENTS -----
const authView = document.getElementById("authView");
const appView = document.getElementById("appView");
const appNav = document.getElementById("appNav");

const authTabs = document.querySelectorAll(".auth-tab");
const authPanels = document.querySelectorAll(".auth-panel");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const resetForm = document.getElementById("resetForm");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const signupEmail = document.getElementById("signupEmail");
const signupPassword = document.getElementById("signupPassword");
const resetEmail = document.getElementById("resetEmail");

const loginError = document.getElementById("loginError");
const signupError = document.getElementById("signupError");
const resetMsg = document.getElementById("resetMsg");

const searchView = document.getElementById("searchView");
const bookingsView = document.getElementById("bookingsView");
const bookingView = document.getElementById("bookingView");
const confirmationView = document.getElementById("confirmationView");

const searchForm = document.getElementById("searchForm");
const fromInput = document.getElementById("fromInput");
const toInput = document.getElementById("toInput");
const dateInput = document.getElementById("dateInput");
const cabinClassSelect = document.getElementById("cabinClassSelect");
const cityOptions = document.getElementById("cityOptions");
const dealsList = document.getElementById("dealsList");
const resultsList = document.getElementById("resultsList");

const bookingsList = document.getElementById("bookingsList");
const logoutBtn = document.getElementById("logoutBtn");
const navButtons = document.querySelectorAll(".nav-btn[data-view]");

const backToSearchBtn = document.getElementById("backToSearch");
const selectedFlightSummary = document.getElementById("selectedFlightSummary");
const seatMapEl = document.getElementById("seatMap");
const bookingForm = document.getElementById("bookingForm");
const passengerNameInput = document.getElementById("passengerName");
const passengerEmailInput = document.getElementById("passengerEmail");
const passengerAgeInput = document.getElementById("passengerAge");
const mealSelect = document.getElementById("mealSelect");
const drinkSelect = document.getElementById("drinkSelect");
const priceDisplay = document.getElementById("priceDisplay");
const bookingMsg = document.getElementById("bookingMsg");

const confirmMessage = document.getElementById("confirmMessage");
const confirmDetails = document.getElementById("confirmDetails");
const confirmBackHome = document.getElementById("confirmBackHome");

// ----- STATE -----
let currentUser = null;
let selectedFlight = null;
let selectedSeat = null;
let currentBookings = [];

// ----- UTILS -----
const money = (v) => `$${v.toFixed(2)}`;

function setMinDate() {
  const today = new Date().toISOString().slice(0, 10);
  dateInput.min = today;
}

// ----- AUTH TABS -----
authTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    authTabs.forEach((t) => t.classList.remove("active"));
    authPanels.forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    const type = tab.getAttribute("data-auth"); // login / signup / reset
    document
      .getElementById("auth" + type.charAt(0).toUpperCase() + type.slice(1))
      .classList.add("active");
  });
});

// ----- AUTH -----
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  signupError.textContent = "";
  try {
    const resp = await fetch(`${API_BASE}/api/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: signupEmail.value.trim(),
        password: signupPassword.value
      })
    });
    const data = await resp.json();
    if (!resp.ok) {
      signupError.textContent = data.error || "Signup failed";
      return;
    }
    currentUser = data;
    enterApp();
  } catch (err) {
    console.error(err);
    signupError.textContent = "Network error";
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";
  try {
    const resp = await fetch(`${API_BASE}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: loginEmail.value.trim(),
        password: loginPassword.value
      })
    });
    const data = await resp.json();
    if (!resp.ok) {
      loginError.textContent = data.error || "Login failed";
      return;
    }
    currentUser = data;
    enterApp();
  } catch (err) {
    console.error(err);
    loginError.textContent = "Network error";
  }
});

resetForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  resetMsg.textContent = "";
  try {
    const resp = await fetch(`${API_BASE}/api/request-password-reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: resetEmail.value.trim() })
    });
    const data = await resp.json();
    resetMsg.textContent = data.message || "Reset link sent (demo).";
  } catch (err) {
    console.error(err);
    resetMsg.textContent = "Network error";
  }
});

function enterApp() {
  authView.style.display = "none";
  appView.style.display = "block";
  appNav.style.display = "flex";
  showView("search");
  initData();
}

// ----- NAVIGATION -----
navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const view = btn.getAttribute("data-view");
    showView(view);
  });
});

logoutBtn.addEventListener("click", () => {
  currentUser = null;
  currentBookings = [];
  appNav.style.display = "none";
  appView.style.display = "none";
  authView.style.display = "block";
});

function showView(view) {
  searchView.style.display = "none";
  bookingsView.style.display = "none";
  bookingView.style.display = "none";
  confirmationView.style.display = "none";

  if (view === "search") {
    searchView.style.display = "block";
  } else if (view === "bookings") {
    bookingsView.style.display = "block";
    loadBookings();
  }
}

// ----- INIT DATA -----
async function initData() {
  setMinDate();
  await loadCities();
  await loadDeals();
}

// Cities for datalist
async function loadCities() {
  try {
    const resp = await fetch(`${API_BASE}/api/cities`);
    const cities = await resp.json();
    cityOptions.innerHTML = "";
    cities.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = `${c.city} (${c.code})`;
      cityOptions.appendChild(opt);
    });
  } catch (err) {
    console.error("cities error", err);
  }
}

// Deals
async function loadDeals() {
  try {
    const resp = await fetch(`${API_BASE}/api/deals`);
    const list = await resp.json();
    renderFlightList(list, dealsList);
  } catch (err) {
    console.error("deals error", err);
  }
}

// ----- SEARCH -----
searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const from = fromInput.value.trim();
  const to = toInput.value.trim();
  const date = dateInput.value;
  if (!from || !to || !date) return;

  try {
    const params = new URLSearchParams({ from, to, date });
    const resp = await fetch(`${API_BASE}/api/flights?${params.toString()}`);
    const list = await resp.json();
    renderFlightList(list, resultsList);
  } catch (err) {
    console.error("search error", err);
  }
});

// ----- RENDER FLIGHT CARDS -----
function renderFlightList(list, container) {
  container.innerHTML = "";
  if (!list || list.length === 0) {
    container.innerHTML = `<p class="muted">No flights found for this selection.</p>`;
    return;
  }

  list.forEach((f) => {
    const discountPrice = f.basePrice * (1 - (f.discountPercent || 0) / 100);
    const card = document.createElement("div");
    card.className = "flight-card";
    card.innerHTML = `
      <div class="flight-main">
        <div class="flight-airline">${f.airline}</div>
        <div class="flight-route">
          ${f.originCity} (${f.originCode}) → ${f.destinationCity} (${f.destinationCode})
        </div>
        <div class="flight-time">
          ${f.departureDate} · ${f.departureTime} · ~${f.durationHours}h
        </div>
      </div>
      <div class="flight-price-block">
        <div class="old-price">${money(f.basePrice)}</div>
        <div class="new-price">${money(discountPrice)}</div>
        <div class="tag-discount">${f.discountPercent}% OFF</div>
        <button class="btn-secondary select-flight-btn">View &amp; book</button>
      </div>
    `;
    const btn = card.querySelector(".select-flight-btn");
    btn.addEventListener("click", () => openBooking(f));
    container.appendChild(card);
  });
}

// ----- BOOKING FLOW -----
backToSearchBtn.addEventListener("click", () => {
  bookingView.style.display = "none";
  confirmationView.style.display = "none";
  showView("search");
});

// open booking view with selected flight
function openBooking(flight) {
  selectedFlight = flight;
  selectedSeat = null;
  bookingMsg.textContent = "";
  bookingForm.reset();
  updatePriceDisplay();

  renderSelectedFlightSummary();
  buildSeatMap();

  searchView.style.display = "none";
  bookingsView.style.display = "none";
  confirmationView.style.display = "none";
  bookingView.style.display = "block";
}

function renderSelectedFlightSummary() {
  if (!selectedFlight) {
    selectedFlightSummary.innerHTML = "";
    return;
  }
  const f = selectedFlight;
  const discountPrice = f.basePrice * (1 - (f.discountPercent || 0) / 100);

  selectedFlightSummary.innerHTML = `
    <h3>${f.originCity} (${f.originCode}) → ${f.destinationCity} (${f.destinationCode})</h3>
    <p>${f.departureDate} · ${f.departureTime} · ~${f.durationHours}h</p>
    <p><strong>${f.airline}</strong></p>
    <p>
      Base: ${money(f.basePrice)} |
      Discount: ${f.discountPercent}% |
      From: ${money(discountPrice)}
    </p>
  `;
}

// seat map
function buildSeatMap() {
  seatMapEl.innerHTML = "";
  const rows = 8;
  const seatsPerRow = 6;
  const extraRows = [1, 2]; // front rows are extra-legroom

  for (let r = 1; r <= rows; r++) {
    const row = document.createElement("div");
    row.className = "seat-row";

    for (let s = 0; s < seatsPerRow; s++) {
      const label = `${r}${String.fromCharCode(65 + s)}`;
      const isExtra = extraRows.includes(r);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "seat " + (isExtra ? "seat-extra" : "seat-standard");
      btn.textContent = label;

      btn.addEventListener("click", () => {
        seatMapEl
          .querySelectorAll(".seat")
          .forEach((x) => x.classList.remove("seat-selected"));
        btn.classList.add("seat-selected");
        selectedSeat = {
          label,
          type: isExtra ? "extra" : "standard",
          extraPrice: isExtra ? 40 + Math.random() * 40 : 0
        };
        updatePriceDisplay();
      });

      row.appendChild(btn);
    }

    seatMapEl.appendChild(row);
  }
}

function updatePriceDisplay() {
  if (!selectedFlight) {
    priceDisplay.textContent = "$0.00";
    return;
  }
  const base = selectedFlight.basePrice;
  const discount = selectedFlight.discountPercent || 0;
  let price = base * (1 - discount / 100);

  if (selectedSeat && selectedSeat.type === "extra") {
    price += selectedSeat.extraPrice;
  }

  const cabin = cabinClassSelect.value;
  let mult = 1;
  if (cabin === "business") mult = 1.8;
  if (cabin === "first") mult = 2.5;
  price *= mult;

  priceDisplay.textContent = money(price);
  return Number(price.toFixed(2));
}

cabinClassSelect.addEventListener("change", updatePriceDisplay);

// handle booking submit
bookingForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser || !selectedFlight) {
    alert("Missing user or flight.");
    return;
  }
  if (!selectedSeat) {
    alert("Please select a seat.");
    return;
  }

  const passengerName = passengerNameInput.value.trim();
  const passengerEmail = passengerEmailInput.value.trim();
  const passengerAge = parseInt(passengerAgeInput.value, 10);
  const meal = mealSelect.value;
  const drink = drinkSelect.value;

  const totalPrice = updatePriceDisplay();

  try {
    const resp = await fetch(`${API_BASE}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: currentUser.id,
        flightId: selectedFlight.id,
        cabinClass: cabinClassSelect.value,
        passengerName,
        passengerEmail,
        passengerAge,
        totalPrice,
        seat: selectedSeat.label,
        meal,
        drink
      })
    });

    const data = await resp.json();
    if (!resp.ok || !data.success) {
      console.error("Booking error:", data);
      alert(data.error || "Could not complete booking");
      return;
    }

    const booking = data.booking;

    // navigate to confirmation "page"
    bookingView.style.display = "none";
    searchView.style.display = "none";
    bookingsView.style.display = "none";
    confirmationView.style.display = "block";

    confirmMessage.textContent = `Your booking is confirmed. Reference ${booking.bookingRef}. A confirmation email has been sent to ${booking.passengerEmail} (if email is configured).`;

    confirmDetails.innerHTML = `
      <p><strong>Passenger:</strong> ${booking.passengerName} (${booking.passengerAge ?? "N/A"})</p>
      <p><strong>Cabin:</strong> ${booking.cabinClass}</p>
      <p><strong>Seat:</strong> ${booking.seat || "N/A"}</p>
      <p><strong>Meal:</strong> ${booking.meal || "Standard"}</p>
      <p><strong>Drink:</strong> ${booking.drink || "Soft drink"}</p>
      <p><strong>Total paid:</strong> ${money(booking.totalPrice)}</p>
      <p><strong>Status:</strong> ${booking.status}</p>
      <p><strong>Booking ref:</strong> ${booking.bookingRef}</p>
    `;

    loadBookings();
  } catch (err) {
    console.error(err);
    alert("Network error while booking");
  }
});

confirmBackHome.addEventListener("click", () => {
  confirmationView.style.display = "none";
  showView("search");
  loadDeals();
});

// ----- BOOKINGS LIST -----
async function loadBookings() {
  if (!currentUser) return;
  try {
    const resp = await fetch(`${API_BASE}/api/bookings/user/${currentUser.id}`);
    const list = await resp.json();
    currentBookings = list;
    renderBookings();
  } catch (err) {
    console.error("loadBookings error", err);
  }
}

function renderBookings() {
  bookingsList.innerHTML = "";
  if (!currentBookings || currentBookings.length === 0) {
    bookingsList.innerHTML = `<p class="muted">No bookings yet.</p>`;
    return;
  }

  currentBookings.forEach((b) => {
    const card = document.createElement("div");
    card.className = "booking-card";
    card.innerHTML = `
      <div class="booking-main">
        <div><strong>Ref:</strong> ${b.bookingRef}</div>
        <div><strong>Passenger:</strong> ${b.passengerName}${
      b.passengerAge ? " (" + b.passengerAge + ")" : ""
    }</div>
        <div><strong>Cabin:</strong> ${b.cabinClass}</div>
        <div><strong>Seat:</strong> ${b.seat || "N/A"}</div>
        <div><strong>Total:</strong> ${money(b.totalPrice)}</div>
        <div><strong>Status:</strong> ${b.status}</div>
      </div>
      <div class="booking-actions">
        ${
          b.status === "confirmed"
            ? `<button class="btn-secondary cancel-booking-btn" data-id="${b.id}">Cancel</button>`
            : ""
        }
      </div>
    `;
    bookingsList.appendChild(card);
  });

  bookingsList.querySelectorAll(".cancel-booking-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      cancelBooking(id);
    });
  });
}

async function cancelBooking(id) {
  if (!confirm("Cancel this booking?")) return;
  try {
    const resp = await fetch(`${API_BASE}/api/bookings/${id}/cancel`, {
      method: "POST"
    });
    const data = await resp.json();
    if (!resp.ok || !data.success) {
      alert(data.error || "Could not cancel");
      return;
    }
    loadBookings();
  } catch (err) {
    console.error("cancel error", err);
  }
}

// ----- ON LOAD -----
document.addEventListener("DOMContentLoaded", () => {
  setMinDate();
});