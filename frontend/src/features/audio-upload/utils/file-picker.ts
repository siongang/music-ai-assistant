/**
 * File Picker Utility
 * 
 * Programmatically trigger file input dialog.
 */

export interface FilePickerOptions {
  accept?: string;
  multiple?: boolean;
}

/**
 * Open file picker dialog
 * 
 * @param options - File picker options
 * @returns Promise that resolves with selected files
 * 
 * @example
 * ```ts
 * const files = await openFilePicker({ accept: 'audio/*', multiple: true });
 * for (const file of files) {
 *   await uploadFile(file);
 * }
 * ```
 */
export function openFilePicker(options: FilePickerOptions = {}): Promise<File[]> {
  return new Promise((resolve, reject) => {
    // Create hidden file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = options.accept || 'audio/mpeg,audio/wav,.mp3,.wav';
    input.multiple = options.multiple || false;
    input.style.display = 'none';

    // Handle file selection
    input.onchange = () => {
      const files = Array.from(input.files || []);
      document.body.removeChild(input);
      resolve(files);
    };

    // Handle cancel
    input.oncancel = () => {
      document.body.removeChild(input);
      resolve([]);
    };

    // Trigger picker
    document.body.appendChild(input);
    input.click();
  });
}

/**
 * Validate file is an audio file
 * 
 * @param file - File to validate
 * @returns true if file is valid audio
 */
export function isAudioFile(file: File): boolean {
  const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav'];
  const validExtensions = ['.mp3', '.wav'];
  
  return (
    validTypes.includes(file.type) ||
    validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
  );
}

/**
 * Format file size for display
 * 
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
