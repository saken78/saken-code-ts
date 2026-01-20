/**
 * Sistem validasi untuk mencegah pengeditan file yang belum dibaca sebelumnya
 */

class FileAccessValidation {
  private accessedFiles: Set<string> = new Set();
  private validationEnabled: boolean = true;

  /**
   * Mencatat bahwa sebuah file telah diakses melalui read_file
   */
  recordFileAccess(filePath: string): void {
    if (!this.validationEnabled) return;

    this.accessedFiles.add(filePath);
    console.log(`File diakses: ${filePath}`);
  }

  /**
   * Memeriksa apakah file telah diakses sebelumnya
   */
  hasFileBeenAccessed(filePath: string): boolean {
    return this.accessedFiles.has(filePath);
  }

  /**
   * Validasi apakah file dapat diedit
   */
  validateFileEdit(
    filePath: string,
    isNewFile: boolean = false,
  ): { isValid: boolean; message: string } {
    if (!this.validationEnabled) {
      return { isValid: true, message: '' };
    }

    // Jika ini file baru, izinkan untuk dibuat
    if (isNewFile) {
      return { isValid: true, message: '' };
    }

    // Periksa apakah file telah diakses sebelumnya
    if (this.hasFileBeenAccessed(filePath)) {
      return { isValid: true, message: '' };
    } else {
      const message =
        `Validasi gagal: File ${filePath} belum diakses melalui read_file sebelum pengeditan.\n\n` +
        `Sebagai bagian dari kebijakan keamanan, file harus dibaca terlebih dahulu sebelum diedit.\n` +
        `Harap gunakan read_file untuk mengakses file ini sebelum melakukan pengeditan.`;
      return { isValid: false, message };
    }
  }

  /**
   * Mengaktifkan atau menonaktifkan validasi
   */
  setValidation(enabled: boolean): void {
    this.validationEnabled = enabled;
  }

  /**
   * Mendapatkan daftar semua file yang telah diakses
   */
  getAccessedFiles(): string[] {
    return Array.from(this.accessedFiles);
  }

  /**
   * Menghapus file dari daftar yang telah diakses
   */
  removeFileAccess(filePath: string): void {
    this.accessedFiles.delete(filePath);
  }

  /**
   * Mengosongkan semua catatan akses file
   */
  clearAccessHistory(): void {
    this.accessedFiles.clear();
  }
}

// Instansiasi singleton validator
const fileAccessValidator = new FileAccessValidation();

export { FileAccessValidation, fileAccessValidator };
