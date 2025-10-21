import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// === Firebase Config (same everywhere) ===
import { firebaseConfig } from "../Firebaseconfig/firebasecon.js";


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// === Header elements ===
const authButtons = document.getElementById("authButtons");
const profileDropdown = document.getElementById("profileDropdown");
const profileBtn = document.getElementById("profileBtn");
const dropdownMenu = document.getElementById("dropdownMenu");
const profilePic = document.getElementById("profilePic");
const profileName = document.getElementById("profileName");
const logoutBtn = document.getElementById("logoutBtn");

onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Logged in
    authButtons.style.display = "none";
    authButtons.hidden
    profileDropdown.hidden = false;

    try {
      // 🔥 Always fetch latest data from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        profilePic.src = data.photoURL || "";
      } else {
        // fallback
        profilePic.src = "";
        profileName.textContent = "Adventurer";
      }
    } catch (err) {
      console.error("Error loading user data:", err);
      profilePic.src = "";
      profileName.textContent = "Adventurer";
    }

    // 🔁 Real-time sync across pages (from profile.js)
    window.addEventListener("storage", (event) => {
      if (event.key === "updatedAvatarURL" && event.newValue) {
        profilePic.src = event.newValue;
      }
    });

  } else {
    // Not logged in
    authButtons.style.display = "flex";
    profileDropdown.hidden = true;
  }
});

// === Dropdown toggle ===
profileBtn?.addEventListener("click", () => {
  profileDropdown.classList.toggle("active");
});

// === Logout ===
logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "../html/login.html";
});

// === Optional: close dropdown when clicking outside ===
document.addEventListener("click", (e) => {
  if (!profileDropdown.contains(e.target) && !profileBtn.contains(e.target)) {
    profileDropdown.classList.remove("active");
  }
});