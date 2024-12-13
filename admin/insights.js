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
const auth = firebase.auth();

// Global variables
let currentPeriod = 30;
let charts = {};

// Check authentication
auth.onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Initialize page
    feather.replace();
    loadAllData();
});

// Load all data and update charts
async function loadAllData() {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - currentPeriod);
        
        const [
            posts,
            visitors,
            comments,
            chats,
            categories
        ] = await Promise.all([
            loadPosts(startDate, endDate),
            loadVisitors(startDate, endDate),
            loadComments(startDate, endDate),
            loadChats(startDate, endDate),
            loadCategories()
        ]);
        
        updateStatistics(posts, visitors, comments, chats);
        updatePerformanceChart(posts, visitors, comments);
        updateEngagementChart(visitors, comments, chats);
        updateTopPostsChart(posts);
        updateChatActivityChart(chats);
        updateUserActivityChart(visitors);
        updateCategoriesChart(categories);
        updateInteractionChart(comments, chats);
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Error loading data. Please try again.');
    }
}

// Load posts data
async function loadPosts(startDate, endDate) {
    const snapshot = await db.collection('posts')
        .where('timestamp', '>=', startDate.getTime())
        .where('timestamp', '<=', endDate.getTime())
        .get();
    
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

// Load visitors data
async function loadVisitors(startDate, endDate) {
    const snapshot = await db.collection('visitors')
        .where('timestamp', '>=', startDate.getTime())
        .where('timestamp', '<=', endDate.getTime())
        .get();
    
    return snapshot.docs.map(doc => doc.data());
}

// Load comments data
async function loadComments(startDate, endDate) {
    const snapshot = await db.collection('comments')
        .where('timestamp', '>=', startDate.getTime())
        .where('timestamp', '<=', endDate.getTime())
        .get();
    
    return snapshot.docs.map(doc => doc.data());
}

// Load chat messages data
async function loadChats(startDate, endDate) {
    const snapshot = await db.collection('chats')
        .where('timestamp', '>=', startDate.getTime())
        .where('timestamp', '<=', endDate.getTime())
        .get();
    
    return snapshot.docs.map(doc => doc.data());
}

// Load categories data
async function loadCategories() {
    const snapshot = await db.collection('categories').get();
    return snapshot.docs.map(doc => doc.data());
}

// Update statistics cards
function updateStatistics(posts, visitors, comments, chats) {
    // Calculate growth percentages
    const prevPeriodStart = new Date();
    prevPeriodStart.setDate(prevPeriodStart.getDate() - (currentPeriod * 2));
    
    document.getElementById('totalPosts').textContent = posts.length;
    document.getElementById('totalViews').textContent = visitors.length;
    document.getElementById('totalComments').textContent = comments.length;
    document.getElementById('totalChats').textContent = chats.length;
    
    // Update growth indicators (placeholder values for now)
    document.getElementById('postsGrowth').textContent = '12%';
    document.getElementById('viewsGrowth').textContent = '25%';
    document.getElementById('commentsGrowth').textContent = '8%';
    document.getElementById('chatsGrowth').textContent = '15%';
}

// Update performance chart
function updatePerformanceChart(posts, visitors, comments) {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    
    const dailyData = {};
    const days = [];
    
    // Initialize data structure
    for (let i = 0; i < currentPeriod; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        days.unshift(dateStr);
        dailyData[dateStr] = {
            posts: 0,
            views: 0,
            comments: 0
        };
    }
    
    // Aggregate data
    posts.forEach(post => {
        const date = new Date(post.timestamp).toISOString().split('T')[0];
        if (dailyData[date]) dailyData[date].posts++;
    });
    
    visitors.forEach(visitor => {
        const date = new Date(visitor.timestamp).toISOString().split('T')[0];
        if (dailyData[date]) dailyData[date].views++;
    });
    
    comments.forEach(comment => {
        const date = new Date(comment.timestamp).toISOString().split('T')[0];
        if (dailyData[date]) dailyData[date].comments++;
    });
    
    // Create chart
    if (charts.performance) charts.performance.destroy();
    charts.performance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: days,
            datasets: [
                {
                    label: 'Posts',
                    data: days.map(day => dailyData[day].posts),
                    borderColor: '#007bff',
                    tension: 0.1
                },
                {
                    label: 'Views',
                    data: days.map(day => dailyData[day].views),
                    borderColor: '#28a745',
                    tension: 0.1
                },
                {
                    label: 'Comments',
                    data: days.map(day => dailyData[day].comments),
                    borderColor: '#ffc107',
                    tension: 0.1
                }
            ]
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

// Update engagement distribution chart
function updateEngagementChart(visitors, comments, chats) {
    const ctx = document.getElementById('engagementChart').getContext('2d');
    
    if (charts.engagement) charts.engagement.destroy();
    charts.engagement = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Views', 'Comments', 'Chat Messages'],
            datasets: [{
                data: [visitors.length, comments.length, chats.length],
                backgroundColor: ['#28a745', '#ffc107', '#17a2b8']
            }]
        },
        options: {
            responsive: true
        }
    });
}

