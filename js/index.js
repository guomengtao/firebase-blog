// Initialize Firebase services
const db = firebase.firestore();

// Load posts when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadPosts();
    logHomePageView();
});

// Load posts from Firestore
async function loadPosts() {
    const postsContainer = document.getElementById('posts');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorMessage = document.getElementById('errorMessage');

    try {
        showLoading(true);
        hideError();

        const posts = await window.fb.withRetry(async () => {
            const snapshot = await db.collection('posts')
                .where('status', '==', 'published')
                .orderBy('timestamp', 'desc')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        });

        updatePostsUI(posts);
        showLoading(false);
    } catch (error) {
        console.error('Error loading posts:', error);
        showError(window.fb.handleFirestoreError(error));
        showLoading(false);
    }
}

// Log home page view
async function logHomePageView() {
    try {
        await window.fb.withRetry(async () => {
            // Log view
            await db.collection('logs').add({
                type: 'view',
                action: 'view_home',
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                sessionId: getSessionId(),
                visitorId: await getVisitorId(),
                ip: await getClientIP()
            });

            // Log visitor
            await db.collection('logs').add({
                type: 'visitor',
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                sessionId: getSessionId(),
                visitorId: await getVisitorId(),
                ip: await getClientIP(),
                userAgent: navigator.userAgent
            });
        });
    } catch (error) {
        console.warn('Error logging home page view:', error);
    }
}

// Update posts UI
function updatePostsUI(posts) {
    const postsContainer = document.getElementById('posts');
    
    if (posts.length === 0) {
        postsContainer.innerHTML = `
            <div class="alert alert-info">
                还没有任何文章
            </div>
        `;
        return;
    }

    postsContainer.innerHTML = posts.map(post => `
        <div class="card mb-4">
            <div class="card-body">
                <h2 class="card-title">
                    <a href="post.html?id=${post.id}" class="text-decoration-none">
                        ${post.title || '无标题'}
                    </a>
                </h2>
                <p class="card-text text-muted">
                    <small>
                        <i class="fas fa-calendar"></i> ${formatDate(post.timestamp)} &nbsp;|&nbsp;
                        <i class="fas fa-eye"></i> ${post.views || 0} 次浏览 &nbsp;|&nbsp;
                        <i class="fas fa-comments"></i> ${Object.keys(post.comments || {}).length} 条评论
                    </small>
                </p>
                <p class="card-text">
                    ${post.excerpt || truncateContent(post.content, 200)}
                </p>
                <a href="post.html?id=${post.id}" class="btn btn-primary">
                    阅读更多
                </a>
            </div>
        </div>
    `).join('');
}

// Show/hide loading spinner
function showLoading(show) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const postsContainer = document.getElementById('posts');
    
    loadingSpinner.style.display = show ? 'block' : 'none';
    postsContainer.style.display = show ? 'none' : 'block';
}

// Show/hide error message
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    const retryButton = document.getElementById('retryButton');
    
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    retryButton.style.display = 'block';
}

function hideError() {
    const errorMessage = document.getElementById('errorMessage');
    const retryButton = document.getElementById('retryButton');
    
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
        day: 'numeric'
    });
}

function truncateContent(content, length) {
    if (!content) return '';
    if (content.length <= length) return content;
    return content.substring(0, length) + '...';
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

// Get client IP
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
document.getElementById('retryButton')?.addEventListener('click', () => {
    loadPosts();
});
