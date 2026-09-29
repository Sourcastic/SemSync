import { defineConfig } from "vite"
import wasm from "vite-plugin-wasm"

// Automerge ships a WASM module, and loading it involves a top-level
// `await`. vite-plugin-wasm handles the `.wasm` import; setting the
// build target to esnext means modern browsers can run the top-level
// await natively, so we don't need vite-plugin-top-level-await too
// (which has had repeated breakage against newer @swc/core releases).
export default defineConfig({
  plugins: [wasm()],
  build: {
    target: "esnext",
  },
  esbuild: {
    target: "esnext",
  },
  optimizeDeps: {
    esbuildOptions: { target: "esnext" },
    exclude: ["@automerge/automerge-wasm", "@automerge/automerge"],
  },
  worker: {
    format: "es",
    plugins: () => [wasm()],
  },
})
