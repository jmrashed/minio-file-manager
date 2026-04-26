# Architecture

## Overview

MinIO File Manager is a single-page application (SPA) built with React and TypeScript that provides a web-based interface for managing files stored in MinIO (S3-compatible object storage). The architecture follows a modern client-side pattern with a service layer for S3 operations, global state management, and a component-based UI.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (Client)                       │
├─────────────────────────────────────────────────────────────┤
│  React Application                                           │
│  ├── Components (UI)                                        │
│  ├── State Management (Zustand)                            │
│  ├── Data Fetching (React Query)                           │
│  ├── Services (S3 Operations)                              │
│  └── Utilities (formatters, validators)                    │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ AWS SDK (S3 API)
                         │ HTTPS/HTTP
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  MinIO Server (S3 Compatible)               │
│  ─── Object Storage (Buckets, Objects, Metadata)           │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend Framework
- **React 18.2** - Component-based UI library
- **TypeScript 5.2** - Type-safe JavaScript

### Build & Development
- **Vite 7.1** - Fast build tool and dev server
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks

### Styling
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **PostCSS 8.4** - CSS processing
- **Autoprefixer** - Vendor prefixing

### State Management
- **Zustand 4.5** - Lightweight global state store
- **React Query 5.20** - Server state, caching, and synchronization

### AWS & Storage
- **@aws-sdk/client-s3 3.525** - S3 client
- **@aws-sdk/s3-request-presigner 3.525** - Pre-signed URL generation
- **@aws-sdk/lib-storage 3.1037** - Multipart upload support

### UI Components & Icons
- **@heroicons/react 2.2** - SVG icon library
- **lucide-react 0.330** - Additional icon set
- **react-hot-toast 2.4** - Toast notifications

### File Handling
- **react-dropzone 14.2** - Drag & drop file uploads
- **jszip 3.10** - ZIP archive creation for bulk downloads
- **mime-types 2.1** - MIME type detection
- **bytes 3.1** - Human-readable file size formatting

### Date/Time
- **date-fns 3.3** - Date formatting utilities

### Routing
- **react-router-dom 6.22** - Client-side routing

### HTTP Client
- **axios 1.6** - HTTP requests (used alongside AWS SDK)

### Testing
- **Jest 29.7** - Test runner
- **@testing-library/react 14.2** - React testing utilities
- **@testing-library/user-event 14.5** - User interaction testing

## Project Structure

```
src/
├── components/            # React components
│   ├── FileManager.tsx    # Main file manager container component
│   ├── FileList.tsx       # File browsing with grid/list views
│   ├── UploadModal.tsx    # File upload dialog
│   ├── PreviewModal.tsx   # File preview popup
│   ├── Breadcrumb.tsx     # Navigation breadcrumbs
│   ├── BucketSelector.tsx # Bucket selection dropdown
│   └── Login.tsx          # Authentication form
│
├── services/              # API and external service integrations
│   ├── minioClient.ts     # S3 client singleton configuration
│   └── fileService.ts     # File/bucket operations (S3 API wrapper)
│
├── hooks/                 # Custom React Query hooks
│   ├── useFiles.ts        # Fetch files in a bucket/prefix
│   ├── useBuckets.ts      # Fetch available buckets
│   └── useUpload.ts       # Upload files mutation
│
├── store/                 # Global state management (Zustand)
│   └── appStore.ts        # Application-wide state (selection, view, queue)
│
├── utils/                 # Utility functions
│   ├── formatters.ts      # Date, file size, type detection
│   └── validators.ts      # Input validation helpers
│
├── App.tsx                # Root component with routing
├── main.tsx               # Application entry point
└── index.css              # Global styles and Tailwind configuration
```

## Core Architecture Patterns

### 1. Service Layer Pattern

All S3 operations are encapsulated in `src/services/fileService.ts`. This provides a clean API for components and isolates AWS SDK usage.

