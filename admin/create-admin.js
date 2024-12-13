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

// Create admin account
async function createAdmin(email, password) {
    try {
        // Create user in Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Set admin privileges in Firestore
        await db.collection('managers').doc(user.uid).set({
            email: email,
            isAdmin: true,
            role: 'admin',
            active: true,
            createdAt: Date.now(),
            lastLogin: null
        });

        // Create initial log entry
        await db.collection('logs').add({
            action: 'create_admin',
            details: `Created admin account: ${email}`,
            timestamp: Date.now(),
            type: 'system'
        });

        console.log('Admin account created successfully!');
        return true;
    } catch (error) {
        console.error('Error creating admin:', error);
        return false;
    }
}

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
