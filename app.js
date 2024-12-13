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

// Reference to the posts collection
const postsRef = db.collection('posts');

// Function to format date
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

// Function to render posts
async function renderPosts() {
    try {
        const snapshot = await postsRef
            .where('status', '==', 'published')
            .orderBy('timestamp', 'desc')
            .get();

        const postsContainer = document.getElementById('posts');
        postsContainer.innerHTML = '';
        
        if (snapshot.empty) {
            postsContainer.innerHTML = '<div class="alert alert-info">还没有任何文章。</div>';
            return;
        }
        
        const postsHtml = snapshot.docs.map(doc => {
            const post = doc.data();
            const coverImageHtml = post.coverImage 
                ? `<div class="post-cover"><img src="${post.coverImage}" alt="${post.title}" loading="lazy"></div>` 
                : '';
            
            const tagsHtml = post.tags && post.tags.length 
                ? `<div class="post-tags">${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` 
                : '';

            const excerpt = post.content
                ? post.content.replace(/<[^>]*>/g, '').substring(0, 200) + '...'
                : '';

            return `
                <article class="blog-post">
                    ${coverImageHtml}
                    <h2 class="post-title">
                        <a href="post.html?id=${doc.id}">${post.title || '无标题'}</a>
                    </h2>
                    ${tagsHtml}
                    <div class="post-meta">
                        <span><i class="far fa-clock"></i> ${formatDate(post.timestamp)}</span>
                        <span><i class="far fa-eye"></i> ${post.views || 0}</span>
                        <span><i class="far fa-comments"></i> ${Object.keys(post.comments || {}).length}</span>
                    </div>
                    <div class="post-excerpt">${excerpt}</div>
                    <a href="post.html?id=${doc.id}" class="read-more">阅读全文 <i class="fas fa-arrow-right"></i></a>
                </article>
            `;
        }).join('');

        postsContainer.innerHTML = postsHtml;

        // Log page view
        await db.collection('logs').add({
            action: 'view_home',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            type: 'visitor'
        });
    } catch (error) {
        console.error('Error loading posts:', error);
        const postsContainer = document.getElementById('posts');
        postsContainer.innerHTML = `
            <div class="alert alert-danger">
                加载文章时出错。请刷新页面重试。
                <br>错误信息：${error.message}
            </div>
        `;
    }
}

// Initial render
renderPosts();
