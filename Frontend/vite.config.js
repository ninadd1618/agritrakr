import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	// Load env file based on `mode` in the current working directory.
	// Set the third parameter to '' to load env files from relative path.
	const env = loadEnv(mode, process.cwd(), '')
	
	// Use environment variable or fallback to localhost for development
	const backendUrl = env.VITE_API_URL || 'http://127.0.0.1:4000'
	
	return {
		plugins: [react()],
		server: {
			proxy: {
				"/api/v1/auth": {
					target: backendUrl,
					changeOrigin: true,
					secure: false,
				},
				"/soil": {
					target: backendUrl,
					changeOrigin: true,
					secure: false,
				},
				"/api/v1/soil": {
					target: backendUrl,
					changeOrigin: true,
					secure: false,
				},
				"/api/v1/reports": {
					target: backendUrl,
					changeOrigin: true,
					secure: false,
				},
				"/api/v1/settings": {
					target: backendUrl,
					changeOrigin: true,
					secure: false,
				},
				"/api/v1/users": {
					target: backendUrl,
					changeOrigin: true,
					secure: false,
				},
				"/api/v1/devices": {
					target: backendUrl,
					changeOrigin: true,
					secure: false,
				},
				"/api/v1/oee": {
					target: backendUrl,
					changeOrigin: true,
					secure: false,
				},
				"/api/v1/data": {
					target: backendUrl,
					changeOrigin: true,
					secure: false,
				},
				"/reports": {
					target: backendUrl,
					changeOrigin: true,
					secure: false,
					rewrite: (path) => path.replace(/^\/reports/, '/api/v1/reports'),
				},
			},
		},
	}
})
