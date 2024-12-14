// Get post ID from URL
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('id');

// Elements
const postTitle = document.getElementById('postTitle');
const postContent = document.getElementById('postContent');
const postDate = document.getElementById('postDate');
const postAuthor = document.getElementById('postAuthor');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const retryButton = document.getElementById('retryButton');

// Load post data
async function loadPost() {
    if (!postId) {
        showError('未找到文章ID');
        return;
    }

    showLoading(true);
    hideError();

    try {
        const post = await window.fb.withRetry(async () => {
            const doc = await db.collection('posts').doc(postId).get();
            if (!doc.exists) {
                throw new Error('文章不存在');
            }
            return doc.data();
        });

        // Log view after successfully loading the post
        await logPostView(postId);

        // Update UI
        updatePostUI(post);
        showLoading(false);
    } catch (error) {
        console.error('Error loading post:', error);
        showError(window.fb.handleFirestoreError(error));
        showLoading(false);
    }
}

// Log post view
async function logPostView(postId) {
    try {
        await window.fb.withRetry(async () => {
            // Add view log
            await db.collection('logs').add({
                type: 'view',
                action: 'view_post',
                postId: postId,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                sessionId: getSessionId(),
                visitorId: await getVisitorId(),
                ip: await getClientIP()
            });

            // Increment post views
            await db.collection('posts').doc(postId).update({
                views: firebase.firestore.FieldValue.increment(1)
            });
        });
    } catch (error) {
        console.warn('Error logging view:', error);
        // Don't show error to user for logging failure
    }
}

// Update post UI
function updatePostUI(post) {
    postTitle.textContent = post.title;
    postContent.innerHTML = marked(post.content); // Assuming you're using marked for markdown
    postDate.textContent = formatDate(post.timestamp);
    postAuthor.textContent = post.author || 'Anonymous';
}

// Show/hide loading spinner
function showLoading(show) {
    loadingSpinner.style.display = show ? 'block' : 'none';
    postContent.style.display = show ? 'none' : 'block';
}

// Show/hide error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    retryButton.style.display = 'block';
    postContent.style.display = 'none';
}

function hideError() {
    errorMessage.style.display = 'none';
    retryButton.style.display = 'none';
}

// Utility functions
function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Generate or get session ID
function getSessionId() {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
}

// Generate or get visitor ID
async function getVisitorId() {
    let visitorId = localStorage.getItem('visitorId');
    if (!visitorId) {
        visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('visitorId', visitorId);
    }
    return visitorId;
}

// Get client IP (you might want to use a service for this)
async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.warn('Error getting IP:', error);
        return 'unknown';
    }
}

// Retry button handler
retryButton.addEventListener('click', () => {
    loadPost();
});

// Initial load
loadPost();
