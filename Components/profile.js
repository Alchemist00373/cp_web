import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import{showToast} from"../Components/toast.js";
import { firebaseConfig } from "../Firebaseconfig/firebasecon.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// === UI Elements ===
const displayNameEl = document.getElementById("displayName");
const displayEmailEl = document.getElementById("displayEmail");
const profileAvatar = document.getElementById("profileAvatar");
const avatarSelectContainer = document.getElementById("avatarSelectContainer");
const avatarOptions = document.getElementById("avatarOptions");
const nameInput = document.getElementById("nameInput");
const editBtn = document.getElementById("editProfileBtn");
const saveBtn = document.getElementById("saveProfileBtn");

let currentUser;

// === Loader Control ===
function showLoader() {
  const loader = document.getElementById("authLoader");
  if (loader) loader.classList.remove("fade-out");
}

function hideLoader() {
  const loader = document.getElementById("authLoader");
  if (!loader) return;
  loader.classList.add("fade-out");
  setTimeout(() => loader.remove(), 600);
}

// Show loader when the page starts
showLoader();

// === Auth State Handling ===
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../html/login.html";
    return;
  }

  currentUser = user;
  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (userDoc.exists()) {
      const data = userDoc.data();
      displayNameEl.textContent = data.displayName || "Adventurer";
      displayEmailEl.textContent = data.email || "Unknown";
      profileAvatar.src = data.photoURL || "../images/default.png";
    } else {
      displayNameEl.textContent = user.displayName || "Unknown Adventurer";
      displayEmailEl.textContent = user.email;
      profileAvatar.src = "../images/default.png";
    }

    enableEditMode();
    await loadStats(user.uid);
  } catch (err) {
    console.error("Error loading profile:", err);
  } finally {
    hideLoader(); // ✅ hide after profile info loads
  }
});


function enableEditMode() {
  editBtn.hidden = false;
  avatarSelectContainer.hidden = false; // show avatar selector
}

// === Edit Profile Name ===
editBtn?.addEventListener("click", () => {
  nameInput.hidden = false;
  nameInput.value = displayNameEl.textContent;
  saveBtn.hidden = false;
  editBtn.hidden = true;
});

saveBtn?.addEventListener("click", async () => {
  const newName = nameInput.value.trim();
  if (!newName) return showToast("Please enter a valid name.");

  // ✅ Prevent using existing display names of other users
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("displayName", "==", newName));
  const snapshot = await getDocs(q);

  // If name exists AND it's not the current user's old name
  if (!snapshot.empty && newName !== displayNameEl.textContent) {
    showToast(" Display name already taken. Please choose a different name.");
    return;
  }

  try {
    // ✅ Update Firebase Auth profile
    await updateProfile(currentUser, { displayName: newName });

    // ✅ Update Firestore user document
    await setDoc(
      doc(db, "users", currentUser.uid),
      { displayName: newName, username: newName }, // keep synced
      { merge: true }
    );

    displayNameEl.textContent = newName;
    nameInput.hidden = true;
    saveBtn.hidden = true;
    editBtn.hidden = false;

    showToast("✅ Profile name updated successfully!");
  } catch (err) {
    console.error(err);
    showToast("Error updating profile: " + err.message);
  }
});


// === Local Avatar Selection ===
avatarOptions?.querySelectorAll(".avatar-option").forEach((img) => {
  img.addEventListener("click", async () => {
    const selectedAvatar = img.getAttribute("src");

    try {
      // ✅ Save only in Firestore (not Auth)
      await setDoc(
        doc(db, "users", currentUser.uid),
        { photoURL: selectedAvatar },
        { merge: true }
      );

      // ✅ Update profile immediately
      profileAvatar.src = selectedAvatar;

      // ✅ Update dropdown avatar (if exists)
      const dropdownAvatar = document.getElementById("profilePic");
      if (dropdownAvatar) dropdownAvatar.src = selectedAvatar;

      showToast("Avatar updated successfully!");
    } catch (err) {
      console.error(err);
      showToast("Error saving avatar: " + err.message);
    }
  });
});


// displaying profile stats
async function calculateStats(uid) {
  // Count posts made by user
  const postsQuery = query(collection(db, "posts"), where("uid", "==", uid));
  const postsSnap = await getDocs(postsQuery);
  const postCount = postsSnap.size;

  // Count comments made by user
  const commentsQuery = query(collectionGroup(db, "comments"), where("uid", "==", uid));
  const commentsSnap = await getDocs(commentsQuery);
  const commentCount = commentsSnap.size;

  const stats = {
    posts: postCount,
    activity: postCount + commentCount,
    xp: commentCount // XP is only from comments (your rule)
  };

  await setDoc(doc(db, "userStats", uid), stats, { merge: true });
  return stats;
}

// Loads stats and keeps UI live-updating
async function loadStats(uid) {
  const statsRef = doc(db, "userStats", uid);

  const snap = await getDoc(statsRef);

  if (!snap.exists()) {
    // Stats do not exist yet → first time → calculate baseline
    const newStats = await calculateStats(uid);
    displayStats(newStats);
  } else {
    displayStats(snap.data());
  }

  // Real-time updates
  onSnapshot(statsRef, (docSnap) => {
    if (docSnap.exists()) displayStats(docSnap.data());
  });
}

// Display final stats in UI
function displayStats(stats) {
  document.getElementById("statPosts").textContent = stats.posts;
  document.getElementById("statActivity").textContent = stats.activity;
  document.getElementById("statXP").textContent = stats.xp;

  // Optional: Show rank + progress bar (see below)
  displayRank(stats.xp);
}