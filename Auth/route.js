import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { firebaseConfig } from "../Firebaseconfig/firebasecon.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const restrictedForLoggedIn = ["login.html", "sign-up.html"];
const currentPath = window.location.pathname.toLowerCase();

if (restrictedForLoggedIn.some(page => currentPath.endsWith(page))) {
  const loader = document.createElement("div");
  loader.id = "authLoader";
  loader.innerHTML = `
    <div class="loader-wrapper">
      <div class="spinner"></div>
      <p class="loader-message">Redirecting to your adventure...</p>
    </div>
  `;
  document.body.appendChild(loader);

  onAuthStateChanged(auth, (user) => {
    // ✅ Only verified users are treated as logged in
    if (user && user.emailVerified) {
      loader.querySelector(".loader-message").textContent = "Loading home...";
      setTimeout(() => window.location.replace("../html/home.html"), 1000);
    } else {
      // Not logged in OR not verified — remove loader and stay on page
      loader.classList.add("fade-out");
      setTimeout(() => loader.remove(), 1000);
    }
  });
}