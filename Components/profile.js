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
  if (!newName) return alert("Please enter a valid name.");

  try {
    await updateProfile(currentUser, { displayName: newName });
    await setDoc(
      doc(db, "users", currentUser.uid),
      { displayName: newName, email: currentUser.email },
      { merge: true }
    );

    displayNameEl.textContent = newName;
    nameInput.hidden = true;
    saveBtn.hidden = true;
    editBtn.hidden = false;

    alert("Profile updated successfully!");
  } catch (err) {
    console.error(err);
    alert("Error updating profile: " + err.message);
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

      alert("Avatar updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Error saving avatar: " + err.message);
    }
  });
});

// === Stats Handling ===
async function recalculatePostCount(uid) {
  const postsQuery = query(collection(db, "posts"), where("uid", "==", uid));
  const postsSnap = await getDocs(postsQuery);
  const postCount = postsSnap.size;

  let commentCount = 0;
  const allPostsSnap = await getDocs(collection(db, "posts"));
  for (const postDoc of allPostsSnap.docs) {
    const commentsSnap = await getDocs(collection(db, "posts", postDoc.id, "comments"));
    commentsSnap.forEach((comment) => {
      if (comment.data().uid === uid) commentCount++;
    });
  }

  const totalXP = postCount * 10 + commentCount * 2;
  const totalActivity = postCount + commentCount;

  const statsRef = doc(db, "userStats", uid);
  await setDoc(
    statsRef,
    { posts: postCount, xp: totalXP, activity: totalActivity },
    { merge: true }
  );

  return { postCount, totalXP, totalActivity };
}

async function loadStats(uid) {
  const docRef = doc(db, "userStats", uid);
  onSnapshot(docRef, async (docSnap) => {
    const actual = await recalculatePostCount(uid);
    if (docSnap.exists()) {
      document.getElementById("statPosts").textContent = actual.postCount;
      document.getElementById("statActivity").textContent = actual.totalActivity;
      document.getElementById("statXP").textContent = actual.totalXP;
    } else {
      await setDoc(docRef, { posts: 0, activity: 0, xp: 0 });
      document.getElementById("statPosts").textContent = 0;
      document.getElementById("statActivity").textContent = 0;
      document.getElementById("statXP").textContent = 0;
    }
  });
}
