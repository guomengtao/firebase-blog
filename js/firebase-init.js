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

// Initialize Firebase with offline persistence
firebase.initializeApp(firebaseConfig);

// Enable offline persistence
firebase.firestore().enablePersistence()
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            // Multiple tabs open, persistence can only be enabled in one tab at a time
            console.warn('Multiple tabs open, offline persistence disabled');
        } else if (err.code == 'unimplemented') {
            // The current browser does not support persistence
            console.warn('Current browser does not support offline persistence');
        }
    });

// Configure cache size and timing
firebase.firestore().settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

// Add network status monitoring
let isOnline = true;
const networkStatus = document.createElement('div');
networkStatus.style.position = 'fixed';
networkStatus.style.bottom = '20px';
networkStatus.style.right = '20px';
networkStatus.style.padding = '10px';
networkStatus.style.borderRadius = '5px';
networkStatus.style.zIndex = '9999';
networkStatus.style.display = 'none';
document.body.appendChild(networkStatus);

function updateNetworkStatus(online) {
    isOnline = online;
    networkStatus.style.display = 'block';
    if (online) {
        networkStatus.style.backgroundColor = '#4CAF50';
        networkStatus.style.color = 'white';
        networkStatus.textContent = '已连接';
        setTimeout(() => {
            networkStatus.style.display = 'none';
        }, 3000);
    } else {
        networkStatus.style.backgroundColor = '#f44336';
        networkStatus.style.color = 'white';
        networkStatus.textContent = '离线模式';
    }
}

// Monitor network status
window.addEventListener('online', () => updateNetworkStatus(true));
window.addEventListener('offline', () => updateNetworkStatus(false));

// Initial network status check
updateNetworkStatus(navigator.onLine);

// Export commonly used Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Add error handling for Firestore operations
const handleFirestoreError = (error) => {
    console.error('Firestore Error:', error);
    if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
        if (!isOnline) {
            return '当前处于离线模式，请检查网络连接';
        }
        return '连接Firebase服务器超时，请稍后重试';
    }
    return error.message;
};

// Utility function for Firestore operations with retry
async function withRetry(operation, maxRetries = 3) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            if (!navigator.onLine || error.code === 'unavailable' || error.code === 'deadline-exceeded') {
                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
                continue;
            }
            throw error;
        }
    }
    throw lastError;
}

// Export utility functions
window.fb = {
    handleFirestoreError,
    withRetry,
    isOnline: () => isOnline
};
