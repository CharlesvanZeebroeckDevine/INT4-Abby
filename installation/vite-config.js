import { defineConfig } from 'vite';
import { resolve } from 'path';
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
    base: '/INT4-Abby/',
    server: {
        host: '0.0.0.0',
        port: 3000,
    },
    plugins: [mkcert()],
    build: {
        rollupOptions: {
            input: {
                monitor: resolve(__dirname, 'src/monitor.html'),
                controller: resolve(__dirname, 'src/controller.html'),
            },
        },
    },
});
