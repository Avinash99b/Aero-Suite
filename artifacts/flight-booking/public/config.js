// Runtime configuration, read before the app bundle loads.
//
// In development and in the Replit path-routed deployment this stays empty
// (build-time Vite `VITE_*` env vars are used instead — same-origin API).
//
// In a standalone Docker deployment, the frontend's nginx entrypoint
// (docker/frontend-entrypoint.sh) regenerates this exact file from container
// env vars (API_BASE_URL, CLERK_PUBLISHABLE_KEY, CLERK_PROXY_URL) so the
// already-built static bundle can be reconfigured per-environment without a
// rebuild.
window.__ENV__ = window.__ENV__ || {};
