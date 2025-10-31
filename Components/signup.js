// ✅ Import initialized Firebase services from your shared config
import { auth, db, app } from "../Firebaseconfig/firebasecon.js";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

// ✅ DOM Elements
const form = document.getElementById("SignUpForm");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("gmail");
const passwordInput = document.getElementById("password");

// ✅ Sign-up Handler
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Simple validations
    if (!username || !email || !password) {
        alert("Please fill in all fields.");
        return;
    }
    if (password.length < 8) {
        alert("Password must be at least 8 characters long.");
        return;
    }
    // Password complexity: at least one number and one special character
    const strongPassword = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/;
    if (!strongPassword.test(password)) {
        alert("Password must include at least one number, one uppercase letter, and one special character.");
        return;
    }
    if (!username || username.length < 4 || username.length > 20) {
        alert("Username must be between 4 and 20 characters.");
        return;
    }

    if (!email.includes("@") || !email.includes(".") || email.indexOf("@") > email.lastIndexOf(".") - 2) {
        alert("Please enter a valid email address.");
        return;
    }



    try {
        // Create user in Firebase Auth
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCred.user;

        // Update display name
        await updateProfile(user, { displayName: username });

        // Save user info to Firestore
        await setDoc(doc(db, "users", user.uid), {
            username: username,
            displayName: username,
            email: email,
            role: "user",
            photoURL: "../images/slide3.gif",
            createdAt: new Date().toISOString()
        });

        alert("Sign-up successful! Redirecting to homepage...");
        window.location.href = "../html/home.html";

    } catch (error) {
        console.error("Error signing up:", error);
        alert("Error: " + error.message);
    }
});
