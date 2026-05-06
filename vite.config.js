import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Change 'coachella-predictor' to match your GitHub repo name
export default defineConfig({
  plugins: [react()],
  base: '/Coachella2027/',
})
