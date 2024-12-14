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

// Initialize Firebase Auth
const auth = firebase.auth();
const db = firebase.firestore();

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();

// GitHub Auth Provider
const githubProvider = new firebase.auth.GithubAuthProvider();

// Form submission handler
document.getElementById('adminForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        alert('密码不匹配！');
        return;
    }

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await createAdminUser(userCredential.user);
    } catch (error) {
        console.error('Error:', error);
        alert('创建账号失败：' + error.message);
    }
});

// Google Sign In
async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        const result = await auth.signInWithPopup(provider);
        await createAdminUser(result.user);
    } catch (error) {
        console.error('Google登录错误:', error);
        alert('Google登录失败：' + error.message);
    }
}

document.getElementById('googleSignIn').addEventListener('click', signInWithGoogle);

// GitHub Sign In
async function signInWithGithub() {
    const provider = new firebase.auth.GithubAuthProvider();
    try {
        const result = await auth.signInWithPopup(provider);
        await createAdminUser(result.user);
    } catch (error) {
        console.error('GitHub登录错误:', error);
        alert('GitHub登录失败：' + error.message);
    }
}

document.getElementById('githubSignIn').addEventListener('click', signInWithGithub);

// Create admin user in Firestore
async function createAdminUser(user) {
    try {
        // Check if user already exists in managers collection
        const managerDoc = await db.collection('managers').doc(user.uid).get();
        if (managerDoc.exists) {
            throw new Error('此管理员账号已存在！');
        }

        // Create batch for atomic operations
        const batch = db.batch();

        // Create manager document
        const managerRef = db.collection('managers').doc(user.uid);
        batch.set(managerRef, {
            email: user.email,
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            isAdmin: true,
            role: 'admin',
            active: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Create system log
        const logRef = db.collection('logs').doc();
        batch.set(logRef, {
            type: 'system',
            action: 'create_admin',
            adminId: user.uid,
            email: user.email,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Commit the batch
        await batch.commit();

        alert('管理员账号创建成功！');
        window.location.href = '../index.html';
    } catch (error) {
        console.error('Error creating admin:', error);
        throw new Error('创建管理员失败：' + error.message);
    }
}

// Create default admin
const adminEmail = 'admin@example.com';
const adminPassword = 'admin123456';

auth.createUserWithEmailAndPassword(adminEmail, adminPassword).then(userCredential => {
    createAdminUser(userCredential.user).then(() => {
        console.log(`
            Admin account created:
            Email: ${adminEmail}
            Password: ${adminPassword}
            
            Please change the password after first login!
        `);
    });
});
