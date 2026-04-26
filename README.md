# MinIO File Manager

A React + Vite frontend for browsing and managing files in a MinIO or other S3-compatible object store directly from the browser.

![MinIO File Manager demo](./demo.png)

## Current Status

This README reflects the code currently in this repository as of April 27, 2026.

- Connection is handled in the browser through a login form.
- The app talks directly to MinIO using the AWS SDK for JavaScript v3.
- There is no backend API in this project.
- `npm run dev` and `npm run build` work in the current workspace.
- `npm test` does not currently work because the Jest environment setup is incomplete.

## What Works Today

### Implemented

- Login screen for entering MinIO endpoint, port, access key, secret key, and SSL preference
- Client-side session persistence via `localStorage`
- Bucket listing, bucket switching, bucket creation, and bucket deletion for empty buckets
- Folder navigation with breadcrumbs
- File and folder listing for the current bucket path
- Create empty files
- Create folders
- Multi-file upload through a modal with drag-and-drop support
- Upload queue with progress, pause, resume, error state, and completion state
- Single-file download with progress tracking
- Bulk download of selected items as a ZIP archive
- Folder download as a ZIP archive
- Download progress panel
- Single and bulk delete
- Recursive delete for folders by prefix
- Rename files and folders
- Duplicate files
- Copy, cut, paste, and move operations within the same bucket
- Client-side search in the current folder view
- File filtering by type
- Sorting by name, date, size, and type
- Grid and list views
- Multi-select with checkboxes
- Context menu for file and folder actions
- Keyboard shortcuts for `Delete`, `Ctrl/Cmd+A`, `F2`, and `Esc`
- Preview modal for images, video, audio, text, and PDF files
- Dark mode toggle
- Incremental file loading with automatic and manual “load more” behavior

### Partially Implemented

- Upload queue persistence: transfers are visible in-app, but they do not survive a full page reload
- Download progress accuracy for ZIP-style downloads is file-count based rather than byte-accurate
- Environment configuration: `.env` files exist, but the runtime connection is driven by the login form rather than env values

### Not Implemented In The UI

- Cross-bucket paste/move
- True multipart uploads for very large files
- Server-side/global search across all bucket contents
- Upload retry controls

## Authentication And Connection Model

The app does not authenticate against a custom backend.

Instead, the login form stores the following values in `localStorage` under `minio-credentials`:

- `endpoint`
- `port`
- `accessKey`
- `secretKey`
- `useSSL`

Those values are then used by [`src/services/minioClient.ts`](/var/www/html/file-manager/src/services/minioClient.ts) to construct an AWS `S3Client` with:

- a MinIO endpoint built from protocol, host, and port
- `region: 'us-east-1'`
- `forcePathStyle: true`

This means the browser must be able to reach your MinIO server directly, and your MinIO CORS policy must allow requests from the Vite dev server or deployed frontend origin.

## Feature Audit

| Area | Status | Notes |
| --- | --- | --- |
| Authentication | Working, client-side only | Credentials are stored locally and are not validated before redirecting to the file manager |
| Bucket management | Working with limits | Listing, switching, creation, and deletion are available; deleting a bucket only works when it is empty |
| File upload | Working with limits | Upload modal, queue, progress, and pause/resume are available; uploads are single-request browser uploads rather than multipart transfers |
| File download | Working | Single download, selected ZIP download, folder ZIP download, and transfer progress UI are implemented |
| File delete | Working | Single and bulk delete are available; folder deletion resolves object keys by prefix |
| File rename | Working | Implemented with copy-then-delete |
| Move / copy / cut / paste | Working with limits | Implemented within the same bucket; cross-bucket paste is blocked |
| Create folder / file | Working | Prompt-based UI in the main header |
| Search | Working | Client-side filtering within the currently loaded folder only |
| Preview | Working | Images, video, audio, text, and PDF files can be previewed in the modal |
| Breadcrumbs | Working | Bucket root and nested folder navigation are implemented |
| Grid / list view | Working | Toggle is in the file toolbar |
| Context menu | Working | Right-click actions are available for files and folders |
| Theme toggle | Working | Light/dark mode is toggled in the header |
| Pagination | Working | Incremental loading is implemented through `useInfiniteQuery` plus automatic/manual load-more behavior |

## Project Structure

### `src/`

