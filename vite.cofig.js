import { defineConfig } from "vite";
import { resolve, basename } from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function copyStaticFoldersPlugin() {
  return {
    name: "copy-static-folders",
    closeBundle() {
      const staticFolders = [
        resolve(__dirname, "images"),
        resolve(__dirname, "css"),
        resolve(__dirname, "Auth"),
        resolve(__dirname, "Components"),
        resolve(__dirname, "html"),
        resolve(__dirname, "Firebaseconfig"),
      ];

      const distDir = resolve(__dirname, "dist");

      staticFolders.forEach(srcDir => {
        if (!fs.existsSync(srcDir)) {
          console.warn(`⚠️ Source folder not found: ${srcDir}`);
          return;
        }

        const destDir = resolve(distDir, basename(srcDir));
        fs.mkdirSync(destDir, { recursive: true });
        fs.cpSync(srcDir, destDir, { recursive: true });
        console.log(`✅ Copied ${srcDir} → ${destDir}`);
      });
    }
  };
}

export default defineConfig({
  base: "./",
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
  plugins: [copyStaticFoldersPlugin()],
  server: {
    open: true,
  },
});