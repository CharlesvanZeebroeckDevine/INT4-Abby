import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    base: '/',
    server: {
        host: '0.0.0.0',
        port: 5173,
    },
    build: {
        rollupOptions: {
            input: {
                monitor: resolve(__dirname, 'src/monitor.html'),
                controller: resolve(__dirname, 'src/controller.html'),
            },
        },
    },
});