```text
src/
├── App.tsx                        # Router, React Query provider, global toaster
├── index.css                      # Tailwind layers and shared button/input styles
├── main.tsx                       # React entry point
├── components/
│   ├── Breadcrumb.tsx             # Bucket/path breadcrumb navigation
│   ├── BucketSelector.tsx         # Bucket dropdown
│   ├── FileList.tsx               # Main file browser, search, sorting, actions, grid/list rendering
│   ├── FileManager.tsx            # Main authenticated screen and layout
│   ├── Login.tsx                  # Connection form for MinIO credentials
│   ├── PreviewModal.tsx           # Preview modal for images, video, audio, text, and PDF files
│   ├── TransferPanel.tsx          # Upload/download progress panel with queue controls
│   └── UploadModal.tsx            # Drag-and-drop upload modal
├── hooks/
│   ├── useBuckets.ts              # React Query hook for bucket listing
│   ├── useFiles.ts                # Infinite query hook for paginated object listing
│   └── useUpload.ts               # Upload queue helpers and upload request runner
├── services/
│   ├── fileService.ts             # S3/MinIO bucket, object, preview, and transfer helpers
│   └── minioClient.ts             # Browser-side S3 client creation from localStorage credentials
├── store/
│   └── appStore.ts                # Zustand store for selection, theme, clipboard, context menu, and transfer state
└── utils/
    ├── formatters.ts              # File type detection and date/size formatting
    └── validators.ts              # Validation helpers not currently wired into the UI
```

### `public/`

There is currently no `public/` directory in this repository.

### Root Files

```text
.env.example       # Example environment variables
.env.local         # Local environment file used in this workspace
.eslintrc.cjs      # ESLint configuration
.gitignore         # Git ignore rules
CHANGELOG.md       # Project changelog
demo.png           # Demo image used in the README
index.html         # Vite HTML entry
jest.config.js     # Jest configuration
package.json       # Scripts and dependencies
package-lock.json  # Locked dependency tree
postcss.config.mjs # PostCSS config
tailwind.config.js # Tailwind theme/content config
tsconfig.json      # App TypeScript config
tsconfig.node.json # Node-side TypeScript config for tooling
vite.config.ts     # Vite config and dev server settings
```

## Installed Dependencies

### In Active Use

- `@aws-sdk/client-s3`
- `@aws-sdk/s3-request-presigner`
- `@heroicons/react`
- `@tanstack/react-query`
- `bytes`
- `date-fns`
- `jszip`
- `react`
- `react-dom`
- `react-dropzone`
- `react-hot-toast`
- `react-router-dom`
- `zustand`
- `vite`
- `@vitejs/plugin-react`
- `tailwindcss`
- `postcss`
- `autoprefixer`
- `typescript`
- `eslint`
- `jest`

### Installed But Not Currently Used By App Code

- `@aws-sdk/lib-storage`
- `axios`
- `clsx`
- `lucide-react`
- `mime-types`
- `@vitejs/plugin-react-swc`
- `@typescript-eslint/eslint-plugin`
- `eslint-plugin-react-hooks`
- `eslint-plugin-react-refresh`

### Test Tooling Gaps

The repository also references test tooling that is not fully wired up:

- `jest.config.js` points to `src/setupTests.ts`, but that file does not exist
- `npm test` currently fails because `jest-environment-jsdom` is not installed

## Environment Configuration

Two env files are present:

- `.env.example`
- `.env.local`

Current variables found there:

```env
VITE_MINIO_ENDPOINT
VITE_MINIO_PORT
VITE_MINIO_USE_SSL
VITE_MINIO_ACCESS_KEY
VITE_MINIO_SECRET_KEY
VITE_MINIO_BUCKET
VITE_MINIO_REGION
VITE_APP_NAME
VITE_APP_VERSION
VITE_UPLOAD_CHUNK_SIZE
VITE_MAX_FILE_SIZE
```

### What Is Actually Required Today

For the current implementation, the app primarily relies on the values entered in the login form, not on `.env.local`.

Practical runtime requirements are:

1. A reachable MinIO or S3-compatible endpoint
2. A valid access key and secret key
3. Correct protocol choice via the `Use SSL` checkbox

### What The Code Actually Consumes

- `vite.config.ts` exposes `VITE_MINIO_ENDPOINT`, `VITE_MINIO_PORT`, and `VITE_MINIO_USE_SSL`
- No application component currently reads `import.meta.env`
- The login form does not prefill from env values
- Access key, secret key, bucket, region, app metadata, and upload-size env vars are not currently used by the runtime code

Because of that, copying `.env.example` to `.env.local` is optional for the current UI flow.

## Setup

### Prerequisites

- Node.js 18+
- npm 9+
- A running MinIO or S3-compatible server reachable from the browser

### Install

```bash
npm install
```

Note: this repository was audited in a workspace that already had `node_modules` present. The app itself runs correctly with the installed dependency set shown above, but `npm install` was not re-verified from a completely clean checkout during this documentation pass.

