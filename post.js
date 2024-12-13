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
const db = firebase.firestore();

// Get post ID from URL
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('id');

// Update connection status
const statusElement = document.getElementById('status');
const updateConnectionStatus = () => {
    if (navigator.onLine) {
        statusElement.textContent = 'Connected';
        statusElement.style.color = '#4CAF50';
    } else {
        statusElement.textContent = 'Offline';
        statusElement.style.color = '#f44336';
    }
};

window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);
updateConnectionStatus();

// Load post content
if (postId) {
    db.collection('posts').doc(postId).get()
        .then((doc) => {
            if (doc.exists) {
                const post = doc.data();
                document.title = post.title + ' - Blog';
                document.getElementById('post-title').textContent = post.title;
                document.getElementById('post-date').textContent = new Date(post.timestamp).toLocaleString();
                document.getElementById('post-body').innerHTML = post.content;

                // Update view count
                const newViews = (post.views || 0) + 1;
                db.collection('posts').doc(postId).update({
                    views: newViews
                }).catch(console.error);

                // Log visit
                db.collection('visitors').add({
                    postId: postId,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    page: 'post',
                    action: 'view'
                }).catch(console.error);
            } else {
                document.getElementById('post-title').textContent = '文章未找到';
                document.getElementById('post-body').innerHTML = '<p>抱歉，找不到这篇文章。</p>';
            }
        })
        .catch((error) => {
            console.error('Error loading post:', error);
            document.getElementById('post-title').textContent = '加载错误';
            document.getElementById('post-body').innerHTML = '<p>加载文章时出错。</p>';
        });
} else {
    document.getElementById('post-title').textContent = '参数错误';
    document.getElementById('post-body').innerHTML = '<p>URL 缺少必要的参数。</p>';
}
