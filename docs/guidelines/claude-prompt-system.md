# Sistem Claude Prompt dalam Qwen Code

## Ringkasan

Sistem Claude prompt telah berhasil diintegrasikan ke dalam Qwen Code, memberikan pengguna fleksibilitas untuk beralih antara berbagai mode prompt sesuai kebutuhan.

## Mode Prompt Tersedia

### 1. Mode Qwen (Default)

- Mode standar Qwen Code
- Menggunakan prompt asli Qwen
- Diaktifkan secara default saat membuka Qwen Code

### 2. Mode Claude

- Menggunakan prompt dari Claude yang dioptimalkan untuk efisiensi dan kualitas output
- Diaktifkan dengan perintah `/prompt claude` atau `npm run claude`

### 3. Mode Gabungan (Combined)

- Menggabungkan prompt Claude dan Qwen untuk manfaat terbaik dari kedua sistem
- Diaktifkan dengan perintah `/prompt combined` atau `npm run combined`

## Cara Menggunakan

### Melalui Perintah Interaktif

1. Jalankan Qwen Code: `npm start`
2. Gunakan salah satu perintah berikut:
   - `/prompt qwen` - Kembali ke mode Qwen standar
   - `/prompt claude` - Beralih ke mode Claude
   - `/prompt combined` - Beralih ke mode gabungan

### Melalui Skrip NPM

- `npm run claude` - Langsung membuka Qwen Code dalam mode Claude
- `npm run qwen` - Langsung membuka Qwen Code dalam mode Qwen standar
- `npm run combined` - Langsung membuka Qwen Code dalam mode gabungan

## Fungsi Inti

- `getCombinedSystemPrompt()` - Menggabungkan dan mengatur prompt berdasarkan mode
- `setPromptMode()` - Mengatur mode prompt saat runtime
- `getPromptMode()` - Mendapatkan mode prompt saat ini

## File-file Utama

- `packages/core/src/prompts/claude-prompts.ts` - Fungsi-fungsi utama
- `packages/cli/src/commands/prompt-command.ts` - Handler perintah `/prompt`
- `packages/core/src/index.ts` - Ekspor fungsi-fungsi Claude prompt
