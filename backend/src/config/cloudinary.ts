import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_KEY_SECRET,
});

export interface UploadOptions {
    folder: string;
    resourceType?: 'image' | 'video' | 'auto';
    transformation?: Record<string, any>[];
}

export interface UploadResult {
    secure_url: string;
    public_id: string;
    format: string;
    bytes: number;
}

/**
 * Upload a buffer to Cloudinary via stream.
 * Deduplicates the upload logic previously copy-pasted across 3 controllers.
 */
export function uploadBuffer(
    buffer: Buffer,
    options: UploadOptions
): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: options.folder,
                resource_type: options.resourceType || 'image',
                transformation: options.transformation,
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result as UploadResult);
            }
        );

        const readable = new Readable();
        readable.push(buffer);
        readable.push(null);
        readable.pipe(uploadStream);
    });
}

export default cloudinary;
