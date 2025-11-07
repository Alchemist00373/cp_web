import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { showToast } from "../Components/toast.js"; 
import { firebaseConfig } from "../Firebaseconfig/firebasecon.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const form = document.getElementById("SignUpForm");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("gmail");
const passwordInput = document.getElementById("password");
const submitButton = document.getElementById("register");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  submitButton.disabled = true;
  submitButton.textContent = "Registering...";

  const username = usernameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !email || !password) {
    showToast("Please fill in all fields.");
    submitButton.disabled = false;
    submitButton.textContent = "Register";
    return;
  }

  const strongPassword = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/;
  if (!strongPassword.test(password)) {
    showToast("Password must include a number, uppercase, and special character.");
    submitButton.disabled = false;
    submitButton.textContent = "Register";
    return;
  }

  const usersRef = collection(db, "users");
  const q = query(usersRef, where("username", "==", username));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    showToast("Username already taken. Try another one.");
    submitButton.disabled = false;
    submitButton.textContent = "Register";
    return;
  }

  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCred.user;

    await setDoc(doc(db, "users", user.uid), {
      username,
      displayName: username,
      email,
      role: "user",
      photoURL: "../images/slide3.gif",
      createdAt: serverTimestamp(),
      verified: false
    });

    await sendEmailVerification(user);

    showToast("Verification email sent! Check spam folder.");
    await signOut(auth);

    setTimeout(() => {
      window.location.href = "../html/login.html";
    }, 1500);

  } catch (error) {
    console.error("Sign-up Error:", error);
    showToast(error.message);
  }

  submitButton.disabled = false;
  submitButton.textContent = "Register";
});

const toggleSignUpPassword = document.getElementById("togglePassword");
const signUpPasswordField = document.getElementById("password");

toggleSignUpPassword.addEventListener("click", () => {
  const isHidden = signUpPasswordField.type === "password";
  signUpPasswordField.type = isHidden ? "text" : "password";
  toggleSignUpPassword.src = isHidden ? "../images/close.png" : "../images/open.png";
});
