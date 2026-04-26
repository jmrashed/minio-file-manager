# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed

- Rewrote `README.md` to match the code that is actually present in the repository.
- Documented the real browser-side MinIO authentication flow based on `localStorage` credentials.
- Corrected the feature list to reflect what currently works, what is partial, and what is not wired into the UI.
- Added an accurate project structure section, including the fact that there is currently no `public/` directory.
- Documented the current env var situation, including that the runtime app does not presently consume most values from `.env.local`.
- Added current limitations and troubleshooting notes for direct browser-to-MinIO access, preview gaps, dynamic Vite dev ports, and broken Jest setup.
- Recorded current build/dev status: `npm run dev` and `npm run build` work, while `npm test` currently fails because the Jest environment is incomplete.
