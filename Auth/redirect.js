setTimeout(() => {
  try {
    window.location.href = "../cp_web/html/home.html";
  } catch (err) {
    console.error("Redirect failed:", err);
  }
}, 2100);
