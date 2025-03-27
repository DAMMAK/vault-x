import { extname } from 'path';

export class FileTypeUtil {
  private static readonly imageExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.bmp',
    '.webp',
    '.svg',
  ];
  private static readonly documentExtensions = [
    '.pdf',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.ppt',
    '.pptx',
    '.txt',
    '.rtf',
    '.odt',
  ];
  private static readonly videoExtensions = [
    '.mp4',
    '.avi',
    '.mov',
    '.wmv',
    '.flv',
    '.mkv',
    '.webm',
  ];
  private static readonly audioExtensions = [
    '.mp3',
    '.wav',
    '.ogg',
    '.aac',
    '.flac',
    '.m4a',
  ];
  private static readonly archiveExtensions = [
    '.zip',
    '.rar',
    '.7z',
    '.tar',
    '.gz',
    '.bz2',
  ];

  static getFileType(filename: string): string {
    const ext = extname(filename).toLowerCase();

    if (this.imageExtensions.includes(ext)) {
      return 'image';
    } else if (this.documentExtensions.includes(ext)) {
      return 'document';
    } else if (this.videoExtensions.includes(ext)) {
      return 'video';
    } else if (this.audioExtensions.includes(ext)) {
      return 'audio';
    } else if (this.archiveExtensions.includes(ext)) {
      return 'archive';
    } else {
      return 'other';
    }
  }

  static isImage(filename: string): boolean {
    const ext = extname(filename).toLowerCase();
    return this.imageExtensions.includes(ext);
  }

  static isDocument(filename: string): boolean {
    const ext = extname(filename).toLowerCase();
    return this.documentExtensions.includes(ext);
  }

  static isVideo(filename: string): boolean {
    const ext = extname(filename).toLowerCase();
    return this.videoExtensions.includes(ext);
  }

  static isAudio(filename: string): boolean {
    const ext = extname(filename).toLowerCase();
    return this.audioExtensions.includes(ext);
  }

  static isArchive(filename: string): boolean {
    const ext = extname(filename).toLowerCase();
    return this.archiveExtensions.includes(ext);
  }
}
