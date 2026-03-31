import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	server: {
		proxy: {
			"/api/v1/auth": {
				target: "http://127.0.0.1:4000",
				changeOrigin: true,
				secure: false,
			},
			"/soil": {
				target: "http://127.0.0.1:4000",
				changeOrigin: true,
				secure: false,
			},
			"/api/v1/soil": {
				target: "http://127.0.0.1:4000",
				changeOrigin: true,
				secure: false,
			},
			"/api/v1/reports": {
				target: "http://127.0.0.1:4000",
				changeOrigin: true,
				secure: false,
			},
			"/api/v1/settings": {
				target: "http://127.0.0.1:4000",
				changeOrigin: true,
				secure: false,
			},
			"/api/v1/users": {
				target: "http://127.0.0.1:4000",
				changeOrigin: true,
				secure: false,
			},
			"/reports": {
				target: "http://127.0.0.1:4000",
				changeOrigin: true,
				secure: false,
				rewrite: (path) => path.replace(/^\/reports/, '/api/v1/reports'),
			},
		},
	},
})
