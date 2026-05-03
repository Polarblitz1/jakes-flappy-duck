import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const getBasePath = (mode: string) => {
  if (mode !== "production") return "/";

  const repository = process.env.GITHUB_REPOSITORY;
  const repoName = repository?.split("/")[1];

  if (process.env.GITHUB_ACTIONS === "true" && repoName) {
    return repoName.endsWith(".github.io") ? "/" : `/${repoName}/`;
  }

  return "./";
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: getBasePath(mode),
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
