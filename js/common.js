import { logPageView } from './visitor-stats.js';

// Common functionality for all pages
document.addEventListener('DOMContentLoaded', function() {
    // Log page view when the page loads
    const path = window.location.pathname;
    const cleanPath = path.replace(/^\//, '').replace('.html', '') || 'index';
    logPageView(cleanPath);

    // Initialize user menu
    initializeUserMenu();
    
    // Set active nav item
    setActiveNavItem();
});

function initializeUserMenu() {
    const userMenuContainer = document.getElementById('userMenuContainer');
    if (!userMenuContainer) return;

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // User is signed in
            userMenuContainer.innerHTML = `
                <div class="dropdown user-menu">
                    <button class="btn btn-link nav-link dropdown-toggle" type="button" id="userDropdown" data-bs-toggle="dropdown">
                        <img src="${user.photoURL || 'https://via.placeholder.com/32'}" alt="${user.displayName || user.email}" 
                            class="rounded-circle" width="32" height="32">
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li class="dropdown-item-text">
                            <div class="d-flex align-items-center">
                                <img src="${user.photoURL || 'https://via.placeholder.com/40'}" alt="${user.displayName || user.email}" 
                                    class="rounded-circle me-2" width="40" height="40">
                                <div>
                                    <div class="fw-bold">${user.displayName || 'User'}</div>
                                    <small class="text-muted">${user.email}</small>
                                </div>
                            </div>
                        </li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="profile.html"><i class="fas fa-user"></i> Profile</a></li>
                        <li><a class="dropdown-item" href="upload.html"><i class="fas fa-cloud-upload-alt"></i> Upload</a></li>
                        ${isAdmin(user) ? `
                            <li><a class="dropdown-item" href="editor.html"><i class="fas fa-edit"></i> New Post</a></li>
                            <li><a class="dropdown-item" href="firebase-status.html"><i class="fas fa-chart-line"></i> Status</a></li>
                        ` : ''}
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#" onclick="signOut()"><i class="fas fa-sign-out-alt"></i> Sign Out</a></li>
                    </ul>
                </div>
            `;
        } else {
            // User is signed out
            userMenuContainer.innerHTML = `
                <button onclick="signIn()" class="btn btn-outline-light">
                    <i class="fas fa-sign-in-alt"></i> Sign In
                </button>
            `;
        }
    });
}

function setActiveNavItem() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
}

async function isAdmin(user) {
    if (!user) return false;
    
    try {
        const doc = await firebase.firestore().collection('managers').doc(user.uid).get();
        return doc.exists && doc.data().isAdmin === true;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

function signIn() {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).catch(function(error) {
        console.error('Error signing in:', error);
        alert('Error signing in: ' + error.message);
    });
}

function signOut() {
    firebase.auth().signOut().catch(function(error) {
        console.error('Error signing out:', error);
        alert('Error signing out: ' + error.message);
    });
}