```typescript
// Example service interface
export interface FileObject {
  key: string
  name: string
  size: number
  lastModified: Date
  type: 'file' | 'folder'
  contentType?: string
}

// Service methods
export const listObjects = async (bucket, prefix)
export const uploadFile = async (bucket, key, file)
export const deleteObjects = async (bucket, keys)
export const copyFile = async (bucket, sourceKey, destKey)
```

The S3 client singleton (`minioClient.ts`) manages connection configuration based on stored credentials.

### 2. Custom Hooks Pattern

Data fetching is handled through custom React Query hooks that provide type-safe, cached data:

```typescript
export const useFiles = (bucket: string, path: string) => {
  return useQuery({
    queryKey: ['files', bucket, path],
    queryFn: () => listObjects(bucket, path),
    enabled: !!bucket,
    staleTime: 30 * 1000
  })
}
```

This pattern ensures:
- Automatic cache invalidation on mutations
- Background refetching
- Loading and error state handling
- Configurable staleness

### 3. Global State with Zustand

Global UI state is managed in `appStore.ts` for features that span multiple components:

- **Selection** - Multi-file selection with range support
- **View Mode** - Grid vs list view preference
- **Upload Queue** - In-progress upload tracking
- **Download Progress** - Ongoing download status
- **Clipboard** - Copy/cut/paste state
- **Context Menu** - Right-click menu position
- **Sorting/Filtering** - User preferences

The store uses Zustand's `devtools` middleware for Redux DevTools integration.

### 4. Authentication Flow

Authentication is simple credential-based:

1. User enters MinIO credentials in Login component
2. Credentials are stored in `localStorage` as JSON:
   ```typescript
   {
     endpoint: string
     port: number
     accessKey: string
     secretKey: string
     useSSL: boolean
   }
   ```
3. S3 client is lazily initialized on first use
4. Protected routes check for credentials on mount
5. Logout clears credentials and redirects to login

Credentials never leave the browser; all S3 operations are direct client-to-MinIO.

### 5. Pre-Signed URL Strategy

File transfers use pre-signed URLs for security and performance:

- **Uploads**: Generate a pre-signed PUT URL, then upload directly from browser to MinIO
- **Downloads**: Generate a pre-signed GET URL, then download directly from MinIO

This approach:
- Avoids proxying large files through the app server
- Provides time-limited access
- Maintains MinIO authentication without exposing secret keys

## Component Architecture

### FileManager (Container Component)

The `FileManager` component orchestrates the main UI:
- Manages `currentBucket` and `currentPath` state
- Fetches buckets and files via custom hooks
- Handles folder creation, file creation, and modal visibility
- Renders `BucketSelector`, `Breadcrumb`, `FileList`, and `UploadModal`

### FileList (Presentational Component)

`FileList` displays files in grid or list view:
- Implements sorting, filtering, and search
- Handles file selection (single, multi, range with Shift)
- Keyboard shortcuts (Delete, Ctrl+A, F2, Escape)
- Context menu for file operations
- Inline renaming
- Preview generation for images/videos

State comes from `appStore` and `useFiles` hook.

### UploadModal

Handles drag-and-drop file uploads:
- Uses `react-dropzone` for file selection
- Shows file list with sizes
- Uses `useUpload` mutation for async upload
- Supports multiple concurrent uploads

### PreviewModal

Displays file previews based on MIME type:
- Images: `<img>` tag
- Videos: `<video>` with controls
- Audio: `<audio>` with controls
- Others: Download prompt or message

Generates pre-signed URLs on mount.

## Data Flow

```
User Action
   ↓
Component Handler
   ↓
Service Call (fileService)
   ↓
S3 Client (minioClient)
   ↓
Pre-signed URL / Direct API call
   ↓
MinIO Server
   ↓
Response / Success
   ↓
React Query Cache Update
   ↓
UI Re-render (automatic)
```

## Caching Strategy

React Query handles all server state caching:

| Query Key | Data | Stale Time | Purpose |
|-----------|------|------------|---------|
| `['buckets']` | Bucket list | 5 min | Bucket selector |
| `['files', bucket, path]` | File list | 30 sec | File browser |

