import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class ObjectStorageService {
  private readonly client: S3Client | null;
  private readonly bucket: string;

  constructor(config: ConfigService) {
    this.bucket = config.get<string>('OBJECT_STORAGE_BUCKET', 'trifusion-files');
    const region = config.get<string>('AWS_REGION') || config.get<string>('OBJECT_STORAGE_REGION');
    const endpoint = config.get<string>('AWS_ENDPOINT_URL_S3') || config.get<string>('OBJECT_STORAGE_ENDPOINT');
    const accessKeyId = config.get<string>('AWS_ACCESS_KEY_ID') || config.get<string>('OBJECT_STORAGE_ACCESS_KEY');
    const secretAccessKey = config.get<string>('AWS_SECRET_ACCESS_KEY') || config.get<string>('OBJECT_STORAGE_SECRET_KEY');
    this.client = region && accessKeyId && secretAccessKey
      ? new S3Client({
          region,
          endpoint,
          forcePathStyle: Boolean(endpoint),
          credentials: { accessKeyId, secretAccessKey },
        })
      : null;
  }

  private requireClient() {
    if (!this.client) {
      throw new ServiceUnavailableException('Object storage is not configured');
    }
    return this.client;
  }

  createUploadUrl(objectKey: string, contentType: string) {
    return getSignedUrl(
      this.requireClient(),
      new PutObjectCommand({ Bucket: this.bucket, Key: objectKey, ContentType: contentType }),
      { expiresIn: 900 },
    );
  }

  createDownloadUrl(objectKey: string) {
    return getSignedUrl(
      this.requireClient(),
      new GetObjectCommand({ Bucket: this.bucket, Key: objectKey }),
      { expiresIn: 900 },
    );
  }
}
