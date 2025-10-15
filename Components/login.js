import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, signInWithEmailAndPassword , sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ✅ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDk4vGXwPsWzR0SLzs-qxpsen3Ukzb0oUk",
  authDomain: "thousands-shore.firebaseapp.com",
  projectId: "thousands-shore",
  storageBucket: "thousands-shore.firebasestorage.app",
  messagingSenderId: "692828584348",
  appId: "1:692828584348:web:deb793b3b30992536d3059",
  measurementId: "G-HB89ZEE82P"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ✅ Login Form Handling
const form = document.getElementById("SignInForm");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("getgmail").value.trim();
    const password = document.getElementById("getpassword").value.trim();

    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    try {
      // Firebase Login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      alert(`Welcome back, ${user.displayName || "Adventurer"}!`);
      
      //Redirect after successful login
      window.location.href = "../html/profile.html";

    } catch (error) {
      console.error("Login Error:", error);
      handleLoginError(error);
    }
  });
}

// error handling
function handleLoginError(error) {
  let message = "Login failed. Please try again.";

  switch (error.code) {
    case "auth/invalid-email":
      message = "Invalid email format.";
      break;
    case "auth/user-not-found":
      message = "No account found with this email.";
      break;
    case "auth/wrong-password":
      message = "Incorrect password. Try again.";
      break;
    case "auth/too-many-requests":
      message = "Too many failed attempts. Please wait a moment.";
      break;
  }

  alert(message);
}

// ✅ Forgot Password Handling
const forgotPasswordLink = document.querySelector("#forgot-password-link");
if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener("click", async (e) => {
    e.preventDefault();
    const email = prompt("Please enter your email for password reset:");
    if (email) {
      try {
        await sendPasswordResetEmail(auth, email);
        alert("Password reset email sent. Please check your inbox.");
      } catch (error) {
        console.error("Password Reset Error:", error);
        alert("Error sending password reset email. Please try again.");
      }
    } else {
      alert("Email is required for password reset.");
    }
  });
}