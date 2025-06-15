import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    base: '/INT4-Abby/',
    server: {
        host: '10.0.0.50',
        port: 3000,
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
