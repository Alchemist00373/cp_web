import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  getDocs,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// === Firebase Config ===
import { firebaseConfig } from "../Firebaseconfig/firebasecon.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// === Toast ===
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// === Confirm Modal ===
function customConfirm(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById("modalOverlay");
    const msg = document.getElementById("modalMessage");
    const confirmBtn = document.getElementById("modalConfirm");
    const cancelBtn = document.getElementById("modalCancel");
    msg.textContent = message;
    modal.classList.remove("hidden");

    const cleanup = (result) => {
      modal.classList.add("hidden");
      confirmBtn.removeEventListener("click", onConfirm);
      cancelBtn.removeEventListener("click", onCancel);
      resolve(result);
    };

    const onConfirm = () => cleanup(true);
    const onCancel = () => cleanup(false);

    confirmBtn.addEventListener("click", onConfirm);
    cancelBtn.addEventListener("click", onCancel);
  });
}

// === Dynamic Edit Modal ===
function openEditModal(type, title = "", body = "") {
  return new Promise((resolve) => {
    const modal = document.getElementById("editModal");
    const titleInput = document.getElementById("editTitle");
    const bodyInput = document.getElementById("editBody");
    const saveBtn = document.getElementById("editSave");
    const cancelBtn = document.getElementById("editCancel");
    const modalTitle = document.getElementById("editModalTitle");

    if (type === "post") {
      modalTitle.textContent = "Edit Post";
      titleInput.style.display = "block";
      titleInput.value = title || "";
      bodyInput.placeholder = "Edit your post content...";
    } else {
      modalTitle.textContent = "Edit Comment";
      titleInput.style.display = "none";
      bodyInput.placeholder = "Edit your comment...";
    }

    bodyInput.value = body || "";
    modal.classList.remove("hidden");

    const cleanup = (data) => {
      modal.classList.add("hidden");
      saveBtn.removeEventListener("click", onSave);
      cancelBtn.removeEventListener("click", onCancel);
      resolve(data);
    };

    const onSave = () => {
      const newTitle = titleInput.value.trim();
      const newBody = bodyInput.value.trim();
      if (type === "post" && (!newTitle || !newBody)) {
        showToast("Both fields are required.", "error");
        return;
      }
      if (type === "comment" && !newBody) {
        showToast("Comment cannot be empty.", "error");
        return;
      }
      cleanup({ newTitle, newBody });
    };

    const onCancel = () => cleanup(null);

    saveBtn.addEventListener("click", onSave);
    cancelBtn.addEventListener("click", onCancel);
  });
}

// === UI Elements ===
const postsList = document.getElementById("postsList");
const postTemplate = document.getElementById("postTemplate");
const newPostToggle = document.getElementById("newPostToggle");
const newPostSection = document.getElementById("newPostSection");
const newPostForm = document.getElementById("newPostForm");

let currentUser = null;

document.addEventListener("DOMContentLoaded", () => initializeForum());

function initializeForum() {
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
      newPostToggle.style.display = "block";
    } else {
      newPostToggle.style.display = "none";
      newPostSection.hidden = true;
    }
  });

  newPostToggle.addEventListener("click", () => {
    if (!currentUser) return showToast("Please log in to create a post.", "error");
    newPostSection.hidden = !newPostSection.hidden;
  });

  document.getElementById("cancelNew")?.addEventListener("click", () => {
    newPostSection.hidden = true;
    newPostForm.reset();
  });

  newPostForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("postTitle").value.trim();
    const body = document.getElementById("postBody").value.trim();
    if (!title || !body) return showToast("Please fill in both fields.", "error");
    if (!currentUser) return showToast("You must be logged in to post.", "error");

    try {
      await addDoc(collection(db, "posts"), {
        title,
        body,
        author: currentUser.displayName || currentUser.email,
        uid: currentUser.uid,
        createdAt: serverTimestamp()
      });
      newPostForm.reset();
      newPostSection.hidden = true;
      showToast("Post created successfully!", "success");
    } catch {
      showToast("Failed to create post.", "error");
    }
  });

  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    renderPosts(posts);
  });
}

