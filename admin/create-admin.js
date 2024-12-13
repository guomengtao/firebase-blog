// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD19ZwRmby0LATLuswJvqaiRcRbEGrtElg",
    authDomain: "rinuo-a2679.firebaseapp.com",
    projectId: "rinuo-a2679",
    storageBucket: "rinuo-a2679.appspot.com",
    messagingSenderId: "818845165575",
    appId: "1:818845165575:web:f35118e617e1138098a2a2",
    measurementId: "G-MWP5DF8H47"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Create admin account with email/password
async function createAdmin(email, password) {
    try {
        // Validate password
        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }

        // First check if user already exists
        try {
            const userRecord = await auth.signInWithEmailAndPassword(email, password);
            if (userRecord) {
                throw new Error('Admin account already exists');
            }
        } catch (signInError) {
            // If sign in fails with auth/user-not-found, that's good - we can create the user
            if (signInError.code !== 'auth/user-not-found') {
                throw signInError;
            }
        }

        // Create user in Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Set admin privileges in Firestore
        await setAdminPrivileges(user);
        return true;
    } catch (error) {
        console.error('Error creating admin:', error);
        let errorMessage = 'Failed to create admin account. ';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage += 'Email address is already in use.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'Email address is not valid.';
                break;
            case 'auth/operation-not-allowed':
                errorMessage += 'Email/password accounts are not enabled. Please enable them in the Firebase Console.';
                break;
            case 'auth/weak-password':
                errorMessage += 'Password is too weak.';
                break;
            default:
                errorMessage += error.message;
        }
        
        throw new Error(errorMessage);
    }
}

// Set admin privileges for a user
async function setAdminPrivileges(user) {
    await db.collection('managers').doc(user.uid).set({
        email: user.email,
        isAdmin: true,
        role: 'admin',
        active: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: null
    });

    // Create initial log entry
    await db.collection('logs').add({
        action: 'create_admin',
        details: `Created admin account: ${user.email}`,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        type: 'system'
    });

    console.log('Admin account created successfully!');
}

// Handle Google Sign In
document.getElementById('googleSignIn').addEventListener('click', async () => {
    const button = document.getElementById('googleSignIn');
    const result = document.getElementById('result');
    
    button.disabled = true;
    
    try {
        const userCredential = await auth.signInWithPopup(googleProvider);
        const user = userCredential.user;
        
        // Check if user is already an admin
        const adminDoc = await db.collection('managers').doc(user.uid).get();
        if (adminDoc.exists) {
            throw new Error('This Google account is already registered as an admin');
        }
        
        // Set admin privileges
        await setAdminPrivileges(user);
        
        result.classList.remove('d-none', 'alert-success', 'alert-danger');
        result.classList.add('alert-success');
        result.textContent = 'Admin account created successfully with Google! You can now login at /admin/login.html';
        button.style.display = 'none';
        document.getElementById('adminForm').style.display = 'none';
    } catch (error) {
        console.error('Google sign in error:', error);
        result.classList.remove('d-none', 'alert-success', 'alert-danger');
        result.classList.add('alert-danger');
        result.textContent = error.message;
        button.disabled = false;
    }
});

// Handle form submission for email/password
document.getElementById('adminForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const button = document.getElementById('createAdmin');
    const result = document.getElementById('result');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    button.disabled = true;
    button.textContent = 'Creating...';
    
    try {
        await createAdmin(email, password);
        result.classList.remove('d-none', 'alert-success', 'alert-danger');
        result.classList.add('alert-success');
        result.textContent = 'Admin account created successfully! You can now login at /admin/login.html';
        button.style.display = 'none';
        document.getElementById('googleSignIn').style.display = 'none';
    } catch (error) {
        result.classList.remove('d-none', 'alert-success', 'alert-danger');
        result.classList.add('alert-danger');
        result.textContent = error.message;
        button.disabled = false;
        button.textContent = 'Create Admin Account';
    }
});

// Create default admin
const adminEmail = 'admin@example.com';
const adminPassword = 'admin123456';

createAdmin(adminEmail, adminPassword).then(success => {
    if (success) {
        console.log(`
            Admin account created:
            Email: ${adminEmail}
            Password: ${adminPassword}
            
            Please change the password after first login!
        `);
    }
});
