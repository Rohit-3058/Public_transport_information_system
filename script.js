const STORAGE_KEYS = {
    users: "transitgoUsers",
    currentUser: "transitgoCurrentUser",
    bookings: "transitgoBookings",
};

const STATIONS_DATA = {
    bus: [
        { name: "Sindhi Camp Bus Stand", lat: 26.9248, lng: 75.8016, routes: ["Route 1: Sindhi Camp -> Badi Chaupar -> Transport Nagar", "Route 7: Sindhi Camp -> Sanganer", "AC-1: Sindhi Camp -> Mansarovar"] },
        { name: "Transport Nagar Bus Stand", lat: 26.9038, lng: 75.8453, routes: ["Route 1: Transport Nagar -> Badi Chaupar -> Sindhi Camp", "Route 9: Transport Nagar -> Malviya Nagar"] },
        { name: "Sanganer Bus Stand", lat: 26.8183, lng: 75.7878, routes: ["Route 7: Sanganer -> Sindhi Camp", "Route 11: Sanganer -> Ajmeri Gate"] },
        { name: "Badi Chaupar Bus Stop", lat: 26.9239, lng: 75.8267, routes: ["Route 1: Badi Chaupar -> Transport Nagar", "Route 3: Badi Chaupar -> Ramniwas Bagh"] },
        { name: "Jaipur Junction Bus Stop", lat: 26.9200, lng: 75.7870, routes: ["Route 5: Jaipur Junction -> Ajmeri Gate", "Route 12: Jaipur Junction -> Mansarovar"] },
        { name: "Jaipur Airport Bus Stop", lat: 26.8286, lng: 75.8056, routes: ["AC-2: Airport -> Jawahar Circle -> Sindhi Camp"] }
    ],
    metro: [
        { name: "Mansarovar Metro Station", lat: 26.8814, lng: 75.7601, routes: ["Pink Line: Mansarovar -> New Aatish Market -> Chandpole"] },
        { name: "New Aatish Market Metro Station", lat: 26.8872, lng: 75.7686, routes: ["Pink Line: New Aatish Market -> Mansarovar / Chandpole"] },
        { name: "Railway Station Metro Station", lat: 26.9195, lng: 75.7878, routes: ["Pink Line: Railway Station -> Chandpole"] },
        { name: "Chandpole Metro Station", lat: 26.9256, lng: 75.8086, routes: ["Pink Line: Chandpole -> Choti Chaupar"] },
        { name: "Choti Chaupar Metro Station", lat: 26.9248, lng: 75.8174, routes: ["Pink Line: Choti Chaupar -> Badi Chaupar"] },
        { name: "Badi Chaupar Metro Station", lat: 26.9239, lng: 75.8267, routes: ["Pink Line: Badi Chaupar Terminus"] }
    ],
};

// Calculate Haversine distance in km between two lat/lng points
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1); // distance in km
}

const getUsers = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || "[]");
const getCurrentUser = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser) || "null");
const getBookings = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.bookings) || "[]");
const saveUsers = (users) => localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
const saveBookings = (bookings) => localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(bookings));
const setCurrentUser = (user) => localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));

function showMessage(form, message, error = false) {
    const msg = form.querySelector(".form-message");
    if (!msg) return;
    msg.textContent = message;
    msg.style.color = error ? "#c0392b" : "#32833b";
}

function updateNavigation() {
    const actions = document.querySelector(".nav-actions");
    if (!actions) return;
    const user = getCurrentUser();
    actions.innerHTML = user
        ? `<a class="login-link" href="#" id="logoutButton">Logout</a><a class="btn btn-small" href="profile.html">Profile</a>`
        : `<a class="login-link" href="login.html">Login</a><a class="btn btn-small" href="register.html">Register</a>`;

    document.getElementById("logoutButton")?.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem(STORAGE_KEYS.currentUser);
        window.location.href = "index.html";
    });
}

updateNavigation();

