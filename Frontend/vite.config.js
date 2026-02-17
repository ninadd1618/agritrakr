import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	server: {
		proxy: {
			"/api/v1/auth": {
				target: "http://localhost:4000",
				changeOrigin: true,
				secure: false,
			},
			"/soil": {
				target: "http://localhost:4000",
				changeOrigin: true,
				secure: false,
			},
			"/api/v1/soil": {
				target: "http://localhost:4000",
				changeOrigin: true,
				secure: false,
			},
			"/api/v1/reports": {
				target: "http://localhost:4000",
				changeOrigin: true,
				secure: false,
			},
			"/reports": {
				target: "http://localhost:4000",
				changeOrigin: true,
				secure: false,
				rewrite: (path) => path.replace(/^\/reports/, '/api/v1/reports'),
			},
		},
	},
})
