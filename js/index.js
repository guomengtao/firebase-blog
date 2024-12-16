// Import db from firebase-init.js
import { db } from './firebase-init.js';

// Load posts when page loads
document.addEventListener('DOMContentLoaded', function() {
    const postsContainer = document.getElementById('posts');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const categoriesList = document.getElementById('categoriesList');
    const popularTags = document.getElementById('popularTags');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const pagination = document.getElementById('pagination');

    // Sample blog data - Replace with actual data from your database
    let posts = [];

    const categories = ['Firebase', 'Cloudinary', 'Web Development', 'Tutorial'];
    const tags = ['firebase', 'web development', 'tutorial', 'cloudinary', 'images'];

    async function loadPosts() {
        try {
            showLoading(true);
            hideError();

            const postsData = await window.fb.withRetry(async () => {
                const snapshot = await db.collection('posts')
                    .where('status', '==', 'published')
                    .orderBy('timestamp', 'desc')
                    .get();

                return snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            });

            posts = postsData;
            filterPosts();
            showLoading(false);
        } catch (error) {
            console.error('Error loading posts:', error);
            showError(window.fb.handleFirestoreError(error));
            showLoading(false);
        }
    }

    function createPostCard(post) {
        return `
            <article class="blog-post">
                <img src="${post.coverImage}" alt="${post.title}" class="featured-image">
                <h2><a href="post.html?id=${post.id}" class="text-decoration-none text-dark">${post.title}</a></h2>
                <div class="post-meta">
                    <span><i class="fas fa-user"></i> ${post.author}</span> •
                    <span><i class="fas fa-calendar"></i> ${formatDate(post.timestamp)}</span> •
                    <span><i class="fas fa-folder"></i> ${post.category}</span>
                </div>
                <div class="post-content">
                    ${truncateContent(post.content, 100)}
                </div>
                <div class="post-tags">
                    ${post.tags.map(tag => `<a href="#" class="tag">#${tag}</a>`).join('')}
                </div>
            </article>
        `;
    }

    function filterPosts() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;

        const filteredPosts = posts.filter(post => {
            const matchesSearch = post.title.toLowerCase().includes(searchTerm) || 
                                post.content.toLowerCase().includes(searchTerm);
            const matchesCategory = !selectedCategory || post.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });

        displayPosts(filteredPosts);
    }

    function displayPosts(postsToShow) {
        postsContainer.innerHTML = postsToShow.map(post => createPostCard(post)).join('');
    }

    function initializeCategoryFilter() {
        categoryFilter.innerHTML = `
            <option value="">All Categories</option>
            ${categories.map(category => `
                <option value="${category}">${category}</option>
            `).join('')}
        `;
    }

    function displayCategories() {
        categoriesList.innerHTML = categories.map(category => `
            <li><a href="#" onclick="filterByCategory('${category}'); return false;">${category}</a></li>
        `).join('');
    }

    function displayTags() {
        popularTags.innerHTML = tags.map(tag => `
            <a href="#" class="tag" onclick="filterByTag('${tag}'); return false;">#${tag}</a>
        `).join('');
    }

    // Event listeners for search and filter
    searchInput.addEventListener('input', filterPosts);
    categoryFilter.addEventListener('change', filterPosts);

    // Filter functions for category and tag clicks
    window.filterByCategory = function(category) {
        categoryFilter.value = category;
        filterPosts();
    };

    window.filterByTag = function(tag) {
        searchInput.value = tag;
        filterPosts();
    };

    // Initialize the page
    loadPosts();
    initializeCategoryFilter();
    displayCategories();
    displayTags();
});

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
