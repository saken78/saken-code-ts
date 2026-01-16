# Tech Stack - Qwen Code

## Programming Language
- **TypeScript**: Digunakan secara luas di seluruh basis kode untuk menyediakan pengetikan statis dan meningkatkan kualitas kode.

## Backend Framework
- **Node.js (>=20.0.0)**: Platform utama untuk menjalankan aplikasi Qwen Code di sisi server.

## Frontend Framework
- **React**: Digunakan untuk membangun antarmuka pengguna berbasis terminal melalui framework Ink.

## Architecture
- **Monorepo**: Proyek menggunakan struktur monorepo dengan beberapa workspace untuk mengelola komponen-komponen berbeda.
- **Workspaces**:
  - `packages/cli`: Komponen antarmuka baris perintah utama
  - `packages/core`: Komponen inti yang menyediakan fungsionalitas utama
  - `packages/sdk-typescript`: SDK TypeScript untuk akses programatik ke Qwen Code
  - `packages/test-utils`: Utilitas untuk pengujian

## Build Tools
- **esbuild**: Digunakan sebagai alat bundling untuk mempercepat proses build.
- **npm**: Digunakan sebagai package manager dan untuk menjalankan skrip build.

## Testing
- **Vitest**: Framework pengujian utama untuk menjalankan unit test dan integrasi test.

## Linting & Formatting
- **ESLint**: Digunakan untuk menegakkan aturan dan standar kode.
- **Prettier**: Digunakan untuk formatting kode secara otomatis.

## CLI Interface
- **Ink**: Framework React-based untuk membangun antarmuka pengguna berbasis terminal yang interaktif.

## Protocols & Integration
- **MCP (Model Context Protocol)**: Protokol untuk integrasi dengan layanan dan alat eksternal.

## Additional Dependencies
- **Undici**: HTTP client untuk komunikasi jaringan.
- **node-pty**: Library untuk interaksi terminal.
- **OpenAI SDK**: Untuk integrasi dengan API OpenAI.
- **Google GenAI SDK**: Untuk integrasi dengan layanan Google GenAI.
- **Anthropic SDK**: Untuk integrasi dengan API Anthropic.