import { db } from './firebase-init.js';

let lastDoc = null;
const POSTS_PER_PAGE = 6;
let isLoading = false;

// Initialize the blog list
async function initBlogList() {
    setupEventListeners();
    await loadPosts();
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', debounce(filterPosts, 300));
    document.getElementById('categoryFilter').addEventListener('change', filterPosts);
    document.getElementById('sortBy').addEventListener('change', filterPosts);
    document.getElementById('featuredOnly').addEventListener('change', filterPosts);
    document.getElementById('loadMoreBtn').addEventListener('click', loadMorePosts);

    // Infinite scroll
    window.addEventListener('scroll', () => {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 1000) {
            loadMorePosts();
        }
    });
}

// Load posts from Firebase
async function loadPosts(append = false) {
    if (isLoading) return;
    isLoading = true;
    
    const loadingSpinner = document.getElementById('loadingSpinner');
    const noResults = document.getElementById('noResults');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    loadingSpinner.style.display = 'block';
    noResults.style.display = 'none';

    try {
        let query = db.collection('posts')
            .orderBy(getSortField(), getSortDirection());

        // Apply filters
        const categoryFilter = document.getElementById('categoryFilter').value;
        const featuredOnly = document.getElementById('featuredOnly').checked;

        if (categoryFilter) {
            query = query.where('category', '==', categoryFilter);
        }
        if (featuredOnly) {
            query = query.where('featured', '==', true);
        }

        if (lastDoc && append) {
            query = query.startAfter(lastDoc);
        }

        query = query.limit(POSTS_PER_PAGE);

        const snapshot = await query.get();
        
        if (!append) {
            document.getElementById('blogList').innerHTML = '';
        }

        if (snapshot.empty && !append) {
            noResults.style.display = 'block';
            loadMoreBtn.style.display = 'none';
            return;
        }

        snapshot.forEach(doc => {
            const post = doc.data();
            addPostToDOM(doc.id, post);
        });

        lastDoc = snapshot.docs[snapshot.docs.length - 1];
        loadMoreBtn.style.display = snapshot.docs.length >= POSTS_PER_PAGE ? 'block' : 'none';

    } catch (error) {
        console.error('Error loading posts:', error);
        showError('Failed to load posts. Please try again later.');
    } finally {
        loadingSpinner.style.display = 'none';
        isLoading = false;
    }
}

// Add a post to the DOM
function addPostToDOM(id, post) {
    const blogList = document.getElementById('blogList');
    const postElement = document.createElement('div');
    postElement.className = 'col-md-6 col-lg-4';
    
    const date = post.createdAt ? new Date(post.createdAt.toDate()).toLocaleDateString() : 'Unknown date';
    
    postElement.innerHTML = `
        <div class="card blog-card h-100">
            ${post.featured ? '<div class="featured-badge"><i class="bi bi-star-fill"></i> Featured</div>' : ''}
            ${post.imageUrl ? `
                <img src="${post.imageUrl}" class="card-img-top" alt="${post.title}" style="height: 200px; object-fit: cover;">
            ` : ''}
            <div class="card-body">
                <h5 class="card-title">${post.title}</h5>
                <div class="blog-meta mb-2">
                    <i class="bi bi-calendar"></i> ${date}
                    <i class="bi bi-eye ms-2"></i> ${post.views || 0} views
                </div>
                <div class="mb-2">
                    ${(post.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <p class="blog-preview">${post.preview || post.content.substring(0, 150)}...</p>
                <a href="post.html?id=${id}" class="btn btn-outline-primary">Read More</a>
            </div>
        </div>
    `;
    
    blogList.appendChild(postElement);
}

// Load more posts
async function loadMorePosts() {
    if (!isLoading && lastDoc) {
        await loadPosts(true);
    }
}

// Filter posts
async function filterPosts() {
    lastDoc = null;
    await loadPosts();
}

// Get sort field based on selected option
function getSortField() {
    const sortBy = document.getElementById('sortBy').value;
    switch (sortBy) {
        case 'views':
            return 'views';
        case 'title':
            return 'title';
        default:
            return 'createdAt';
    }
}

// Get sort direction based on selected option
function getSortDirection() {
    const sortBy = document.getElementById('sortBy').value;
    switch (sortBy) {
        case 'date-asc':
            return 'asc';
        case 'title':
            return 'asc';
        default:
            return 'desc';
    }
}

// Show error message
function showError(message) {
    const noResults = document.getElementById('noResults');
    noResults.innerHTML = `
        <i class="bi bi-exclamation-triangle" style="font-size: 2em; color: #dc3545;"></i>
        <h4 class="mt-3">${message}</h4>
    `;
    noResults.style.display = 'block';
}

// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initBlogList);
