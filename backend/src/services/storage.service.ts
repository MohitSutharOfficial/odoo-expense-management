import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { createClient } from '@supabase/supabase-js';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

// Configure Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ================================================
// CLOUDINARY STORAGE WITH OPTIMIZATIONS
// ================================================

interface UploadOptions {
    folder?: string;
    transformation?: string;
    signed?: boolean;
}

interface ImageTransformations {
    thumbnail: string;
    medium: string;
    large: string;
}

/**
 * Cloudinary transformation presets
 */
export const TRANSFORMATIONS = {
    // Receipt thumbnails - Small preview
    receipt_thumb: 'c_fill,w_200,h_200,q_auto,f_auto',

    // Receipt medium - Display size
    receipt_medium: 'c_limit,w_800,h_800,q_auto:good,f_auto',

    // Receipt large - Full size with optimization
    receipt_large: 'c_limit,w_1600,h_1600,q_auto:best,f_auto',

    // Profile picture - Circular crop
    profile_pic: 'c_fill,w_400,h_400,g_face,q_auto,f_auto,r_max',

    // Profile thumbnail
    profile_thumb: 'c_fill,w_100,h_100,g_face,q_auto,f_auto,r_max',
};

/**
 * Upload receipt to Cloudinary with automatic optimization
 */
export async function uploadReceipt(
    filePath: string,
    userId: string,
    expenseId: string
): Promise<{ url: string; transformations: ImageTransformations }> {
    try {
        const result: UploadApiResponse = await cloudinary.uploader.upload(filePath, {
            folder: `receipts/${userId}`,
            public_id: `expense_${expenseId}`,
            resource_type: 'auto',
            // Auto optimize
            quality: 'auto:good',
            fetch_format: 'auto',
            // Progressive loading for web
            flags: 'progressive',
            // Add metadata
            context: {
                user_id: userId,
                expense_id: expenseId,
                upload_date: new Date().toISOString(),
            },
        });

        // Generate URLs with transformations
        const baseUrl = result.secure_url;
        const publicId = result.public_id;

        return {
            url: baseUrl,
            transformations: {
                thumbnail: cloudinary.url(publicId, {
                    transformation: TRANSFORMATIONS.receipt_thumb,
                    secure: true,
                }),
                medium: cloudinary.url(publicId, {
                    transformation: TRANSFORMATIONS.receipt_medium,
                    secure: true,
                }),
                large: cloudinary.url(publicId, {
                    transformation: TRANSFORMATIONS.receipt_large,
                    secure: true,
                }),
            },
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error('Failed to upload receipt to Cloudinary');
    }
}

/**
 * Upload profile picture to Cloudinary
 */
export async function uploadProfilePicture(
    filePath: string,
    userId: string
): Promise<{ url: string; thumbnail: string }> {
    try {
        const result: UploadApiResponse = await cloudinary.uploader.upload(filePath, {
            folder: `profiles/${userId}`,
            public_id: `avatar_${userId}`,
            resource_type: 'image',
            // Auto optimize
            quality: 'auto:good',
            fetch_format: 'auto',
            // Overwrite existing
            overwrite: true,
            // Add transformations
            transformation: [
                { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' },
                { fetch_format: 'auto' },
            ],
        });

        const publicId = result.public_id;

        return {
            url: result.secure_url,
            thumbnail: cloudinary.url(publicId, {
                transformation: TRANSFORMATIONS.profile_thumb,
                secure: true,
            }),
        };
    } catch (error) {
        console.error('Profile picture upload error:', error);
        throw new Error('Failed to upload profile picture');
    }
}

/**
 * Generate signed URL for secure access (expires in 1 hour)
 */
export function generateSignedUrl(publicId: string, transformation?: string): string {
    const options: any = {
        secure: true,
        sign_url: true,
        type: 'authenticated',
        // Expires in 1 hour
        expires_at: Math.floor(Date.now() / 1000) + 3600,
    };

    if (transformation) {
        options.transformation = transformation;
    }

    return cloudinary.url(publicId, options);
}

/**
 * Delete image from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
    try {
        await cloudinary.uploader.destroy(publicId);
        console.log(`Deleted from Cloudinary: ${publicId}`);
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw new Error('Failed to delete from Cloudinary');
    }
}

// ================================================
// SUPABASE STORAGE
// ================================================

/**
 * Upload file to Supabase Storage
 */
export async function uploadToSupabase(
    bucket: string,
    filePath: string,
    file: Buffer | File,
    options?: { contentType?: string; cacheControl?: string }
): Promise<string> {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                contentType: options?.contentType,
                cacheControl: options?.cacheControl || '3600',
                upsert: false,
            });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);

        return publicUrl;
    } catch (error) {
        console.error('Supabase upload error:', error);
        throw new Error('Failed to upload to Supabase Storage');
    }
}

/**
 * Get signed URL from Supabase (expires in specified seconds)
 */
export async function getSupabaseSignedUrl(
    bucket: string,
    filePath: string,
    expiresIn: number = 3600
): Promise<string> {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(filePath, expiresIn);

        if (error) throw error;

        return data.signedUrl;
    } catch (error) {
        console.error('Supabase signed URL error:', error);
        throw new Error('Failed to generate signed URL');
    }
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFromSupabase(bucket: string, filePath: string): Promise<void> {
    try {
        const { error } = await supabase.storage.from(bucket).remove([filePath]);

        if (error) throw error;

        console.log(`Deleted from Supabase: ${bucket}/${filePath}`);
    } catch (error) {
        console.error('Supabase delete error:', error);
        throw new Error('Failed to delete from Supabase Storage');
    }
}

/**
 * List files in Supabase bucket
 */
export async function listSupabaseFiles(
    bucket: string,
    folder?: string
): Promise<Array<{ name: string; id: string; updated_at: string; created_at: string }>> {
    try {
        const { data, error } = await supabase.storage.from(bucket).list(folder, {
            limit: 100,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' },
        });

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('Supabase list files error:', error);
        throw new Error('Failed to list files from Supabase Storage');
    }
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Validate file type
 */
export function isValidImageType(filename: string): boolean {
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const ext = getFileExtension(filename);
    return validExtensions.includes(ext);
}

/**
 * Validate file size (in bytes)
 */
export function isValidFileSize(size: number, maxSizeMB: number = 5): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return size <= maxSizeBytes;
}

/**
 * Generate unique filename
 */
export function generateUniqueFilename(originalFilename: string, userId: string): string {
    const ext = getFileExtension(originalFilename);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${userId}_${timestamp}_${random}.${ext}`;
}

export default {
    // Cloudinary
    uploadReceipt,
    uploadProfilePicture,
    generateSignedUrl,
    deleteFromCloudinary,

    // Supabase
    uploadToSupabase,
    getSupabaseSignedUrl,
    deleteFromSupabase,
    listSupabaseFiles,

    // Utilities
    isValidImageType,
    isValidFileSize,
    generateUniqueFilename,

    // Constants
    TRANSFORMATIONS,
};
