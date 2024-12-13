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
let currentFilter = 'all';
const LOGS_PER_PAGE = 20;
let currentPage = 1;
let totalPages = 1;

// Check authentication
auth.onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Initialize page
    feather.replace();
    loadLogs();
    updateLogCounts();
});

// Load logs with pagination
async function loadLogs() {
    try {
        let query = db.collection('logs')
            .orderBy('timestamp', 'desc');
            
        if (currentFilter !== 'all') {
            query = query.where('type', '==', currentFilter);
        }
        
        // Get total count for pagination
        const snapshot = await query.get();
        const totalLogs = snapshot.size;
        totalPages = Math.ceil(totalLogs / LOGS_PER_PAGE);
        
        // Get paginated results
        query = query.limit(LOGS_PER_PAGE)
            .offset((currentPage - 1) * LOGS_PER_PAGE);
            
        const logs = await query.get();
        
        const tbody = document.getElementById('logsList');
        tbody.innerHTML = '';
        
        logs.forEach(doc => {
            const log = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(log.timestamp).toLocaleString()}</td>
                <td><span class="badge bg-${getLogTypeBadge(log.type)}">${log.type}</span></td>
                <td>${log.action}</td>
                <td>${log.userEmail || 'System'}</td>
                <td>${log.details}</td>
                <td>${log.ipAddress || '-'}</td>
            `;
            tbody.appendChild(row);
        });
        
        updatePagination();
    } catch (error) {
        console.error('Error loading logs:', error);
        alert('Error loading logs. Please try again.');
    }
}

// Update log counts
async function updateLogCounts() {
    try {
        const systemLogs = await db.collection('logs').where('type', '==', 'system').get();
        const userLogs = await db.collection('logs').where('type', '==', 'user').get();
        const errorLogs = await db.collection('logs').where('type', '==', 'error').get();
        const totalLogs = await db.collection('logs').get();
        
        document.getElementById('systemLogCount').textContent = systemLogs.size;
        document.getElementById('userLogCount').textContent = userLogs.size;
        document.getElementById('errorLogCount').textContent = errorLogs.size;
        document.getElementById('totalLogCount').textContent = totalLogs.size;
    } catch (error) {
        console.error('Error updating log counts:', error);
    }
}

// Update pagination controls
function updatePagination() {
    const pagination = document.getElementById('logsPagination');
    pagination.innerHTML = '';
    
    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `
        <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Previous</a>
    `;
    pagination.appendChild(prevLi);
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `
            <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
        `;
        pagination.appendChild(li);
    }
    
    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `
        <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a>
    `;
    pagination.appendChild(nextLi);
}

// Change page
function changePage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    loadLogs();
}

// Filter logs
document.querySelectorAll('[data-filter]').forEach(element => {
    element.addEventListener('click', (e) => {
        e.preventDefault();
        currentFilter = e.target.dataset.filter;
        currentPage = 1;
        document.getElementById('filterDropdown').textContent = 
            e.target.textContent;
        loadLogs();
    });
});

// Export logs
document.getElementById('btnExportLogs').addEventListener('click', async () => {
    try {
        const logs = await db.collection('logs')
            .orderBy('timestamp', 'desc')
            .get();
            
        const csvContent = [
            ['Timestamp', 'Type', 'Action', 'User', 'Details', 'IP Address']
        ];
        
        logs.forEach(doc => {
            const log = doc.data();
            csvContent.push([
                new Date(log.timestamp).toLocaleString(),
                log.type,
                log.action,
                log.userEmail || 'System',
                log.details,
                log.ipAddress || '-'
            ]);
        });
        
        const csv = csvContent.map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `logs_${new Date().toISOString()}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error exporting logs:', error);
        alert('Error exporting logs. Please try again.');
    }
});

// Helper function to get badge color based on log type
function getLogTypeBadge(type) {
    switch (type) {
        case 'system':
            return 'info';
        case 'user':
            return 'success';
        case 'error':
            return 'danger';
        default:
            return 'secondary';
    }
}
