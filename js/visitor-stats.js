import { db } from './firebase-init.js';

// Initialize Chart.js
let visitorChart;

document.addEventListener('DOMContentLoaded', function() {
    loadVisitorStats();
    loadPageViews();
});

async function loadVisitorStats() {
    try {
        showLoading(true);
        hideError();

        // Get total visitors
        const totalVisitors = await getTotalVisitors();
        updateTotalVisitors(totalVisitors);

        // Get visitor trends
        const trends = await getVisitorTrends();
        updateVisitorChart(trends);

        showLoading(false);
    } catch (error) {
        console.error('Error loading visitor stats:', error);
        showError(window.fb.handleFirestoreError(error));
        showLoading(false);
    }
}

async function getTotalVisitors() {
    const statsDoc = await db.collection('statistics').doc('visitors').get();
    if (!statsDoc.exists) {
        await db.collection('statistics').doc('visitors').set({ total: 0 });
        return 0;
    }
    return statsDoc.data().total;
}

async function getVisitorTrends() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    const visitsSnapshot = await db.collection('visits')
        .where('timestamp', '>=', thirtyDaysAgo)
        .orderBy('timestamp', 'asc')
        .get();

    // Group visits by date
    const visitsByDate = {};
    visitsSnapshot.docs.forEach(doc => {
        const date = doc.data().timestamp.toDate().toLocaleDateString();
        visitsByDate[date] = (visitsByDate[date] || 0) + 1;
    });

    // Fill in missing dates with zero visits
    const trends = [];
    for (let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
        const date = d.toLocaleDateString();
        trends.push({
            date: date,
            visits: visitsByDate[date] || 0
        });
    }

    return trends;
}

async function loadPageViews() {
    try {
        const pageViewsSnapshot = await db.collection('pageViews')
            .orderBy('views', 'desc')
            .limit(10)
            .get();

        const pageViews = pageViewsSnapshot.docs.map(doc => ({
            path: doc.id,
            views: doc.data().views,
            lastVisited: doc.data().lastVisited?.toDate()
        }));

        updatePageViewsTable(pageViews);
    } catch (error) {
        console.error('Error loading page views:', error);
        showError(window.fb.handleFirestoreError(error));
    }
}

// Log page view
export async function logPageView(path) {
    try {
        const pageRef = db.collection('pageViews').doc(path);
        const visitRef = db.collection('visits').doc();
        const statsRef = db.collection('statistics').doc('visitors');

        await db.runTransaction(async (transaction) => {
            // Update page views
            const pageDoc = await transaction.get(pageRef);
            if (!pageDoc.exists) {
                transaction.set(pageRef, {
                    views: 1,
                    lastVisited: new Date()
                });
            } else {
                transaction.update(pageRef, {
                    views: pageDoc.data().views + 1,
                    lastVisited: new Date()
                });
            }

            // Log visit
            transaction.set(visitRef, {
                path: path,
                timestamp: new Date(),
                userAgent: navigator.userAgent
            });

            // Update total visitors
            const statsDoc = await transaction.get(statsRef);
            if (!statsDoc.exists) {
                transaction.set(statsRef, { total: 1 });
            } else {
                transaction.update(statsRef, {
                    total: statsDoc.data().total + 1
                });
            }
        });

    } catch (error) {
        console.error('Error logging page view:', error);
    }
}

function updateTotalVisitors(total) {
    const totalVisitorsElement = document.getElementById('totalVisitors');
    totalVisitorsElement.textContent = total.toLocaleString();
}

function updateVisitorChart(trends) {
    const ctx = document.getElementById('visitorChart').getContext('2d');
    
    if (visitorChart) {
        visitorChart.destroy();
    }

    visitorChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: trends.map(t => t.date),
            datasets: [{
                label: 'Daily Visitors',
                data: trends.map(t => t.visits),
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function updatePageViewsTable(pageViews) {
    const tableBody = document.getElementById('pageViewsBody');
    tableBody.innerHTML = pageViews.map(view => `
        <tr>
            <td>${view.path}</td>
            <td>${view.views.toLocaleString()}</td>
            <td>${view.lastVisited ? view.lastVisited.toLocaleString() : 'N/A'}</td>
        </tr>
    `).join('');
}

function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (show) {
        spinner.classList.remove('d-none');
    } else {
        spinner.classList.add('d-none');
    }
}

function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.classList.remove('d-none');
}

function hideError() {
    const errorElement = document.getElementById('errorMessage');
    errorElement.classList.add('d-none');
}
