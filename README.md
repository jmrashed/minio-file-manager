# 📁 MinIO File Manager

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.x-61dafb.svg)](https://reactjs.org/)
[![MinIO](https://img.shields.io/badge/MinIO-S3%20Compatible-c72a48.svg)](https://min.io/)

A modern, open-source file management web application built with React and MinIO (S3-compatible storage). Upload, download, preview, and manage your files with an intuitive interface - all running on your local infrastructure.

![File Manager Screenshot](https://via.placeholder.com/800x400?text=File+Manager+Screenshot)

## ✨ Features

- 🔐 **Secure Authentication** - Login with MinIO credentials
- 📁 **Bucket Management** - Create, browse, and delete buckets
- 📤 **File Upload** - Drag & drop or click to upload files
- 📥 **File Download** - Download files with pre-signed URLs
- 👁️ **File Preview** - Preview images, videos, and text files
- 🗑️ **Delete Operations** - Remove files and folders
- 📋 **Copy & Move** - Organize files across folders
- 🔍 **Search** - Find files quickly by name
- 📊 **Metadata Viewer** - View file size, type, and last modified date
- 🎨 **Modern UI** - Responsive design with dark/light theme
- ⚡ **Fast Performance** - Direct uploads/downloads via pre-signed URLs

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Tailwind CSS** - Styling
- **AWS SDK for JavaScript** - S3 API client
- **React Router v6** - Navigation
- **React Query** - Data fetching & caching
- **Zustand** - State management
- **React Dropzone** - Drag & drop uploads
- **Axios** - HTTP requests

### Backend (MinIO)
- **MinIO Server** - S3-compatible object storage
- **Docker** - Containerization (optional)

## 📋 Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Docker (optional, for running MinIO)
- MinIO server running locally

## 🚀 Getting Started

### 1. Start MinIO Server

Using Docker (recommended):

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

Or download and run MinIO directly from [min.io/download](https://min.io/download)

### 2. Create a Bucket

Access the MinIO console at `http://127.0.0.1:9001` and:
1. Login with credentials (`minioadmin` / `minioadmin123`)
2. Click "Create Bucket"
3. Name your bucket (e.g., `myfiles`)

### 3. Install & Run the File Manager

```bash
# Clone the repository
git clone https://github.com/jmrashed/minio-file-manager.git
cd minio-file-manager

# Install dependencies
npm install

# Create environment configuration
cp .env.example .env.local

# Start the development server
npm run dev
```

The application will open at `http://localhost:5173`

### 4. Configure Connection

Edit `.env.local` with your MinIO settings:

```env
VITE_MINIO_ENDPOINT=localhost
VITE_MINIO_PORT=9000
VITE_MINIO_USE_SSL=false
VITE_MINIO_ACCESS_KEY=minioadmin
VITE_MINIO_SECRET_KEY=minioadmin123
VITE_MINIO_BUCKET=myfiles
```

## 📁 Project Structure

```
minio-file-manager/
├── src/
│   ├── components/          # React components
│   │   ├── FileList.tsx     # File browser grid/list view
│   │   ├── UploadModal.tsx  # File upload dialog
│   │   ├── PreviewModal.tsx # File preview
│   │   ├── BucketSelector.tsx
│   │   └── Breadcrumb.tsx
│   ├── services/            # API services
│   │   ├── minioClient.ts   # S3 client configuration
│   │   └── fileService.ts   # File operations
│   ├── hooks/               # Custom React hooks
│   │   ├── useFiles.ts
│   │   └── useUpload.ts
│   ├── store/               # Zustand state store
│   │   └── appStore.ts
│   ├── utils/               # Helper functions
│   │   ├── formatters.ts
│   │   └── validators.ts
│   ├── App.tsx
│   └── main.tsx
├── public/                  # Static assets
├── .env.example            # Environment variables template
├── package.json
├── README.md
└── LICENSE
```

## 💻 Usage Examples

### Uploading Files

```typescript
// Example: Upload a file using pre-signed URL
import { uploadFile } from './services/fileService';

const handleUpload = async (file: File) => {
  const url = await getPresignedUploadUrl(`uploads/${file.name}`);
  await fetch(url, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type }
  });
};
```

### Listing Files

```typescript
// Example: List all files in a bucket
import { listObjects } from './services/fileService';

const files = await listObjects('myfiles', 'folder/prefix');
files.forEach(file => {
  console.log(`${file.name} - ${file.size} bytes`);
});
```

### Downloading Files

```typescript
// Example: Generate download URL
const downloadUrl = await getPresignedDownloadUrl('path/to/file.pdf');
window.open(downloadUrl, '_blank');
```

## 🧪 Development

### Running Tests

```bash
npm run test
```

### Building for Production

```bash
npm run build
```

### Docker Deployment (Full Stack)

```dockerfile
# Dockerfile for the React app
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🔒 Security Considerations

- **Pre-signed URLs**: Files are never streamed through your backend server
- **CORS Configuration**: Ensure proper CORS settings in MinIO
- **Environment Variables**: Never commit `.env.local` to version control
- **HTTPS**: Use SSL in production environments
- **Access Keys**: Use limited-scope access keys when possible

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and development process.

## 📝 License

Distributed under the MIT License. See `LICENSE` file for more information.

## 🙏 Acknowledgments

- [MinIO](https://min.io/) for their excellent S3-compatible storage
- [React](https://reactjs.org/) team for the amazing framework
- [AWS SDK](https://aws.amazon.com/sdk-for-javascript/) for JavaScript
- All open-source contributors

## 📧 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/jmrashed/minio-file-manager/issues)
- **Discussions**: [GitHub Discussions](https://github.com/jmrashed/minio-file-manager/discussions)
- **Email**: your.email@example.com

## ⭐ Star History

If you find this project useful, please give it a star! ⭐ 