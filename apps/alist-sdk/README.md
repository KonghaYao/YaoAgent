# AList SDK for TypeScript

A TypeScript SDK for interacting with AList API, providing a simple and type-safe way to manage your AList instance.

## Features

- 🔐 Authentication management
- 📁 File system operations
- 📊 Task management
- 🔍 File search
- 📤 File upload
- 📥 Offline download
- 🚀 Batch operations

## Installation

```bash
npm install alist-sdk
# or
yarn add alist-sdk
# or
pnpm add alist-sdk
```

## Usage

### Basic Setup

```typescript
import { AlistAuth, AlistFS, AlistTask, AlistPublic } from 'alist-sdk';

// Initialize auth
const auth = new AlistAuth();
await auth.login('admin', 'your-password');

// Initialize other services
const fs = new AlistFS(auth);
const task = new AlistTask(auth);
const publicApi = new AlistPublic(auth);
```

### File System Operations

```typescript
// List files
const files = await fs.list('/path/to/directory');

// Create directory
await fs.mkdir('/path/to/new/directory');

// Upload file
const file = new File(['content'], 'test.txt', { type: 'text/plain' });
await fs.upload('/path/to/upload', file);

// Search files
const searchResults = await fs.search('/path', 'keyword');

// Batch operations
await fs.batchRename('/path', [{ src_name: 'old.txt', new_name: 'new.txt' }]);
await fs.regexRename('/path', 'pattern', 'replacement');
await fs.recursiveMove('/src', '/dst');
```

### Task Management

```typescript
// List tasks
const tasks = await task.list();

// Cancel task
await task.cancel('task-id');

// Delete task
await task.delete('task-id');
```

### Public File Access

```typescript
// Get public file info
const fileInfo = await publicApi.get('/path/to/file');

// Get public directory listing
const dirListing = await publicApi.list('/path/to/directory');
```

## API Documentation

### AlistAuth

- `login(username: string, password: string): Promise<void>`
- `logout(): Promise<void>`

### AlistFS

- `list(path: string, password?: string): Promise<ListResponse>`
- `mkdir(path: string): Promise<BaseResponse>`
- `rename(path: string, name: string): Promise<BaseResponse>`
- `move(src_dir: string, dst_dir: string, names: string[]): Promise<BaseResponse>`
- `copy(src_dir: string, dst_dir: string, names: string[]): Promise<BaseResponse>`
- `remove(path: string, names: string[]): Promise<BaseResponse>`
- `upload(path: string, file: File, asTask?: boolean): Promise<UploadResponse>`
- `search(parent: string, keywords: string, scope?: 0 | 1 | 2, page?: number, per_page?: number, password?: string): Promise<SearchResponse>`
- `dirs(path: string, password?: string, force_root?: boolean): Promise<DirsResponse>`
- `batchRename(src_dir: string, rename_objects: Array<{ src_name: string; new_name: string }>): Promise<BaseResponse>`
- `regexRename(src_dir: string, src_name_regex: string, new_name_regex: string): Promise<BaseResponse>`
- `recursiveMove(src_dir: string, dst_dir: string): Promise<BaseResponse>`
- `removeEmptyDirectory(src_dir: string): Promise<BaseResponse>`
- `addOfflineDownload(path: string, urls: string[], tool?: "aria2" | "SimpleHttp" | "qBittorrent", delete_policy?: "delete_on_upload_succeed" | "delete_on_upload_failed" | "delete_never" | "delete_always"): Promise<OfflineDownloadResponse>`

### AlistTask

- `list(page?: number, per_page?: number): Promise<TaskListResponse>`
- `cancel(id: string): Promise<BaseResponse>`
- `delete(id: string): Promise<BaseResponse>`

### AlistPublic

- `get(path: string, password?: string): Promise<PublicFileResponse>`
- `list(path: string, password?: string, page?: number, per_page?: number, refresh?: boolean): Promise<PublicListResponse>`

## Development

### Prerequisites

- Node.js >= 16.0.0
- npm/yarn/pnpm

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   # or
   pnpm install
   ```

### Available Scripts

- `npm run build` - Build the SDK
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
