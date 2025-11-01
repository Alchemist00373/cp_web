import { defineConfig } from "vite";
import { resolve } from "path";
import fs from "fs";

export default defineConfig({
  base: "./", // keep relative paths
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        login: resolve(__dirname, "html/login.html"),
        signup: resolve(__dirname, "html/sign-up.html"),
        home: resolve(__dirname, "html/home.html"),
        forum: resolve(__dirname, "html/forum.html"),
        profile: resolve(__dirname, "html/profile.html"),
        about: resolve(__dirname, "html/about.html"),
      },
    },
  },
  plugins: [
    {
      name: "copy-static-assets",
      closeBundle() {
        const foldersToCopy = ["Auth", "Firebaseconfig", "css","Components","images"];
        for (const folder of foldersToCopy) {
          const src = resolve(__dirname, folder);
          const dest = resolve(__dirname, "dist", folder);

          if (fs.existsSync(src)) {
            fs.mkdirSync(dest, { recursive: true });
            fs.cpSync(src, dest, { recursive: true });
            console.log(`✅ Copied ${folder} → dist/${folder}`);
          } else {
            console.warn(`⚠️ Folder not found: ${folder}`);
          }
        }
      },
    },
  ],
  server: {
    open: true,
  },
});
