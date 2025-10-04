import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

// Firebase configuration from Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyDm9_saxwvELGxUH8r2SW87TVu6Rp5zXo8",
    authDomain: "odoo-273ae.firebaseapp.com",
    projectId: "odoo-273ae",
    storageBucket: "odoo-273ae.firebasestorage.app",
    messagingSenderId: "1044172429609",
    appId: "1:1044172429609:web:41dad29ccc04854ac1ff38",
    measurementId: "G-EL2L287CK5"
};

// Initialize Firebase
let app;
try {
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully');
} catch (error: any) {
    console.error('❌ Firebase initialization error:', error);
    throw error;
}

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Configure auth settings
auth.useDeviceLanguage(); // Use device language

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account', // Always show account selection
    access_type: 'online'
});

// Add scopes for Google profile data
googleProvider.addScope('profile');
googleProvider.addScope('email');

/**
 * Sign in with Google using Firebase
 * @returns Promise with user credentials
 */
export const signInWithGoogle = async () => {
    try {
        console.log('🚀 Starting Google Sign-In...');

        const result = await signInWithPopup(auth, googleProvider);
        console.log('✅ Google Sign-In successful:', result.user.email);

        // This gives you a Google Access Token
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;
        const user = result.user;

        console.log('👤 User data:', {
            email: user.email,
            name: user.displayName,
            photo: user.photoURL
        });

        return { user, token };
    } catch (error: any) {
        console.error('❌ Google Sign-In Error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);

        // Handle specific error codes
        if (error.code === 'auth/popup-closed-by-user') {
            throw new Error('Sign-in cancelled. Please try again.');
        } else if (error.code === 'auth/popup-blocked') {
            throw new Error('Popup blocked by browser. Please allow popups for this site.');
        } else if (error.code === 'auth/internal-error') {
            throw new Error('Firebase configuration error. Please check Firebase Console settings.');
        } else if (error.code === 'auth/unauthorized-domain') {
            throw new Error('Domain not authorized. Please add this domain to Firebase Console.');
        }

        throw new Error(error.message || 'Failed to sign in with Google');
    }
};

/**
 * Sign out from Firebase
 */
export const firebaseSignOut = async () => {
    try {
        await signOut(auth);
    } catch (error: any) {
        console.error('Sign Out Error:', error);
        throw new Error(error.message || 'Failed to sign out');
    }
};

export default app;
