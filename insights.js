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

// Global charts object
let charts = {};

// Load all data when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
});

// Load all data and update UI
async function loadAllData() {
    try {
        const [
            postsData,
            viewsData,
            commentsData,
            categoriesData
        ] = await Promise.all([
            loadPosts(),
            loadViews(),
            loadComments(),
            loadCategories()
        ]);

        updateStatistics(postsData, viewsData, commentsData);
        updatePopularPostsChart(postsData);
        updateCategoriesChart(categoriesData);
        updateWeeklyActivityChart(viewsData);
        updateEngagementChart(postsData, commentsData);
        updateLatestPosts(postsData);
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Load posts data
async function loadPosts() {
    const snapshot = await db.collection('posts')
        .where('status', '==', 'published')
        .orderBy('timestamp', 'desc')
        .get();
    
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

// Load views data
async function loadViews() {
    const snapshot = await db.collection('visitors')
        .orderBy('timestamp', 'desc')
        .limit(1000)
        .get();
    
    return snapshot.docs.map(doc => doc.data());
}

// Load comments data
async function loadComments() {
    const snapshot = await db.collection('comments')
        .orderBy('timestamp', 'desc')
        .get();
    
    return snapshot.docs.map(doc => doc.data());
}

// Load categories data
async function loadCategories() {
    const snapshot = await db.collection('categories')
        .get();
    
    return snapshot.docs.map(doc => doc.data());
}

// Update statistics cards
function updateStatistics(posts, views, comments) {
    // Update numbers
    document.getElementById('totalPosts').textContent = posts.length;
    document.getElementById('totalViews').textContent = views.length;
    document.getElementById('totalComments').textContent = comments.length;
    document.getElementById('activeUsers').textContent = 
        new Set(views.map(v => v.userId)).size;

    // Update trends (comparing with previous period)
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const lastWeek = now - (7 * dayMs);

    const recentPosts = posts.filter(p => p.timestamp > lastWeek).length;
    const recentViews = views.filter(v => v.timestamp > lastWeek).length;
    const recentComments = comments.filter(c => c.timestamp > lastWeek).length;
    const recentUsers = new Set(
        views.filter(v => v.timestamp > lastWeek)
            .map(v => v.userId)
    ).size;

    updateTrend('postsTrend', recentPosts, posts.length);
    updateTrend('viewsTrend', recentViews, views.length);
    updateTrend('commentsTrend', recentComments, comments.length);
    updateTrend('usersTrend', recentUsers, 
        new Set(views.map(v => v.userId)).size);
}

// Update trend indicator
function updateTrend(elementId, recent, total) {
    const element = document.getElementById(elementId);
    const weeklyRate = (recent / total * 100).toFixed(1);
    const isUp = weeklyRate > 0;
    
    element.textContent = `${isUp ? '↑' : '↓'} ${weeklyRate}%`;
    element.className = `trend-indicator ${isUp ? 'trend-up' : 'trend-down'}`;
}

// Update popular posts chart
function updatePopularPostsChart(posts) {
    const ctx = document.getElementById('popularPostsChart').getContext('2d');
    
    // Sort posts by views and get top 5
    const topPosts = posts
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5);

    if (charts.popularPosts) {
        charts.popularPosts.destroy();
    }

    charts.popularPosts = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topPosts.map(post => post.title),
            datasets: [{
                label: 'Views',
                data: topPosts.map(post => post.views || 0),
                backgroundColor: '#4CAF50'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Update categories chart
function updateCategoriesChart(categories) {
    const ctx = document.getElementById('categoriesChart').getContext('2d');
    
    if (charts.categories) {
        charts.categories.destroy();
    }

    charts.categories = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories.map(cat => cat.name),
            datasets: [{
                data: categories.map(cat => cat.count || 0),
                backgroundColor: [
                    '#4CAF50',
                    '#2196F3',
                    '#FFC107',
                    '#9C27B0',
                    '#F44336'
                ]
            }]
        },
        options: {
            responsive: true
        }
    });
}

// Update weekly activity chart
function updateWeeklyActivityChart(views) {
    const ctx = document.getElementById('weeklyActivityChart').getContext('2d');
    
    // Group views by day of week
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const viewsByDay = new Array(7).fill(0);
    
    views.forEach(view => {
        const day = new Date(view.timestamp).getDay();
        viewsByDay[day]++;
    });

    if (charts.weeklyActivity) {
        charts.weeklyActivity.destroy();
    }

    charts.weeklyActivity = new Chart(ctx, {
        type: 'line',
        data: {
            labels: days,
            datasets: [{
                label: 'Views',
                data: viewsByDay,
                borderColor: '#2196F3',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Update engagement chart
function updateEngagementChart(posts, comments) {
    const ctx = document.getElementById('engagementChart').getContext('2d');
    
    // Calculate engagement metrics
    const totalViews = posts.reduce((sum, post) => sum + (post.views || 0), 0);
    const totalComments = comments.length;
    const uniqueCommenters = new Set(comments.map(c => c.userId)).size;
    const avgCommentsPerPost = totalComments / posts.length;

    if (charts.engagement) {
        charts.engagement.destroy();
    }

    charts.engagement = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: [
                'Views per Post',
                'Comments per Post',
                'Unique Commenters',
                'Engagement Rate'
            ],
            datasets: [{
                label: 'Engagement Metrics',
                data: [
                    totalViews / posts.length,
                    avgCommentsPerPost,
                    uniqueCommenters,
                    (totalComments / totalViews * 100).toFixed(2)
                ],
                backgroundColor: 'rgba(33, 150, 243, 0.2)',
                borderColor: '#2196F3'
            }]
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Update latest posts table
function updateLatestPosts(posts) {
    const tbody = document.getElementById('latestPosts');
    tbody.innerHTML = '';

    posts.slice(0, 5).forEach(post => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><a href="post.html?id=${post.id}">${post.title}</a></td>
            <td>${new Date(post.timestamp).toLocaleDateString()}</td>
            <td>${post.views || 0}</td>
            <td>${post.comments || 0}</td>
        `;
        tbody.appendChild(row);
    });
}
