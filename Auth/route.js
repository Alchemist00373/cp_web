// ✅ Import initialized Firebase services
import { auth } from "../Firebaseconfig/firebasecon.js";
import { onAuthStateChanged } from "firebase/auth";

const restrictedForLoggedIn = ["login.html", "sign-up.html"];
const currentPath = window.location.pathname.toLowerCase();

if (restrictedForLoggedIn.some(page => currentPath.endsWith(page))) {
  // Create loader element
  const loader = document.createElement("div");
  loader.id = "authLoader";
  loader.innerHTML = `
    <div class="loader-wrapper">
      <div class="spinner"></div>
      <p class="loader-message">Redirecting to your adventure...</p>
    </div>
  `;
  document.body.appendChild(loader);

  // Auth check
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
