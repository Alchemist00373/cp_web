import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { firebaseConfig } from "../Firebaseconfig/firebasecon.js";
import { showToast } from "../Components/toast.js";


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);



document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("SignInForm");
  const submitButton = document.getElementById("login");
  const togglePassword = document.getElementById("togglePassword");
  const passwordField = document.getElementById("getpassword");
  const forgotPasswordLink = document.querySelector("#forgot-password-link");
  const forgotModal = document.getElementById("forgotModal");
  const closeForgotModal = document.getElementById("closeForgotModal");
  const sendForgotEmail = document.getElementById("sendForgotEmail");
  const forgotEmail = document.getElementById("forgotEmail");
  
  if (!form || !submitButton) return;

  // Toggle password visibility
  if (togglePassword && passwordField) {
    togglePassword.addEventListener("click", () => {
      const isHidden = passwordField.type === "password";
      passwordField.type = isHidden ? "text" : "password";
      togglePassword.src = isHidden ? "../images/close.png" : "../images/open.png";
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Disable the button while logging in
    submitButton.disabled = true;
    submitButton.style.display = "none";

    const email = document.getElementById("getgmail").value.trim();
    const password = document.getElementById("getpassword").value.trim();

    if (!email || !password) {
      showToast("Please enter both email and password.");
      submitButton.disabled = false;
      submitButton.style.display = "block";
      submitButton.textContent = "Login";
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Email verification check
      if (!user.emailVerified) {
        showToast("Please verify your email before logging in. A verification link was sent to your email, check spam.");
        try {
          await sendEmailVerification(user);
          showToast("Verification email re-sent! Check your inbox/spam.");
        } catch (err) {
          console.error("Error resending verification:", err);
        }
        await signOut(auth);
        submitButton.disabled = false;
        submitButton.style.display = "block";
        submitButton.textContent = "Login";
        return;
      }

      // Firestore user document
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        if (!data.verified) {
          await updateDoc(userRef, { verified: true });
        }
      } else {
        await setDoc(userRef, {
          username: user.displayName || "User",
          email: user.email,
          role: "user",
          photoURL: user.photoURL || "../images/slide3.gif",
          createdAt: serverTimestamp(),
          verified: true
        });
      }

      window.location.href = "../html/profile.html";

    } catch (error) {
      console.error("Login Error:", error.code, error.message);

      // Handle common errors
      switch (error.code) {
        case "auth/invalid-credential":
          showToast("Please check the email and password, either one of them is wrong.");
          break;
        default:
          showToast(error.message);
      }

      submitButton.disabled = false;
      submitButton.style.display = "block";
      submitButton.textContent = "Login";
    }
  });



  // Open Modal
  forgotPasswordLink.addEventListener("click", (e) => {
    e.preventDefault();
    forgotModal.classList.remove("hidden");
  });

  // Close Modal
  closeForgotModal.addEventListener("click", () => {
    forgotModal.classList.add("hidden");
  });

  // Send Password Reset Email
  sendForgotEmail.addEventListener("click", async () => {
    const email = forgotEmail.value.trim();
    if (!email) return showToast("Please enter your email.", "error");

    try {
      await sendPasswordResetEmail(auth, email);
      showToast("Password reset email sent!", "success");
      forgotModal.classList.add("hidden");
    } catch (err) {
      showToast("Failed to send reset email.", "error");
    }
  });
});
