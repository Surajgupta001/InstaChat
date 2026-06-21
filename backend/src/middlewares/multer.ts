import multer from 'multer';

const ALLOWED_MIME_TYPES = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // Videos
    'video/mp4',
    'video/quicktime',
    'video/webm',
] as const;

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype as any)) {
            cb(null, true);
        } else {
            cb(new Error(`File type "${file.mimetype}" is not allowed. Allowed types: images (JPEG, PNG, GIF, WebP) and videos (MP4, MOV, WebM)`));
        }
    },
});

export default upload;
