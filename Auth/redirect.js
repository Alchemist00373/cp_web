setTimeout(() => {
  try {
    window.location.href = "../html/home.html";
  } catch (err) {
    console.error("Redirect failed:", err);
  }
}, 5000);