function initializeTransportSelector() {
    const modeSelect = document.getElementById("transportMode");
    const fromSelect = document.getElementById("from");
    const toSelect = document.getElementById("to");
    const shortcutDisplay = document.getElementById("shortcutDisplay");

    if (!modeSelect || !fromSelect || !toSelect) return;

    function populateStations(mode) {
        const stations = STATIONS_DATA[mode] || [];
        fromSelect.innerHTML = `<option value="" disabled selected>Select starting ${mode} station/stop</option>`;
        toSelect.innerHTML = `<option value="" disabled selected>Select destination ${mode} station/stop</option>`;

        stations.forEach((st) => {
            const opt1 = document.createElement("option");
            opt1.value = st.name;
            opt1.textContent = st.name;
            fromSelect.appendChild(opt1);

            const opt2 = document.createElement("option");
            opt2.value = st.name;
            opt2.textContent = st.name;
            toSelect.appendChild(opt2);
        });

        updateShortcutInfo();
    }

    function updateShortcutInfo() {
        if (!shortcutDisplay) return;
        const mode = modeSelect.value;
        const fromVal = fromSelect.value;
        const toVal = toSelect.value;

        if (!fromVal || !toVal) {
            shortcutDisplay.innerHTML = "";
            return;
        }

        if (fromVal === toVal) {
            shortcutDisplay.innerHTML = `<div class="form-message" style="color:#c0392b;"><i class="fa-solid fa-triangle-exclamation"></i> Departure and destination cannot be the same station.</div>`;
            return;
        }

        const stations = STATIONS_DATA[mode] || [];
        const fromData = stations.find((s) => s.name === fromVal);
        const toData = stations.find((s) => s.name === toVal);

        let distanceKm = "N/A";
        let estTimeMinutes = 0;
        let estFare = 10;

        if (fromData && toData && fromData.lat && toData.lat) {
            distanceKm = calculateDistance(fromData.lat, fromData.lng, toData.lat, toData.lng);
            const distNum = parseFloat(distanceKm);

            // Average speeds by mode (bus: 25km/h, metro: 35km/h)
            const speed = mode === "metro" ? 35 : 25;
            estTimeMinutes = Math.ceil((distNum / speed) * 60) + 3; // +3 min buffer

            // Fare calculation
            estFare = mode === "metro" ? Math.min(30, Math.max(10, Math.ceil(distNum * 3))) : Math.max(10, Math.ceil(distNum * 2.5));
        }

        let matchedRoutes = [];
        if (fromData && toData) {
            matchedRoutes = fromData.routes.filter((r) =>
                toData.routes.some((tr) => tr.split(":")[0] === r.split(":")[0])
            );
        }

        let shortcutText = "";
        if (matchedRoutes.length > 0) {
            const cleanRoutes = matchedRoutes.map(r => {
                const parts = r.split(":");
                const lineName = parts[0].trim();
                return `${lineName}: ${fromVal} ➔ ${toVal}`;
            });
            shortcutText = cleanRoutes.join(" | ");
        } else {
            shortcutText = `Direct Line via ${mode.toUpperCase()} (${fromVal} ➔ ${toVal})`;
        }

        shortcutDisplay.innerHTML = `
            <div class="info-card" style="margin-top:14px; padding:16px; background:#edf7ff; border:1px solid #1677d2; border-radius:10px;">
                <div style="border-bottom:1px solid #d9e2ec; padding-bottom:8px; margin-bottom:10px;">
                    <strong style="color:#1677d2; font-size:16px;"><i class="fa-solid fa-map-location-dot"></i> Best & Shortest Route Details</strong>
                </div>
                <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; margin-bottom:12px; text-align:center;">
                    <div style="background:white; padding:8px; border-radius:6px; border:1px solid #d9e2ec;">
                        <span style="font-size:12px; color:#627d98;">Distance</span>
                        <p style="font-weight:bold; color:#102a43; font-size:16px; margin-top:2px;">📍 ${distanceKm} km</p>
                    </div>
                    <div style="background:white; padding:8px; border-radius:6px; border:1px solid #d9e2ec;">
                        <span style="font-size:12px; color:#627d98;">Est. Time</span>
                        <p style="font-weight:bold; color:#102a43; font-size:16px; margin-top:2px;">⏱️ ~${estTimeMinutes} mins</p>
                    </div>
                    <div style="background:white; padding:8px; border-radius:6px; border:1px solid #d9e2ec;">
                        <span style="font-size:12px; color:#627d98;">Est. Fare</span>
                        <p style="font-weight:bold; color:#32833b; font-size:16px; margin-top:2px;">🎫 ₹${estFare}</p>
                    </div>
                </div>
                <p style="color:#102a43; font-weight:bold; margin-top:5px;"><i class="fa-solid fa-route" style="color:#1677d2;"></i> ${shortcutText}</p>
            </div>
        `;
    }

    modeSelect.addEventListener("change", (e) => populateStations(e.target.value));
    fromSelect.addEventListener("change", updateShortcutInfo);
    toSelect.addEventListener("change", updateShortcutInfo);

    populateStations(modeSelect.value);
}

initializeTransportSelector();

