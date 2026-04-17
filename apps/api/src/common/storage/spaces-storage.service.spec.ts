import { InternalServerErrorException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { R2StorageService } from './spaces-storage.service';

describe('R2StorageService', () => {
  const sendMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    sendMock.mockReset();
    (S3Client as unknown as jest.Mock).mockImplementation(() => ({
      send: sendMock,
    }));
  });

  const createConfigService = (values: Record<string, string | undefined>): ConfigService =>
    ({
      get: jest.fn((key: string) => values[key]),
      getOrThrow: jest.fn((key: string) => {
        const value = values[key];
        if (value === undefined) {
          throw new Error(`Missing config key: ${key}`);
        }
        return value;
      }),
    }) as unknown as ConfigService;

  const createImageFile = (): Express.Multer.File =>
    ({
      fieldname: 'image',
      originalname: 'hero.JPG',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 11,
      destination: '',
      filename: '',
      path: '',
      buffer: Buffer.from('image-bytes'),
      stream: undefined as unknown as NodeJS.ReadableStream,
    }) as Express.Multer.File;

  it('configures S3 client using R2 endpoint and credentials', () => {
    const configService = createConfigService({
      CLOUDFLARE_ACCOUNT_ID: 'acc_123',
      CLOUDFLARE_API_TOKEN: 'token_abc',
      CLOUDFLARE_S3_API_URL: 'https://acc_123.r2.cloudflarestorage.com',
      CLOUDFLARE_R2_BUCKET: 'smartdine-assets',
      CLOUDFLARE_PUBLIC_BASE_URL: 'https://cdn.smartdine.app',
    });

    void new R2StorageService(configService);

    expect(S3Client).toHaveBeenCalledWith({
      region: 'auto',
      endpoint: 'https://acc_123.r2.cloudflarestorage.com',
      credentials: {
        accessKeyId: 'acc_123',
        secretAccessKey: 'token_abc',
      },
    });
  });

  it('uploads an image and returns key and public URL', async () => {
    sendMock.mockResolvedValueOnce({});

    const configService = createConfigService({
      CLOUDFLARE_ACCOUNT_ID: 'acc_123',
      CLOUDFLARE_API_TOKEN: 'token_abc',
      CLOUDFLARE_S3_API_URL: 'https://acc_123.r2.cloudflarestorage.com',
      CLOUDFLARE_R2_BUCKET: 'smartdine-assets',
      CLOUDFLARE_PUBLIC_BASE_URL: 'https://cdn.smartdine.app/',
    });

    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1710000000000);

    try {
      const service = new R2StorageService(configService);
      const file = createImageFile();

      const uploaded = await service.uploadRestaurantImage('restaurant-1', file);

      expect(uploaded.key).toMatch(/^restaurants\/restaurant-1\/1710000000000-.*\.jpg$/);
      expect(uploaded.url).toBe(`https://cdn.smartdine.app/${uploaded.key}`);

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'smartdine-assets',
          Key: uploaded.key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ContentLength: file.size,
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );

      const putObjectCommandMock = PutObjectCommand as unknown as jest.MockedFunction<
        typeof PutObjectCommand
      >;
      const firstCall = putObjectCommandMock.mock.calls.at(0);
      expect(firstCall).toBeDefined();

      const [commandInput] = firstCall as [Record<string, unknown>];
      expect(commandInput).not.toHaveProperty('ACL');
    } finally {
      nowSpy.mockRestore();
    }
  });

  it('throws InternalServerErrorException when upload fails', async () => {
    sendMock.mockRejectedValueOnce(new Error('upload failed'));

    const configService = createConfigService({
      CLOUDFLARE_ACCOUNT_ID: 'acc_123',
      CLOUDFLARE_API_TOKEN: 'token_abc',
      CLOUDFLARE_S3_API_URL: 'https://acc_123.r2.cloudflarestorage.com',
      CLOUDFLARE_R2_BUCKET: 'smartdine-assets',
      CLOUDFLARE_PUBLIC_BASE_URL: 'https://cdn.smartdine.app',
    });

    const service = new R2StorageService(configService);

    await expect(
      service.uploadMenuItemImage('restaurant-1', 'menu-1', createImageFile()),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('deletes an object by key', async () => {
    sendMock.mockResolvedValueOnce({});

    const configService = createConfigService({
      CLOUDFLARE_ACCOUNT_ID: 'acc_123',
      CLOUDFLARE_API_TOKEN: 'token_abc',
      CLOUDFLARE_S3_API_URL: 'https://acc_123.r2.cloudflarestorage.com',
      CLOUDFLARE_R2_BUCKET: 'smartdine-assets',
      CLOUDFLARE_PUBLIC_BASE_URL: 'https://cdn.smartdine.app',
    });

    const service = new R2StorageService(configService);

    await service.deleteObjectByKey('restaurants/r1/sample.jpg');

    expect(DeleteObjectCommand).toHaveBeenCalledWith({
      Bucket: 'smartdine-assets',
      Key: 'restaurants/r1/sample.jpg',
    });
  });
});

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(),
  PutObjectCommand: jest.fn((input: unknown) => ({ input })),
  DeleteObjectCommand: jest.fn((input: unknown) => ({ input })),
}));
