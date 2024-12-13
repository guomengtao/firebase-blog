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

// Check if user is already logged in
auth.onAuthStateChanged((user) => {
    if (user) {
        // Check if user is a manager
        db.collection('managers').doc(user.uid).get()
            .then((doc) => {
                if (doc.exists) {
                    window.location.href = 'index.html';
                } else {
                    auth.signOut();
                    showError('You are not authorized to access the admin panel.');
                }
            })
            .catch((error) => {
                console.error('Error checking manager status:', error);
                showError('An error occurred. Please try again.');
            });
    }
});

// Login form handler
document.getElementById('btnLogin').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showError('Please enter both email and password.');
        return;
    }
    
    auth.signInWithEmailAndPassword(email, password)
        .catch((error) => {
            console.error('Login error:', error);
            showError('Invalid email or password.');
        });
});

// Show error message
function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}