const registerForm = document.getElementById("registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("full-name").value.trim();
        const email = document.getElementById("register-email").value.trim().toLowerCase();
        const password = document.getElementById("register-password").value;
        const users = getUsers();
        if (users.some((u) => u.email === email)) {
            return showMessage(registerForm, "An account with this email already exists. Please login.", true);
        }
        users.push({ name, email, password, joined: new Date().getFullYear() });
        saveUsers(users);
        showMessage(registerForm, "Account created! Redirecting you to login...");
        setTimeout(() => { window.location.href = "login.html"; }, 800);
    });
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value.trim().toLowerCase();
        const password = document.getElementById("login-password").value;
        const user = getUsers().find((u) => u.email === email && u.password === password);
        if (!user) {
            return showMessage(loginForm, "Incorrect email or password. Please try again.", true);
        }
        setCurrentUser({ name: user.name, email: user.email, joined: user.joined });
        showMessage(loginForm, "Login successful! Opening your profile...");
        setTimeout(() => { window.location.href = "profile.html"; }, 600);
    });
}

const routeForm = document.getElementById("routeForm");
const routeMessage = document.getElementById("routeMessage");

document.querySelector(".swap-btn")?.addEventListener("click", () => {
    const from = document.getElementById("from");
    const to = document.getElementById("to");
    if (from && to) {
        const temp = from.value;
        from.value = to.value;
        to.value = temp;
        from.dispatchEvent(new Event("change"));
        to.dispatchEvent(new Event("change"));
    }
});

if (routeForm) {
    routeForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const user = getCurrentUser();
        if (!user) {
            routeMessage.textContent = "Please login first to book transit tickets.";
            routeMessage.style.color = "#c0392b";
            return;
        }
        const mode = document.getElementById("transportMode")?.value || "bus";
        const fromVal = document.getElementById("from").value;
        const toVal = document.getElementById("to").value;
        if (!fromVal || !toVal || fromVal === toVal) {
            routeMessage.textContent = "Please select valid, different departure and destination stations.";
            routeMessage.style.color = "#c0392b";
            return;
        }
        const booking = {
            email: user.email,
            from: fromVal,
            to: toVal,
            service: `${mode.toUpperCase()} Booking`,
        };
        const bookings = getBookings();
        bookings.push(booking);
        saveBookings(bookings);
        routeMessage.textContent = `${mode.toUpperCase()} booked from ${booking.from} to ${booking.to}. Saved to your profile.`;
        routeMessage.style.color = "#32833b";
    });
}

function loadProfile() {
    if (!document.body.classList.contains("profile-view")) return;
    const user = getCurrentUser();
    if (!user) {
        window.location.href = "login.html";
        return;
    }
    const initials = user.name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
    document.getElementById("profile-avatar").textContent = initials;
    document.getElementById("profile-display-name").textContent = user.name;
    document.getElementById("profile-display-email").textContent = `${user.email} · Member since ${user.joined}`;
    document.getElementById("profile-name").value = user.name;
    document.getElementById("profile-email").value = user.email;

    const bookings = getBookings().filter((b) => b.email === user.email);
    document.getElementById("bookingsList").innerHTML = bookings.length
        ? bookings.map((b) => `<div class="saved-route"><span class="route-circle"><i class="fa-solid fa-circle"></i></span><div><strong>${b.from} → ${b.to}</strong><span>${b.service} · Saved booking</span></div></div>`).join("")
        : `<p class="empty-bookings">No bookings yet. Plan a journey from the home page.</p>`;
}

const profileForm = document.getElementById("profileForm");
if (profileForm) {
    profileForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const current = getCurrentUser();
        const name = document.getElementById("profile-name").value.trim();
        const email = document.getElementById("profile-email").value.trim().toLowerCase();
        const users = getUsers();
        const index = users.findIndex((u) => u.email === current.email);
        if (users.some((u, i) => u.email === email && i !== index)) {
            return showMessage(profileForm, "That email is already used by another account.", true);
        }
        users[index] = { ...users[index], name, email };
        saveUsers(users);
        saveBookings(getBookings().map((b) => (b.email === current.email ? { ...b, email } : b)));
        setCurrentUser({ ...current, name, email });
        showMessage(profileForm, "Profile details saved successfully.");
        updateNavigation();
        loadProfile();
    });
}

document.querySelectorAll(".simple-form:not(#registerForm):not(#loginForm):not(#profileForm)").forEach((form) => {
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        showMessage(form, form.dataset.message || "Your details have been submitted.");
    });
});

loadProfile();