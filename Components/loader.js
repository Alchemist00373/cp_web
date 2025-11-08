document.addEventListener("DOMContentLoaded", () => {
  showLoader();

  // Simulate fade-out after full page load
  window.addEventListener("load", () => {
    hideLoader();
  });
});

function showLoader() {
  const loader = document.getElementById("authLoader");
  if (loader) loader.classList.remove("fade-out");
}

function hideLoader() {
  const loader = document.getElementById("authLoader");
  if (!loader) return;
  loader.classList.add("fade-out");
  setTimeout(() => loader.remove(), 4000);
}
