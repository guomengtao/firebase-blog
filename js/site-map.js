import { db } from './firebase-init.js';

let allPages = [];
let filteredPages = [];

// Initialize the sitemap functionality
async function initSitemap() {
    await loadPageViews();
    setupEventListeners();
    checkBrokenLinks();
}

// Load page views from Firebase
async function loadPageViews() {
    try {
        const snapshot = await db.collection('pageViews').get();
        const pageViews = {};
        snapshot.forEach(doc => {
            pageViews[doc.id] = doc.data().views || 0;
        });

        // Update page view counts
        document.querySelectorAll('.sitemap-item').forEach(item => {
            const link = item.querySelector('a');
            if (link) {
                const path = link.getAttribute('href').replace('.html', '');
                const views = pageViews[path] || 0;
                const viewsSpan = item.querySelector('.page-views');
                if (viewsSpan) {
                    viewsSpan.textContent = `${views} views`;
                }
            }
        });
    } catch (error) {
        console.error('Error loading page views:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('sitemapSearch');
    searchInput.addEventListener('input', filterPages);

    // Category filter buttons
    document.querySelectorAll('[data-filter]').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('[data-filter]').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            filterPages();
        });
    });

    // Sort functionality
    const sortSelect = document.getElementById('sortSelect');
    sortSelect.addEventListener('change', sortPages);
}

// Filter pages based on search and category
function filterPages() {
    const searchTerm = document.getElementById('sitemapSearch').value.toLowerCase();
    const activeFilter = document.querySelector('[data-filter].active').dataset.filter;

    document.querySelectorAll('.sitemap-category').forEach(category => {
        const categoryType = category.dataset.category;
        const shouldShowCategory = activeFilter === 'all' || activeFilter === categoryType;
        
        if (shouldShowCategory) {
            category.style.display = '';
            
            category.querySelectorAll('.sitemap-item').forEach(item => {
                const text = item.textContent.toLowerCase();
                const matchesSearch = text.includes(searchTerm);
                item.style.display = matchesSearch ? '' : 'none';
            });
        } else {
            category.style.display = 'none';
        }
    });
}

// Sort pages based on selected criteria
function sortPages() {
    const sortType = document.getElementById('sortSelect').value;
    const categories = document.querySelectorAll('.sitemap-category');

    categories.forEach(category => {
        const items = Array.from(category.querySelectorAll('.sitemap-item'));
        
        items.sort((a, b) => {
            switch (sortType) {
                case 'alphabetical':
                    return a.querySelector('a').textContent.localeCompare(b.querySelector('a').textContent);
                case 'popular':
                    const viewsA = parseInt(a.querySelector('.page-views').textContent) || 0;
                    const viewsB = parseInt(b.querySelector('.page-views').textContent) || 0;
                    return viewsB - viewsA;
                case 'recent':
                    // This would need actual "last updated" data
                    return 0;
            }
        });

        const itemsContainer = category.querySelector('.sitemap-items');
        items.forEach(item => itemsContainer.appendChild(item));
    });
}

// Check for broken links
async function checkBrokenLinks() {
    const links = document.querySelectorAll('.sitemap-item a');
    
    for (const link of links) {
        try {
            const response = await fetch(link.href, { method: 'HEAD' });
            if (!response.ok) {
                link.classList.add('broken-link');
                link.setAttribute('title', 'This page may be unavailable');
            }
        } catch (error) {
            console.error('Error checking link:', link.href, error);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initSitemap);