// === Render Posts ===
function renderPosts(list) {
  postsList.innerHTML = "";
  if (!list.length) {
    postsList.innerHTML = `<p style="color:var(--muted)">No posts yet!</p>`;
    return;
  }

  list.forEach((p) => {
    const clone = postTemplate.content.cloneNode(true);
    const card = clone.querySelector(".post-card");
    card.dataset.postId = p.id;

    const titleEl = clone.querySelector(".post-title");
    const bodyEl = clone.querySelector(".post-body");
    const authorEl = clone.querySelector(".post-author");
    const timeEl = clone.querySelector(".post-time");
    const editBtn = clone.querySelector(".edit-post");
    const delBtn = clone.querySelector(".delete-post");

    titleEl.textContent = p.title;
    bodyEl.textContent = p.body;
    authorEl.textContent = p.author || "Anonymous";
    timeEl.textContent = new Date(p.createdAt?.toMillis?.() || Date.now()).toLocaleString();

    const toggleBtn = clone.querySelector(".toggle-comments");
    const commentsSection = clone.querySelector(".comments");
    const commentForm = clone.querySelector(".comment-form");
    const commentList = clone.querySelector(".comment-list");
    const commentInput = clone.querySelector(".comment-input");

    if (!currentUser) {
      commentForm.innerHTML = `<p style="color:var(--muted);text-align:center;">🔒 Login to comment.</p>`;
    }

    toggleBtn.addEventListener("click", () => {
      if (!currentUser) return showToast("Please log in to view comments.", "error");
      commentsSection.classList.toggle("show");
    });

    const commentsQuery = query(collection(db, "posts", p.id, "comments"), orderBy("createdAt", "asc"));
    onSnapshot(commentsQuery, (snapshot) => {
      commentList.innerHTML = "";
      snapshot.forEach((docSnap) => {
        const c = docSnap.data();
        const commentDiv = document.createElement("div");
        commentDiv.className = "comment";
        commentDiv.innerHTML = `
          <strong>${c.author || "Anonymous"}</strong><br>
          <span class="comment-text">${c.text}</span><br>
          <small>${new Date(c.createdAt?.toMillis?.() || Date.now()).toLocaleString()}</small>
        `;

        if (currentUser && c.uid === currentUser.uid) {
          const editC = document.createElement("button");
          editC.textContent = "Edit";
          editC.className = "btn ghost";
          const delC = document.createElement("button");
          delC.textContent = "Delete";
          delC.className = "btn ghost";
          commentDiv.appendChild(editC);
          commentDiv.appendChild(delC);

          editC.addEventListener("click", async () => {
            const result = await openEditModal("comment", "", c.text);
            if (result) {
              await updateDoc(doc(db, "posts", p.id, "comments", docSnap.id), { text: result.newBody });
              showToast("Comment updated!", "success");
            }
          });

          delC.addEventListener("click", async () => {
            if (await customConfirm("Delete this comment?")) {
              await deleteDoc(doc(db, "posts", p.id, "comments", docSnap.id));
              showToast("Comment deleted.", "info");
            }
          });
        }

        commentList.appendChild(commentDiv);
      });
      if (!snapshot.size)
        commentList.innerHTML = `<div style="color:var(--muted); font-size:.9rem;">No comments yet</div>`;
    });

    commentForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!currentUser) return showToast("Please log in to comment.", "error");
      const text = commentInput.value.trim();
      if (!text) return showToast("Comment cannot be empty.", "error");

      await addDoc(collection(db, "posts", p.id, "comments"), {
        text,
        author: currentUser.displayName || currentUser.email,
        uid: currentUser.uid,
        createdAt: serverTimestamp()
      });
      commentInput.value = "";
      showToast("Comment added!", "success");
    });

    if (currentUser && p.uid === currentUser.uid) {
      editBtn.style.display = "inline-block";
      delBtn.style.display = "inline-block";

      editBtn.addEventListener("click", async () => {
        const result = await openEditModal("post", p.title, p.body);
        if (result) {
          await updateDoc(doc(db, "posts", p.id), {
            title: result.newTitle,
            body: result.newBody
          });
          showToast("Post updated!", "success");
        }
      });

      delBtn.addEventListener("click", async () => {
        if (await customConfirm("Delete this post and all comments?")) {
          const commentsSnapshot = await getDocs(collection(db, "posts", p.id, "comments"));
          await Promise.all(
            commentsSnapshot.docs.map((c) =>
              deleteDoc(doc(db, "posts", p.id, "comments", c.id))
            )
          );
          await deleteDoc(doc(db, "posts", p.id));
          showToast("Post deleted.", "info");
        }
      });
    }

    postsList.appendChild(clone);
  });
}

   // === Search (client-side) ===
    document.getElementById("search")?.addEventListener("input", async (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const snapshot = await getDocs(collection(db, "posts"));
        const filtered = snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter((p) =>
                (p.title + " " + p.body + " " + p.author)
                    .toLowerCase()
                    .includes(searchTerm)
            );
        renderPosts(filtered);
    });

    