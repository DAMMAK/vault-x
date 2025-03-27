import { createHash } from 'crypto';

export class HashUtil {
  static generateFileHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  static generateChunkHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  static generateSignedUrl(
    fileId: string,
    userId: string,
    expirationTime: number,
    secret: string,
  ): string {
    const timestamp = Date.now();
    const expiry = timestamp + expirationTime;
    const dataToSign = `${fileId}:${userId}:${expiry}`;
    const signature = createHash('sha256')
      .update(dataToSign + secret)
      .digest('hex');

    return `${fileId}?sig=${signature}&exp=${expiry}&uid=${userId}`;
  }

  static verifySignedUrl(
    signedUrl: string,
    secret: string,
  ): { isValid: boolean; fileId?: string | null; userId: string | null } {
    try {
      const [fileId, params] = signedUrl.split('?');
      const urlParams = new URLSearchParams(params);

      const signature = urlParams.get('sig');
      const expiry = parseInt(urlParams.get('exp')!, 10);
      const userId = urlParams.get('uid');

      if (!signature || !expiry || !userId) {
        return { isValid: false, fileId: null, userId: null };
      }

      if (Date.now() > expiry) {
        return { isValid: false, fileId, userId };
      }

      const dataToSign = `${fileId}:${userId}:${expiry}`;
      const expectedSignature = createHash('sha256')
        .update(dataToSign + secret)
        .digest('hex');

      return {
        isValid: signature === expectedSignature,
        fileId,
        userId,
      };
    } catch (error) {
      return { isValid: false, fileId: null, userId: null };
    }
  }
}
