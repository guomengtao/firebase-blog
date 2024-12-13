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
const analytics = firebase.analytics();

// Check authentication state
auth.onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Check if user is admin
    db.collection('managers').doc(user.uid).get()
        .then((doc) => {
            if (!doc.exists || !doc.data().isAdmin) {
                // Hide admin-only elements
                document.getElementById('managers-nav').style.display = 'none';
            }
            loadDashboard();
        });
});

// Logout handler
document.getElementById('btnLogout').addEventListener('click', () => {
    auth.signOut().then(() => {
        window.location.href = 'login.html';
    });
});

// Load dashboard data
async function loadDashboard() {
    // Initialize Feather icons
    feather.replace();

    // Load statistics
    loadStats();
    
    // Load charts
    loadVisitorChart();
    loadPostsChart();
    
    // Load recent activity
    loadRecentActivity();
}

// Load statistics
async function loadStats() {
    try {
        // Get total posts
        const postsSnapshot = await db.collection('posts').get();
        document.getElementById('totalPosts').textContent = postsSnapshot.size;

        // Get total visitors (unique users)
        const visitorsSnapshot = await db.collection('visitors').get();
        document.getElementById('totalVisitors').textContent = visitorsSnapshot.size;

        // Get today's views
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const viewsSnapshot = await db.collection('pageViews')
            .where('timestamp', '>=', today)
            .get();
        document.getElementById('todayViews').textContent = viewsSnapshot.size;

        // Get active users (users who visited in the last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const activeSnapshot = await db.collection('visitors')
            .where('lastActive', '>=', fiveMinutesAgo)
            .get();
        document.getElementById('activeUsers').textContent = activeSnapshot.size;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load visitor chart
async function loadVisitorChart() {
    try {
        // Get last 7 days of visitor data
        const dates = [];
        const visitors = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            
            const snapshot = await db.collection('pageViews')
                .where('timestamp', '>=', date)
                .where('timestamp', '<', nextDate)
                .get();
            
            dates.push(date.toLocaleDateString());
            visitors.push(snapshot.size);
        }
        
        new Chart(document.getElementById('visitorChart'), {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Daily Visitors',
                    data: visitors,
                    fill: false,
                    borderColor: 'rgb(75, 192, 192)',
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
    } catch (error) {
        console.error('Error loading visitor chart:', error);
    }
}

// Load posts chart
async function loadPostsChart() {
    try {
        const snapshot = await db.collection('posts')
            .orderBy('views', 'desc')
            .limit(5)
            .get();
        
        const titles = [];
        const views = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            titles.push(data.title);
            views.push(data.views || 0);
        });
        
        new Chart(document.getElementById('postsChart'), {
            type: 'bar',
            data: {
                labels: titles,
                datasets: [{
                    label: 'Post Views',
                    data: views,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1
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
    } catch (error) {
        console.error('Error loading posts chart:', error);
    }
}

// Load recent activity
async function loadRecentActivity() {
    try {
        const snapshot = await db.collection('logs')
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();
        
        const tbody = document.getElementById('recentActivity');
        tbody.innerHTML = '';
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(data.timestamp).toLocaleString()}</td>
                <td>${data.action}</td>
                <td>${data.details}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

// Refresh dashboard data every 5 minutes
setInterval(loadDashboard, 5 * 60 * 1000);
