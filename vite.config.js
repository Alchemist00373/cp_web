import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
    root: '.',
    plugins: [
        viteStaticCopy({
            targets: [
                { src: 'html', dest: '' },         
                { src: 'images', dest: '' },       
                { src: 'Firebaseconfig', dest: '' },
                { src: 'Auth', dest: '' },
                { src: 'Components', dest: '' },
                { src: 'css', dest: '' }
            ]
        })
    ],
    build: {
        outDir: 'dist'
    }
});
