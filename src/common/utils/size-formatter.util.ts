export class SizeFormatterUtil {
  static formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  static parseSize(sizeString: string): number {
    const units = {
      B: 1,
      KB: 1024,
      MB: 1024 * 1024,
      GB: 1024 * 1024 * 1024,
      TB: 1024 * 1024 * 1024 * 1024,
    };

    const matches = sizeString.match(/^(\d+(?:\.\d+)?)\s*([A-Za-z]+)$/);
    if (!matches) {
      throw new Error(`Invalid size format: ${sizeString}`);
    }

    const size = parseFloat(matches[1]);
    const unit = matches[2].toUpperCase();

    if (!units[unit]) {
      throw new Error(`Unknown size unit: ${unit}`);
    }

    return size * units[unit];
  }
}
