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
    return new Date(timestamp).toLocaleDateString('zh-CN', {
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
function renderPosts() {
    postsRef.where('status', '==', 'published')
           .orderBy('timestamp', 'desc')
           .get()
           .then((snapshot) => {
        const postsContainer = document.getElementById('posts');
        postsContainer.innerHTML = '';
        
        if (snapshot.empty) {
            postsContainer.innerHTML = '<p>还没有任何文章。</p>';
            return;
        }
        
        snapshot.forEach((doc) => {
            const post = doc.data();
            const postElement = document.createElement('article');
            postElement.className = 'blog-post';
            
            let coverImageHtml = '';
            if (post.coverImage) {
                coverImageHtml = `
                    <div class="post-cover">
                        <img src="${post.coverImage}" alt="${post.title}">
                    </div>
                `;
            }

            let tagsHtml = '';
            if (post.tags && post.tags.length > 0) {
                tagsHtml = `
                    <div class="post-tags">
                        ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                `;
            }

            postElement.innerHTML = `
                ${coverImageHtml}
                <h2 class="post-title">
                    <a href="post.html?id=${doc.id}">${post.title}</a>
                </h2>
                ${tagsHtml}
                <div class="post-meta">
                    <span>发布于 ${formatDate(post.timestamp)}</span>
                    <span>阅读 ${post.views || 0}</span>
                </div>
                <div class="post-excerpt">
                    ${post.content.substring(0, 200)}...
                </div>
                <a href="post.html?id=${doc.id}" class="read-more">阅读全文</a>
            `;
            
            postsContainer.appendChild(postElement);
        });
    }).catch(error => {
        console.error('Error loading posts:', error);
        const postsContainer = document.getElementById('posts');
        postsContainer.innerHTML = '<p>加载文章时出错。</p>';
    });
}

// Initial render
renderPosts();
