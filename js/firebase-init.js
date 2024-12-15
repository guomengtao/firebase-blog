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
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Initialize Firestore with settings
const db = firebase.firestore();
db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
    merge: true // Add merge option to prevent settings override warning
});

// Enable offline persistence with experimentalForceOwningTab
db.enablePersistence({
    synchronizeTabs: true, // Enable multi-tab synchronization
    experimentalForceOwningTab: true // Force this tab to own persistence
}).catch((err) => {
    if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time
        console.log('Multiple tabs open, offline persistence disabled');
    } else if (err.code === 'unimplemented') {
        // The current browser does not support persistence
        console.log('Current browser does not support offline persistence');
    }
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
        networkStatus.textContent = '离线';
    }
}

// Monitor network status
window.addEventListener('online', () => updateNetworkStatus(true));
window.addEventListener('offline', () => updateNetworkStatus(false));

// Initial network status check
updateNetworkStatus(navigator.onLine);

// Error handling function for Firestore operations
function handleFirestoreError(error) {
    console.error('Firestore error:', error);
    if (error.code === 'unavailable') {
        return '服务器暂时不可用，请稍后重试';
    } else if (error.code === 'permission-denied') {
        return '没有权限执行此操作';
    }
    return '发生错误，请重试';
}

// Utility function for Firestore operations with retry
async function withRetry(operation, maxRetries = 3) {
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            if (error.code === 'unavailable' && attempt < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                continue;
            }
            throw error;
        }
    }
    throw lastError;
}

// Export utility functions and database instance
window.fb = {
    db,
    handleFirestoreError,
    withRetry,
    isOnline: () => isOnline
};