// Update top posts chart
function updateTopPostsChart(posts) {
    const ctx = document.getElementById('topPostsChart').getContext('2d');
    
    // Sort posts by views
    const topPosts = posts
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5);
    
    if (charts.topPosts) charts.topPosts.destroy();
    charts.topPosts = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topPosts.map(post => post.title),
            datasets: [{
                label: 'Views',
                data: topPosts.map(post => post.views || 0),
                backgroundColor: '#007bff'
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

// Update chat activity chart
function updateChatActivityChart(chats) {
    const ctx = document.getElementById('chatActivityChart').getContext('2d');
    
    // Initialize hourly data
    const hourlyData = Array(24).fill(0);
    
    // Aggregate chat messages by hour
    chats.forEach(chat => {
        const hour = new Date(chat.timestamp).getHours();
        hourlyData[hour]++;
    });
    
    if (charts.chatActivity) charts.chatActivity.destroy();
    charts.chatActivity = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: 24}, (_, i) => `${i}:00`),
            datasets: [{
                label: 'Messages',
                data: hourlyData,
                borderColor: '#17a2b8',
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

// Update user activity chart
function updateUserActivityChart(visitors) {
    const ctx = document.getElementById('userActivityChart').getContext('2d');
    
    // Initialize daily data
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyData = Array(7).fill(0);
    
    // Aggregate visitors by day of week
    visitors.forEach(visitor => {
        const day = new Date(visitor.timestamp).getDay();
        dailyData[day]++;
    });
    
    if (charts.userActivity) charts.userActivity.destroy();
    charts.userActivity = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [{
                label: 'Visitors',
                data: dailyData,
                backgroundColor: '#6f42c1'
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
    
    if (charts.categories) charts.categories.destroy();
    charts.categories = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categories.map(cat => cat.name),
            datasets: [{
                data: categories.map(cat => cat.count || 0),
                backgroundColor: [
                    '#007bff',
                    '#28a745',
                    '#ffc107',
                    '#17a2b8',
                    '#6f42c1',
                    '#e83e8c'
                ]
            }]
        },
        options: {
            responsive: true
        }
    });
}

// Update interaction types chart
function updateInteractionChart(comments, chats) {
    const ctx = document.getElementById('interactionChart').getContext('2d');
    
    if (charts.interaction) charts.interaction.destroy();
    charts.interaction = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Comments', 'Chat Messages', 'Reactions', 'Shares'],
            datasets: [{
                label: 'Interactions',
                data: [
                    comments.length,
                    chats.length,
                    comments.filter(c => c.reactions).length,
                    comments.filter(c => c.shared).length
                ],
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: '#36a2eb'
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

// Handle period change
document.querySelectorAll('[data-period]').forEach(element => {
    element.addEventListener('click', (e) => {
        e.preventDefault();
        currentPeriod = parseInt(e.target.dataset.period);
        document.getElementById('periodDropdown').textContent = 
            e.target.textContent;
        loadAllData();
    });
});

// Export data
document.getElementById('btnExportData').addEventListener('click', async () => {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - currentPeriod);
        
        const [posts, visitors, comments, chats] = await Promise.all([
            loadPosts(startDate, endDate),
            loadVisitors(startDate, endDate),
            loadComments(startDate, endDate),
            loadChats(startDate, endDate)
        ]);
        
        const data = {
            period: {
                start: startDate.toISOString(),
                end: endDate.toISOString()
            },
            statistics: {
                totalPosts: posts.length,
                totalViews: visitors.length,
                totalComments: comments.length,
                totalChats: chats.length
            },
            posts,
            visitors,
            comments,
            chats
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], 
            { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `insights_${new Date().toISOString()}.json`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Error exporting data. Please try again.');
    }
});
