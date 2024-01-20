export { };

declare global {
    interface ImportMetaEnv {
        VITE_OPS_FIREBASE_API_KEY: string;
        VITE_OPS_FIREBASE_AUTH_DOMAIN: string;
        VITE_OPS_FIREBASE_DATABASE_URL: string;
        VITE_OPS_FIREBASE_PROJECT_ID: string;
        VITE_OPS_FIREBASE_STORAGE_BUCKET: string;
        VITE_OPS_FIREBASE_MESSAGING_SENDER_ID: string;
        VITE_OPS_FIREBASE_APP_ID: string;
        VITE_OPS_FIREBASE_MEASUREMENT_ID: string;
        VITE_OPS_URL: string;
        VITE_OPS_COOKIE_NAME: string;
    }
}
