import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
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
    if (user) {
      loader.querySelector(".loader-message").textContent = "Loading home...";
      setTimeout(() => window.location.replace("../html/home.html"), 1200);
    } else {
      loader.classList.add("fade-out");
      setTimeout(() => loader.remove(), 600);
    }
  });
}
