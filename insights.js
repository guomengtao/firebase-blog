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
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'alert alert-info';
    loadingDiv.textContent = '正在加载数据...';
    document.querySelector('.container').prepend(loadingDiv);

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

        loadingDiv.remove();
    } catch (error) {
        console.error('Error loading data:', error);
        loadingDiv.className = 'alert alert-danger';
        loadingDiv.innerHTML = `
            加载数据时出错。<br>
            错误信息：${error.message}<br>
            <button onclick="location.reload()" class="btn btn-outline-danger btn-sm mt-2">
                <i class="fas fa-sync-alt"></i> 重试
            </button>
        `;
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
    const snapshot = await db.collection('logs')
        .where('action', '==', 'view_post')
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
    
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

// Load categories data
async function loadCategories() {
    const snapshot = await db.collection('categories')
        .orderBy('count', 'desc')
        .get();
    
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

// Update statistics cards
function updateStatistics(posts, views, comments) {
    // Update numbers
    document.getElementById('totalPosts').textContent = posts.length;
    document.getElementById('totalViews').textContent = views.length;
    document.getElementById('totalComments').textContent = comments.length;
    document.getElementById('activeUsers').textContent = 
        new Set(views.map(v => v.userId || v.visitorId)).size;

    // Update trends (comparing with previous period)
    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;
    const lastWeek = now.getTime() - (7 * dayMs);

    const recentPosts = posts.filter(p => p.timestamp?.toDate?.() > lastWeek || p.timestamp > lastWeek).length;
    const recentViews = views.filter(v => v.timestamp?.toDate?.() > lastWeek || v.timestamp > lastWeek).length;
    const recentComments = comments.filter(c => c.timestamp?.toDate?.() > lastWeek || c.timestamp > lastWeek).length;
    const recentUsers = new Set(
        views.filter(v => v.timestamp?.toDate?.() > lastWeek || v.timestamp > lastWeek)
            .map(v => v.userId || v.visitorId)
    ).size;

    updateTrend('postsTrend', recentPosts, posts.length);
    updateTrend('viewsTrend', recentViews, views.length);
    updateTrend('commentsTrend', recentComments, comments.length);
    updateTrend('usersTrend', recentUsers, 
        new Set(views.map(v => v.userId || v.visitorId)).size);
}

// Update trend indicator
function updateTrend(elementId, recent, total) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const weeklyRate = total === 0 ? 0 : (recent / total * 100).toFixed(1);
    const isUp = weeklyRate > 0;
    
    element.innerHTML = `
        <i class="fas fa-${isUp ? 'arrow-up' : 'arrow-down'}"></i>
        ${weeklyRate}%
    `;
    element.className = `trend-indicator ${isUp ? 'trend-up' : 'trend-down'}`;
}

// Update popular posts chart
function updatePopularPostsChart(posts) {
    const ctx = document.getElementById('popularPostsChart')?.getContext('2d');
    if (!ctx) return;
    
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
            labels: topPosts.map(post => truncateString(post.title || '无标题', 20)),
            datasets: [{
                label: '浏览量',
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
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: (items) => {
                            const index = items[0].dataIndex;
                            return topPosts[index].title || '无标题';
                        }
                    }
                }
            }
        }
    });
}

// Update categories chart
function updateCategoriesChart(categories) {
    const ctx = document.getElementById('categoriesChart')?.getContext('2d');
    if (!ctx) return;
    
    if (charts.categories) {
        charts.categories.destroy();
    }

    const colors = [
        '#4CAF50', '#2196F3', '#FFC107', '#9C27B0', '#F44336',
        '#FF9800', '#795548', '#607D8B', '#E91E63', '#00BCD4'
    ];

    charts.categories = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories.map(cat => cat.name),
            datasets: [{
                data: categories.map(cat => cat.count || 0),
                backgroundColor: categories.map((_, i) => colors[i % colors.length])
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Update weekly activity chart
function updateWeeklyActivityChart(views) {
    const ctx = document.getElementById('weeklyActivityChart')?.getContext('2d');
    if (!ctx) return;
    
    // Group views by day of week
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const viewsByDay = new Array(7).fill(0);
    
    views.forEach(view => {
        const timestamp = view.timestamp?.toDate?.() || new Date(view.timestamp);
        const day = timestamp.getDay();
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
                label: '访问量',
                data: viewsByDay,
                borderColor: '#2196F3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                fill: true
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
    const ctx = document.getElementById('engagementChart')?.getContext('2d');
    if (!ctx) return;

    // Calculate engagement metrics
    const postsWithComments = posts.filter(post => 
        Object.keys(post.comments || {}).length > 0
    ).length;

    const avgCommentsPerPost = posts.length === 0 ? 0 : 
        (comments.length / posts.length).toFixed(1);

    const engagementRate = posts.length === 0 ? 0 :
        ((postsWithComments / posts.length) * 100).toFixed(1);

    if (charts.engagement) {
        charts.engagement.destroy();
    }

    charts.engagement = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['评论总数', '平均评论数', '互动率 (%)', '活跃文章数'],
            datasets: [{
                label: '互动指标',
                data: [
                    comments.length,
                    avgCommentsPerPost,
                    engagementRate,
                    postsWithComments
                ],
                borderColor: '#9C27B0',
                backgroundColor: 'rgba(156, 39, 176, 0.2)'
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
    const tableBody = document.querySelector('#latestPostsTable tbody');
    if (!tableBody) return;

    // Sort posts by timestamp
    const latestPosts = posts
        .sort((a, b) => {
            const timeA = a.timestamp?.toDate?.() || new Date(a.timestamp);
            const timeB = b.timestamp?.toDate?.() || new Date(b.timestamp);
            return timeB - timeA;
        })
        .slice(0, 5);

    if (latestPosts.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">
                    <div class="alert alert-info mb-0">
                        还没有任何文章
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = latestPosts.map(post => {
        const timestamp = post.timestamp?.toDate?.() || new Date(post.timestamp);
        const date = timestamp.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `
            <tr>
                <td>
                    <a href="post.html?id=${post.id}" class="text-decoration-none">
                        ${post.title || '无标题'}
                    </a>
                </td>
                <td>${date}</td>
                <td>${post.views || 0}</td>
                <td>${Object.keys(post.comments || {}).length}</td>
            </tr>
        `;
    }).join('');
}

// Helper function to truncate strings
function truncateString(str, length) {
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
}
