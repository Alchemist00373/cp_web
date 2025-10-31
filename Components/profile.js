// ✅ Import initialized Firebase services from your config file
import { auth, db, app } from "../Firebaseconfig/firebasecon.js";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const displayNameEl = document.getElementById("displayName");
const displayEmailEl = document.getElementById("displayEmail");
const profileAvatar = document.getElementById("profileAvatar");
const avatarUpload = document.getElementById("avatarUpload");
const uploadLabel = document.getElementById("uploadLabel");
const nameInput = document.getElementById("nameInput");
const editBtn = document.getElementById("editProfileBtn");
const saveBtn = document.getElementById("saveProfileBtn");

let currentUser;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../html/login.html";
    return;
  }

  currentUser = user;

  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (userDoc.exists()) {
    const data = userDoc.data();
    displayNameEl.textContent = data.displayName || "Adventurer";
    displayEmailEl.textContent = data.email || "Unknown";
    if (data.photoURL) profileAvatar.src = data.photoURL;
  } else {
    displayNameEl.textContent = user.displayName || "Unknown Adventurer";
    displayEmailEl.textContent = user.email;
    if (user.photoURL) profileAvatar.src = user.photoURL;
  }

  enableEditMode();
  await loadStats(user.uid);
});

function enableEditMode() {
  uploadLabel.hidden = false;
  editBtn.hidden = false;
}

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
    await setDoc(doc(db, "users", currentUser.uid), {
      displayName: newName,
      email: currentUser.email,
    }, { merge: true });

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

avatarUpload?.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    alert("Please upload an image smaller than 2MB.");
    return;
  }

  try {
    const storageRef = ref(storage, `avatars/${currentUser.uid}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    await updateProfile(currentUser, { photoURL: url });
    await setDoc(doc(db, "users", currentUser.uid), { photoURL: url }, { merge: true });

    // 🔥 Update on-page avatar
    profileAvatar.src = url;

    // 🔥 Update dropdown avatar (if present)
    const dropdownAvatar = document.getElementById("profilePic");
    if (dropdownAvatar) dropdownAvatar.src = url;

    // 🔥 Sync to other open tabs/pages
    localStorage.setItem("updatedAvatarURL", url);
    setTimeout(() => localStorage.removeItem("updatedAvatarURL"), 3000);

    alert("Avatar updated successfully!");
  } catch (err) {
    console.error(err);
    alert("Error uploading avatar: " + err.message);
  }
});

async function loadStats(uid) {
  try {
    const docRef = doc(db, "userStats", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const stats = docSnap.data();
      document.getElementById("statPosts").textContent = stats.posts || 0;
      document.getElementById("statActivity").textContent = stats.activity || 0;
      document.getElementById("statXP").textContent = stats.xp || 0;
    }
  } catch (err) {
    console.error("Error loading stats:", err);
  }
}
