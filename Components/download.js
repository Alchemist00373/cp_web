document.addEventListener("DOMContentLoaded", () => {
  const downloadBtn = document.getElementById("downloadApkBtn");
  if (!downloadBtn) return;

  downloadBtn.addEventListener("click", () => {
    const apkUrl = "https://drive.google.com/uc?export=download&id=1rmeg0qbg61cO2bK_ZCu0zYPjbVJ5OJX2";

    const a = document.createElement("a");
    a.href = apkUrl;
    a.setAttribute("download", "ThousandShores.apk");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });
});
