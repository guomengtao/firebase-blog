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

// Initialize Bootstrap modals
const managerModal = new bootstrap.Modal(document.getElementById('managerModal'));
const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

// Check authentication and admin status
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    const doc = await db.collection('managers').doc(user.uid).get();
    if (!doc.exists || !doc.data().isAdmin) {
        window.location.href = 'index.html';
        return;
    }
    
    // Initialize page
    feather.replace();
    loadManagers();
});

// Load managers
async function loadManagers() {
    try {
        const snapshot = await db.collection('managers').get();
        
        const tbody = document.getElementById('managersList');
        tbody.innerHTML = '';
        
        snapshot.forEach(doc => {
            const manager = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${manager.email}</td>
                <td>${manager.isAdmin ? 'Admin' : 'Blog Manager'}</td>
                <td>${manager.lastLogin ? new Date(manager.lastLogin).toLocaleString() : 'Never'}</td>
                <td><span class="badge bg-${manager.active ? 'success' : 'secondary'}">${manager.active ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editManager('${doc.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteManager('${doc.id}')" ${doc.id === auth.currentUser.uid ? 'disabled' : ''}>Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading managers:', error);
        alert('Error loading managers. Please try again.');
    }
}

// Create/Edit manager
let currentManagerId = null;

document.getElementById('btnSave').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.querySelector('input[name="role"]:checked').value;
    
    if (!email || (!currentManagerId && !password)) {
        alert('Please fill in all required fields.');
        return;
    }
    
    try {
        let uid;
        
        if (!currentManagerId) {
            // Create new user
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            uid = userCredential.user.uid;
        } else {
            uid = currentManagerId;
            if (password) {
                // Update password if provided
                const user = await auth.getUserByEmail(email);
                await auth.updatePassword(user, password);
            }
        }
        
        // Update manager data
        await db.collection('managers').doc(uid).set({
            email,
            isAdmin: role === 'admin',
            active: true,
            lastModified: Date.now()
        }, { merge: true });
        
        // Log activity
        await db.collection('logs').add({
            action: currentManagerId ? 'update_manager' : 'create_manager',
            details: `${currentManagerId ? 'Updated' : 'Created'} manager: ${email}`,
            timestamp: Date.now(),
            userId: auth.currentUser.uid
        });
        
        managerModal.hide();
        loadManagers();
    } catch (error) {
        console.error('Error saving manager:', error);
        alert('Error saving manager. Please try again.');
    }
});

// Edit manager
async function editManager(managerId) {
    try {
        const doc = await db.collection('managers').doc(managerId).get();
        if (!doc.exists) {
            alert('Manager not found.');
            return;
        }
        
        const manager = doc.data();
        currentManagerId = managerId;
        
        document.getElementById('modalTitle').textContent = 'Edit Manager';
        document.getElementById('email').value = manager.email;
        document.getElementById('password').value = '';
        document.querySelector(`input[name="role"][value="${manager.isAdmin ? 'admin' : 'blog_manager'}"]`).checked = true;
        
        managerModal.show();
    } catch (error) {
        console.error('Error loading manager:', error);
        alert('Error loading manager. Please try again.');
    }
}

// Delete manager
let managerToDelete = null;

function deleteManager(managerId) {
    if (managerId === auth.currentUser.uid) return;
    managerToDelete = managerId;
    deleteModal.show();
}

document.getElementById('btnConfirmDelete').addEventListener('click', async () => {
    if (!managerToDelete) return;
    
    try {
        const doc = await db.collection('managers').doc(managerToDelete).get();
        const managerEmail = doc.data().email;
        
        // Delete from Authentication
        const user = await auth.getUserByEmail(managerEmail);
        await auth.deleteUser(user.uid);
        
        // Delete from Firestore
        await db.collection('managers').doc(managerToDelete).delete();
        
        // Log activity
        await db.collection('logs').add({
            action: 'delete_manager',
            details: `Deleted manager: ${managerEmail}`,
            timestamp: Date.now(),
            userId: auth.currentUser.uid
        });
        
        deleteModal.hide();
        loadManagers();
    } catch (error) {
        console.error('Error deleting manager:', error);
        alert('Error deleting manager. Please try again.');
    }
});

// Reset form when modal is closed
document.getElementById('managerModal').addEventListener('hidden.bs.modal', () => {
    currentManagerId = null;
    document.getElementById('modalTitle').textContent = 'Add Manager';
    document.getElementById('managerForm').reset();
});
