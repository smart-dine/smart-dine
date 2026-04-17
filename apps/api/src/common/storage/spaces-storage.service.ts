import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { extname } from 'node:path';
import { randomUUID } from 'node:crypto';

@Injectable()
export class R2StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.getOrThrow<string>('CLOUDFLARE_ACCOUNT_ID');
    const apiToken = this.configService.getOrThrow<string>('CLOUDFLARE_API_TOKEN');
    const endpoint = this.configService
      .getOrThrow<string>('CLOUDFLARE_S3_API_URL')
      .replace(/\/+$/, '');

    this.bucket = this.configService.getOrThrow<string>('CLOUDFLARE_R2_BUCKET');

    this.publicBaseUrl = this.configService
      .getOrThrow<string>('CLOUDFLARE_PUBLIC_BASE_URL')
      .replace(/\/+$/, '');

    this.client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId: accountId,
        secretAccessKey: apiToken,
      },
    });
  }

  async uploadRestaurantImage(restaurantId: string, file: Express.Multer.File) {
    const extension = this.safeExtension(file.originalname);
    const key = `restaurants/${restaurantId}/${Date.now()}-${randomUUID()}${extension}`;

    return await this.putImageObject({ key, file });
  }

  async uploadMenuItemImage(restaurantId: string, menuItemId: string, file: Express.Multer.File) {
    const extension = this.safeExtension(file.originalname);
    const key =
      `restaurants/${restaurantId}/menu-items/${menuItemId}/` +
      `${Date.now()}-${randomUUID()}${extension}`;

    return await this.putImageObject({ key, file });
  }

  async deleteObjectByKey(key: string) {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  private async putImageObject({ key, file }: { key: string; file: Express.Multer.File }) {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ContentLength: file.size,
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
    } catch (error: unknown) {
      throw new InternalServerErrorException('Failed to upload image to object storage', {
        cause: error,
      });
    }

    return {
      key,
      url: `${this.publicBaseUrl.replace(/\/+$/, '')}/${key}`,
    };
  }

  private safeExtension(originalName: string) {
    const extension = extname(originalName).toLowerCase();
    if (!extension || extension.length > 8) {
      return '.bin';
    }

    return extension;
  }
}