### Start The Dev Server

```bash
npm run dev
```

What was verified during the audit:

- the dev server starts successfully
- if port `5173` is already in use, Vite will automatically move to the next available port
- in the current workspace, Vite started on `http://localhost:5175/`

### Build

```bash
npm run build
```

This succeeds in the current codebase.

## Using The App

1. Start the frontend with `npm run dev`.
2. Open the app in the browser.
3. Enter your MinIO endpoint, port, access key, secret key, and SSL preference on the login screen.
4. After login, choose a bucket from `BucketSelector`.
5. Navigate folders with `Breadcrumb`.
6. Manage objects through `FileList` and `UploadModal`.

## Current Limitations

- Credentials are stored in `localStorage`, so this is not suitable as-is for high-security or multi-user production use
- The login screen does not verify credentials before redirecting
- Bucket deletion only succeeds when the bucket is empty
- Search is client-side and only applies to the currently loaded folder
- Large folders still depend on repeated paginated loading instead of a virtualized list
- Cross-bucket paste is intentionally blocked
- Uploads use single browser PUT requests rather than multipart upload, so very large files may be less resilient
- Upload/download transfer state is in-memory only and resets on full page refresh
- ZIP download progress is approximate because it tracks per-file completion rather than archive byte generation
- The production bundle still triggers a Vite chunk-size warning for the main JavaScript bundle
- Automated tests are not currently runnable without fixing the Jest environment setup

## Troubleshooting

### The Login Form Succeeds But File Operations Fail

The login screen only stores values locally. It does not test the MinIO connection during sign-in.

Check:

- endpoint hostname
- port
- SSL setting
- MinIO credentials
- browser access to the MinIO server
- MinIO CORS configuration

### `npm run dev` Starts On A Different Port

This is expected when `5173` is already in use. Vite will try the next available port automatically.

### Previews Do Not Open For Some Files

Current preview support is limited:

- images: inline preview
- video: inline preview
- audio: inline preview
- text: fetched and rendered in the modal
- PDF: rendered inline in an `iframe`
- other file types: download fallback

### Bucket Deletion Fails

Bucket deletion is wired into the UI now, but MinIO/S3 will reject deletion when the bucket still contains objects. Empty the bucket first, then retry.

### Transfer Panel Resets After Refresh

Current upload and download progress is tracked in app state only. Reloading the page clears the visible queue even though already-finished uploads/downloads remain in storage.

### `npm test` Fails Immediately

Current known causes:

- missing `jest-environment-jsdom`
- missing `src/setupTests.ts`

### The App Cannot Reach MinIO

Because the browser connects directly to MinIO, make sure:

- the MinIO host is reachable from the browser
- the protocol matches the server configuration
- CORS allows your frontend origin
- the access key has permission to list buckets and manage objects

## API Integration Overview

The project uses the AWS SDK v3 directly from the frontend.

### Main Integration Points

- [`src/services/minioClient.ts`](/var/www/html/file-manager/src/services/minioClient.ts): builds the shared `S3Client`
- [`src/services/fileService.ts`](/var/www/html/file-manager/src/services/fileService.ts): wraps bucket and object operations
- [`src/hooks/useBuckets.ts`](/var/www/html/file-manager/src/hooks/useBuckets.ts): bucket listing via React Query
- [`src/hooks/useFiles.ts`](/var/www/html/file-manager/src/hooks/useFiles.ts): object listing via React Query
- [`src/hooks/useUpload.ts`](/var/www/html/file-manager/src/hooks/useUpload.ts): upload mutation

### S3 Operations Currently Used

- `ListBucketsCommand`
- `ListObjectsV2Command`
- `PutObjectCommand`
- `GetObjectCommand`
- `CopyObjectCommand`
- `DeleteObjectCommand`
- `DeleteObjectsCommand`
- `CreateBucketCommand`
- `DeleteBucketCommand`

Pre-signed download URLs are generated client-side with `@aws-sdk/s3-request-presigner`.

## Screenshots

Current demo image included in the repository:

![Current demo view](./demo.png)

Add screenshots for these existing UI surfaces when available:

- `Login` screen
- `FileManager` main layout
- `BucketSelector`
- `Breadcrumb`
- `FileList` grid view
- `FileList` list view
- `FileList` context menu
- `UploadModal`
- `PreviewModal`
- `TransferPanel`

## Development Notes

- `README.md` now documents the actual implementation instead of planned features
- `CHANGELOG.md` tracks documentation alignment work
- `validators.ts` contains helpers that are not currently connected to the UI

## License

MIT. See [`LICENSE`](/var/www/html/file-manager/LICENSE).
