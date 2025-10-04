export { };

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            DATABASE_URL: string;
            JWT_SECRET: string;
            JWT_EXPIRES_IN: string;
            PORT: string;
            NODE_ENV: 'development' | 'production' | 'test';
            CLOUDINARY_CLOUD_NAME?: string;
            CLOUDINARY_API_KEY?: string;
            CLOUDINARY_API_SECRET?: string;
            EMAIL_HOST?: string;
            EMAIL_PORT?: string;
            EMAIL_USER?: string;
            EMAIL_PASS?: string;
            EMAIL_FROM?: string;
            FRONTEND_URL?: string;
        }
    }
}