Cache is automatically invalidated on:
- Successful uploads
- File deletions
- Folder creation
- Renames/moves

Manual refetching available via refresh button.

## Error Handling

Errors are surfaced through:
- **React Query error states** - Displayed in UI (loading skeletons, empty states)
- **Toast notifications** - Success/error feedback via `react-hot-toast`
- **Console logging** - Debug information in development

Authentication errors trigger automatic logout.

## Security Considerations

1. **Client-side only**: No backend server; all operations are browser → MinIO
2. **Pre-signed URLs**: Temporary credentials for file access
3. **No credential transmission to third parties**: AWS SDK connects directly to configured MinIO endpoint
4. **localStorage**: Credentials stored locally (consider sessionStorage or secure storage for production)
5. **CORS**: MinIO must be configured to allow the app's origin

## Environment Configuration

Vite injects environment variables at build time through `vite-plugin-environment`:

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_MINIO_ENDPOINT` | MinIO server hostname | `localhost` |
| `VITE_MINIO_PORT` | MinIO API port | `9000` |
| `VITE_MINIO_USE_SSL` | Use HTTPS connection | `false` |

**Note**: Access keys and secrets are NOT stored in env vars; they're user-provided at login.

## Build & Deployment

### Development
```bash
npm run dev        # Start Vite dev server on :5173
npm run type-check # TypeScript compilation check
npm run lint       # ESLint check
```

### Production Build
```bash
npm run build      # Creates optimized dist/ folder
npm run preview    # Preview production build locally
```

Output is static files that can be served by any web server (nginx, Apache, CDN).

### Docker
A `Dockerfile` and `docker-compose.yml` can be added for containerized deployment. The app itself is static; MinIO runs separately.

## Performance Optimizations

1. **Virtualization ready**: FileList can handle thousands of items (pagination via S3 continuation tokens available)
2. **Image lazy loading**: Uses browser `loading="lazy"` attribute
3. **Preview URL caching**: Pre-signed URLs stored in state to avoid regeneration
4. **Debounced search**: Not implemented but trivial to add
5. **React Query caching**: Prevents redundant S3 API calls
6. **Tailwind purging**: Unused CSS removed in production build

## Limitations & Future Improvements

- **No folder upload**: Drag-and-drop of folders not yet implemented
- **No multipart upload**: Large files (>5GB) require chunked upload
- **No thumbnail generation**: Images rely on MinIO to serve original
- **No versioning**: MinIO versioning not exposed in UI
- **No sharing**: Pre-signed URL sharing not implemented
- **No backend**: Credentials stored in localStorage (use secure session storage in production)

## Development Guidelines

### Adding a New File Operation

1. Add method to `src/services/fileService.ts`
2. Export from the module
3. Create a custom hook in `src/hooks/` if needed
4. Use in component, connecting to `appStore` for UI state

### Modifying State

Add to `src/store/appStore.ts`:
```typescript
interface AppState {
  newState: Type
  setNewState: (value: Type) => void
}
```

### Styling

Use Tailwind utility classes. For custom styles:
1. Add to `src/index.css` in the appropriate `@layer` block
2. Keep component-specific styles inline or in `className`

Never use CSS-in-JS or external stylesheet libraries.

### TypeScript

All files must be strictly typed. Avoid `any` except for edge cases (e.g., AWS SDK objects). Enable `strict: true` in `tsconfig.json`.

## Conventions

- **File naming**: PascalCase for components (`FileList.tsx`), camelCase for utilities (`formatters.ts`)
- **Exports**: Named exports for everything except default component exports
- **Imports**: Absolute imports via path aliases (`@/components/FileList`)
- **Component structure**: Function components with hooks at top, JSX at bottom
- **Error handling**: Use try/catch with `toast.error()` in UI layer
- **Async operations**: Prefer `mutateAsync` for sequential operations, `mutate` for fire-and-forget

## Dependencies

Version ranges are pinned in `package.json`. Update with:
```bash
npm update         # Minor/patch updates
npm install pkg@x.y.z # Specific version
```

Always test after dependency updates.
