import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import wasm from "vite-plugin-wasm"

// Automerge ships a WASM module, and loading it involves a top-level
// `await`. vite-plugin-wasm handles the `.wasm` import; setting the
// build target to esnext means modern browsers can run the top-level
// await natively, so we don't need vite-plugin-top-level-await too
// (which has had repeated breakage against newer @swc/core releases).
export default defineConfig({
  plugins: [react(), wasm()],
  build: {
    target: "esnext",
    rollupOptions: {
      input: {
        main: "index.html",
        designSystem: "design-system.html",
      },
    },
  },
  esbuild: {
    target: "esnext",
  },
  optimizeDeps: {
    esbuildOptions: { target: "esnext" },
    exclude: ["@automerge/automerge-wasm", "@automerge/automerge"],
    // Pre-bundle React + Radix together at startup; discovering them lazily makes
    // Vite re-optimize mid-session and load two copies of React.
    include: [
      "react",
      "react-dom/client",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
    ],
  },
  worker: {
    format: "es",
    plugins: () => [wasm()],
  },
})
