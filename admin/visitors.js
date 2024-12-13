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
let currentPeriod = 7;
let visitorTrendsChart = null;
let trafficSourcesChart = null;

// Check authentication
auth.onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Initialize page
    feather.replace();
    loadAnalytics();
});

// Load analytics data
async function loadAnalytics() {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - currentPeriod);
        
        // Get visitors within date range
        const visitorsRef = db.collection('visitors')
            .where('timestamp', '>=', startDate.getTime())
            .where('timestamp', '<=', endDate.getTime());
            
        const snapshot = await visitorsRef.get();
        const visitors = [];
        snapshot.forEach(doc => visitors.push(doc.data()));
        
        updateOverviewStats(visitors);
        updateVisitorTrends(visitors);
        updateTrafficSources(visitors);
        updatePopularPages(visitors);
        updateVisitorDemographics(visitors);
        updateRecentVisitors(visitors);
    } catch (error) {
        console.error('Error loading analytics:', error);
        alert('Error loading analytics. Please try again.');
    }
}

// Update overview statistics
function updateOverviewStats(visitors) {
    const totalVisitors = visitors.length;
    
    // Calculate average time
    const avgTimeSpent = visitors.reduce((acc, v) => acc + (v.timeSpent || 0), 0) / totalVisitors;
    
    // Calculate bounce rate (visitors who viewed only one page)
    const bouncedVisitors = visitors.filter(v => v.pagesViewed === 1).length;
    const bounceRate = (bouncedVisitors / totalVisitors) * 100;
    
    // Calculate return rate (visitors who have visited before)
    const returnVisitors = visitors.filter(v => v.visitCount > 1).length;
    const returnRate = (returnVisitors / totalVisitors) * 100;
    
    document.getElementById('totalVisitors').textContent = totalVisitors;
    document.getElementById('avgTime').textContent = `${Math.round(avgTimeSpent / 60)} min`;
    document.getElementById('bounceRate').textContent = `${Math.round(bounceRate)}%`;
    document.getElementById('returnRate').textContent = `${Math.round(returnRate)}%`;
}

// Update visitor trends chart
function updateVisitorTrends(visitors) {
    const dailyVisitors = {};
    const labels = [];
    const data = [];
    
    // Initialize all days with 0 visitors
    for (let i = 0; i < currentPeriod; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyVisitors[dateStr] = 0;
    }
    
    // Count visitors per day
    visitors.forEach(visitor => {
        const date = new Date(visitor.timestamp).toISOString().split('T')[0];
        dailyVisitors[date] = (dailyVisitors[date] || 0) + 1;
    });
    
    // Prepare chart data
    Object.keys(dailyVisitors).sort().forEach(date => {
        labels.push(date);
        data.push(dailyVisitors[date]);
    });
    
    // Create/Update chart
    const ctx = document.getElementById('visitorTrends').getContext('2d');
    if (visitorTrendsChart) {
        visitorTrendsChart.destroy();
    }
    
    visitorTrendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Daily Visitors',
                data,
                borderColor: '#007bff',
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

// Update traffic sources chart
function updateTrafficSources(visitors) {
    const sources = {};
    visitors.forEach(visitor => {
        const source = visitor.source || 'Direct';
        sources[source] = (sources[source] || 0) + 1;
    });
    
    const labels = Object.keys(sources);
    const data = Object.values(sources);
    
    // Create/Update chart
    const ctx = document.getElementById('trafficSources').getContext('2d');
    if (trafficSourcesChart) {
        trafficSourcesChart.destroy();
    }
    
    trafficSourcesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: [
                    '#007bff',
                    '#28a745',
                    '#ffc107',
                    '#dc3545',
                    '#6c757d'
                ]
            }]
        },
        options: {
            responsive: true
        }
    });
}

// Update popular pages table
function updatePopularPages(visitors) {
    const pages = {};
    visitors.forEach(visitor => {
        visitor.pagesViewed?.forEach(page => {
            if (!pages[page.url]) {
                pages[page.url] = {
                    views: 0,
                    totalTime: 0
                };
            }
            pages[page.url].views++;
            pages[page.url].totalTime += page.timeSpent || 0;
        });
    });
    
    const tbody = document.getElementById('popularPages');
    tbody.innerHTML = '';
    
    Object.entries(pages)
        .sort((a, b) => b[1].views - a[1].views)
        .slice(0, 5)
        .forEach(([url, stats]) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${url}</td>
                <td>${stats.views}</td>
                <td>${Math.round(stats.totalTime / stats.views / 60)} min</td>
            `;
            tbody.appendChild(row);
        });
}

// Update visitor demographics table
function updateVisitorDemographics(visitors) {
    const countries = {};
    visitors.forEach(visitor => {
        const country = visitor.country || 'Unknown';
        countries[country] = (countries[country] || 0) + 1;
    });
    
    const tbody = document.getElementById('visitorDemographics');
    tbody.innerHTML = '';
    
    Object.entries(countries)
        .sort((a, b) => b[1] - a[1])
        .forEach(([country, count]) => {
            const percentage = (count / visitors.length * 100).toFixed(1);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${country}</td>
                <td>${count}</td>
                <td>${percentage}%</td>
            `;
            tbody.appendChild(row);
        });
}

// Update recent visitors table
function updateRecentVisitors(visitors) {
    const tbody = document.getElementById('recentVisitors');
    tbody.innerHTML = '';
    
    visitors
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10)
        .forEach(visitor => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(visitor.timestamp).toLocaleString()}</td>
                <td>${visitor.currentPage || '-'}</td>
                <td>${visitor.source || 'Direct'}</td>
                <td>${visitor.country || 'Unknown'}</td>
                <td>${visitor.device || 'Unknown'}</td>
                <td>${visitor.browser || 'Unknown'}</td>
            `;
            tbody.appendChild(row);
        });
}

// Handle period change
document.querySelectorAll('[data-period]').forEach(element => {
    element.addEventListener('click', (e) => {
        e.preventDefault();
        currentPeriod = parseInt(e.target.dataset.period);
        document.getElementById('periodDropdown').textContent = 
            e.target.textContent;
        loadAnalytics();
    });
});

// Export visitor data
document.getElementById('btnExportVisitors').addEventListener('click', async () => {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - currentPeriod);
        
        const visitors = await db.collection('visitors')
            .where('timestamp', '>=', startDate.getTime())
            .where('timestamp', '<=', endDate.getTime())
            .get();
            
        const csvContent = [
            ['Time', 'Page', 'Source', 'Country', 'Device', 'Browser', 'Time Spent', 'Pages Viewed']
        ];
        
        visitors.forEach(doc => {
            const visitor = doc.data();
            csvContent.push([
                new Date(visitor.timestamp).toLocaleString(),
                visitor.currentPage || '-',
                visitor.source || 'Direct',
                visitor.country || 'Unknown',
                visitor.device || 'Unknown',
                visitor.browser || 'Unknown',
                Math.round(visitor.timeSpent / 60) + ' min',
                visitor.pagesViewed || 1
            ]);
        });
        
        const csv = csvContent.map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `visitors_${new Date().toISOString()}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error exporting visitor data:', error);
        alert('Error exporting visitor data. Please try again.');
    }
});
