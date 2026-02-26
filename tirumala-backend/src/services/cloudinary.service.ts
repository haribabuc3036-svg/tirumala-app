import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { env } from '../config/env';

function assertCloudinaryConfigured(): void {
  if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.');
  }
}

function getClient() {
  assertCloudinaryConfigured();
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
  return cloudinary;
}

export type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
};

export async function uploadImageToCloudinary(
  fileBuffer: Buffer,
  fileName: string,
  folder: string
): Promise<CloudinaryUploadResult> {
  const client = getClient();

  return new Promise((resolve, reject) => {
    const upload = client.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        use_filename: true,
        unique_filename: true,
        filename_override: fileName,
      },
      (error, result) => {
        if (error) {
          reject(new Error(error.message));
          return;
        }
        if (!result) {
          reject(new Error('Cloudinary upload failed with empty response'));
          return;
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );

    Readable.from(fileBuffer).pipe(upload);
  });
}

export async function uploadWallpaperToCloudinary(
  fileBuffer: Buffer,
  fileName: string
): Promise<CloudinaryUploadResult> {
  return uploadImageToCloudinary(fileBuffer, fileName, env.cloudinary.folder);
}

export async function uploadPlacePhotoToCloudinary(
  fileBuffer: Buffer,
  fileName: string
): Promise<CloudinaryUploadResult> {
  return uploadImageToCloudinary(fileBuffer, fileName, env.cloudinary.placesFolder);
}

export async function uploadServiceImageToCloudinary(
  fileBuffer: Buffer,
  fileName: string
): Promise<CloudinaryUploadResult> {
  return uploadImageToCloudinary(fileBuffer, fileName, `${env.cloudinary.servicesFolder}/items`);
}

export async function uploadServiceIconToCloudinary(
  fileBuffer: Buffer,
  fileName: string
): Promise<CloudinaryUploadResult> {
  return uploadImageToCloudinary(fileBuffer, fileName, `${env.cloudinary.servicesFolder}/icons`);
}

export async function uploadServiceDetailImageToCloudinary(
  fileBuffer: Buffer,
  fileName: string
): Promise<CloudinaryUploadResult> {
  return uploadImageToCloudinary(fileBuffer, fileName, `${env.cloudinary.servicesFolder}/details`);
}

export async function uploadServiceCategoryImageToCloudinary(
  fileBuffer: Buffer,
  fileName: string
): Promise<CloudinaryUploadResult> {
  return uploadImageToCloudinary(fileBuffer, fileName, `${env.cloudinary.servicesFolder}/categories`);
}

export async function uploadPlacePhotoUrlToCloudinary(
  sourceUrl: string,
  fileName: string
): Promise<CloudinaryUploadResult> {
  const client = getClient();
  const result = await client.uploader.upload(sourceUrl, {
    folder: env.cloudinary.placesFolder,
    resource_type: 'image',
    use_filename: true,
    unique_filename: true,
    filename_override: fileName,
  });

  return {
    secure_url: result.secure_url,
    public_id: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  const client = getClient();
  const response = await client.uploader.destroy(publicId, { resource_type: 'image' });
  if (response.result !== 'ok' && response.result !== 'not found') {
    throw new Error(`Cloudinary delete failed: ${response.result}`);
  }
}
