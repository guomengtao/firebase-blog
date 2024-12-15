// Initialize Firebase services
const db = window.fb.db;

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
                userAgent: navigator.userAgent,
                language: navigator.language,
                referrer: document.referrer,
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
        console.error('Error logging home page view:', error);
    }
}

// Update posts UI
function updatePostsUI(posts) {
    const postsContainer = document.getElementById('posts');
    
    if (!posts || posts.length === 0) {
        postsContainer.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-newspaper fa-3x text-muted mb-3"></i>
                <h3>暂无文章</h3>
                <p class="text-muted">敬请期待新的内容</p>
            </div>
        `;
        return;
    }

    postsContainer.innerHTML = posts.map(post => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card h-100 shadow-sm">
                ${post.coverImage ? `
                    <img src="${post.coverImage}" class="card-img-top" alt="${post.title}" style="height: 200px; object-fit: cover;">
                ` : ''}
                <div class="card-body">
                    <h5 class="card-title">${post.title}</h5>
                    <p class="card-text text-muted small">${formatDate(post.timestamp)}</p>
                    <p class="card-text">${truncateContent(post.content, 100)}</p>
                    <a href="post.html?id=${post.id}" class="btn btn-primary">阅读更多</a>
                </div>
            </div>
        </div>
    `).join('');
}

// Show/hide loading spinner
function showLoading(show) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = show ? 'block' : 'none';
    }
}

// Show/hide error message
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
}

function hideError() {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.style.display = 'none';
    }
}

// Utility functions
function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}

function truncateContent(content, length) {
    if (!content) return '';
    return content.length > length ? content.substring(0, length) + '...' : content;
}

// Generate or get session ID
function getSessionId() {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
        sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
}

// Generate or get visitor ID
async function getVisitorId() {
    let visitorId = localStorage.getItem('visitorId');
    if (!visitorId) {
        visitorId = Math.random().toString(36).substring(2) + Date.now().toString(36);
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
        console.error('Error getting IP:', error);
        return 'unknown';
    }
}

// Retry button handler
document.getElementById('retryButton')?.addEventListener('click', () => {
    loadPosts();
});
