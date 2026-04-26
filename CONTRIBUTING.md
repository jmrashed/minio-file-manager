# Contributing to MinIO File Manager

First off, thank you for considering contributing to MinIO File Manager! It's people like you that make this project a great tool for the community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)
- [Development Workflow](#development-workflow)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Create a new branch for your feature or bug fix
4. Make your changes
5. Run tests and ensure code quality
6. Submit a pull request

## Development Setup

### Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later (or yarn/pnpm)
- **Git**
- **MinIO Server** (for local development and testing)

### Installation

```bash
# Clone your fork
git clone https://github.com/yourusername/minio-file-manager.git
cd minio-file-manager

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Start the development server
npm run dev
```

### Running MinIO Locally (Docker)

```bash
# Create data directory
mkdir -p ~/minio/data

# Run MinIO container
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name minio \
  -v ~/minio/data:/data \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin123" \
  quay.io/minio/minio server /data --console-address ":9001"
```

Access the MinIO Console at `http://127.0.0.1:9001`

## Project Structure

```
minio-file-manager/
├── src/
│   ├── components/          # React components
│   │   ├── FileManager.tsx  # Main file manager layout
│   │   ├── FileList.tsx     # File browser with grid/list view
│   │   ├── UploadModal.tsx  # Drag & drop upload dialog
│   │   ├── PreviewModal.tsx # File preview (images, videos, etc.)
│   │   ├── BucketSelector.tsx
│   │   ├── Breadcrumb.tsx
│   │   └── Login.tsx        # Authentication screen
│   ├── services/            # API and S3 client services
│   │   ├── minioClient.ts   # S3 client configuration
│   │   └── fileService.ts   # File operations (CRUD)
│   ├── hooks/               # Custom React hooks
│   │   ├── useBuckets.ts    # Bucket data fetching
│   │   ├── useFiles.ts      # File listing with React Query
│   │   └── useUpload.ts     # File upload mutation
│   ├── store/               # Zustand state management
│   │   └── appStore.ts      # Global UI state
│   ├── utils/               # Helper utilities
│   │   ├── formatters.ts    # Date, size, file type formatting
│   │   └── validators.ts    # Input validation
│   ├── App.tsx              # Root component with routing
│   ├── main.tsx             # Application entry point
│   └── index.css            # Tailwind CSS imports
├── public/                  # Static assets
├── .env.example            # Environment variables template
└── package.json
```

## Coding Standards

### TypeScript

- Use **strict TypeScript** with explicit types
- Avoid `any` type; use `unknown` when type is uncertain
- Define interfaces for all props, API responses, and data structures
- Use type guards for runtime type checking

```typescript
// Good
interface FileObject {
  key: string
  name: string
  size: number
  type: 'file' | 'folder'
}

// Avoid
const data: any = fetchData()
```

### React

- Use **functional components** with hooks
- Prefer **custom hooks** for data fetching and reusable logic
- Use Zustand for global state, React state for local UI state
- Implement proper error boundaries where applicable

### Styling

- Use **Tailwind CSS** utility classes
- Support both **light and dark themes** using `dark:` modifiers
- Follow existing component patterns for buttons, inputs, and cards
- Use the custom `.btn`, `.btn-primary`, `.btn-outline` classes defined in `index.css`

### File Organization

- One component per file (with few exceptions)
- Co-locate related components when they are small and tightly coupled
- Keep utility functions in `src/utils/`
- Keep API calls in `src/services/`

### Code Quality Tools

We use the following tools to maintain code quality:

```bash
# Run linter
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Run TypeScript type checking
npm run type-check
```

**Please run these before submitting a pull request.**

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (formatting, semicolons, etc.)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A performance improvement
- **test**: Adding or correcting tests
- **chore**: Changes to the build process or auxiliary tools

### Examples

```
feat(upload): add drag-and-drop file upload support

fix(preview): resolve video playback issue in Safari

docs(readme): update installation instructions

refactor(services): simplify error handling in fileService.ts
```

## Pull Request Process

1. **Update your branch** with the latest `main` branch before submitting
2. **Fill out the PR template** completely
3. **Link related issues** using `Fixes #123` or `Closes #456`
4. **Ensure all checks pass**:
   - TypeScript compilation (`npm run type-check`)
   - Linting (`npm run lint`)
   - Tests (`npm run test`)
5. **Request review** from maintainers
6. **Address review feedback** promptly
7. **Squash commits** if requested

### PR Title Format

Follow the same convention as commit messages:

```
feat: add folder creation dialog
fix: resolve authentication redirect loop
docs: add Docker deployment guide
```

## Reporting Bugs

Before creating a bug report, please:

1. **Search existing issues** to avoid duplicates
2. **Use the latest version** to see if the issue is already resolved
3. **Isolate the problem** to a minimal reproducible example

### Bug Report Template

```markdown
**Description**
A clear description of the bug.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., macOS 14, Windows 11, Ubuntu 22.04]
- Browser: [e.g., Chrome 120, Firefox 121]
- Node.js version: [e.g., 18.17.0]
- MinIO version: [e.g., RELEASE.2024-01-01]

**Additional Context**
Add any other context about the problem.
```

## Feature Requests

We welcome feature requests! Please:

1. **Check existing issues** for similar requests
2. **Describe the use case** clearly
3. **Explain why** this feature would be useful to most users
4. **Consider implementation complexity** - simpler is often better

### Feature Request Template

```markdown
**Feature Description**
A clear description of the feature.

**Use Case**
Describe the scenario where this would be useful.

**Proposed Solution**
Your ideas on how this could be implemented.

**Alternatives Considered**
Other approaches you've thought about.

**Additional Context**
Mockups, examples, or references.
```

## Development Workflow

### Adding a New Feature

1. Create a feature branch: `git checkout -b feat/feature-name`
2. Write the feature with appropriate tests
3. Update documentation if needed
4. Run quality checks: `npm run lint && npm run type-check && npm run test`
5. Commit with conventional commit messages
6. Push and create a pull request

### Fixing a Bug

1. Create a fix branch: `git checkout -b fix/bug-description`
2. Write a test that reproduces the bug (if applicable)
3. Fix the bug
4. Ensure the test passes
5. Submit a pull request referencing the issue

### Working with S3/MinIO APIs

When modifying file operations:

- Test against a real MinIO instance (Docker is fine)
- Ensure proper error handling for network failures
- Validate bucket names and file names using existing validators
- Use pre-signed URLs for security when accessing objects
- Handle CORS issues by testing cross-origin scenarios

## Questions?

Feel free to:

- Open a [GitHub Discussion](https://github.com/yourusername/minio-file-manager/discussions)
- Ask in an existing issue
- Reach out via email (see README.md)

Thank you for contributing! 🎉
