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

// Initialize Quill editor
const quill = new Quill('#editor', {
    theme: 'snow',
    modules: {
        toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'color': [] }, { 'background': [] }],
            ['link', 'image'],
            ['clean']
        ]
    }
});

// Initialize Bootstrap modals
const postModal = new bootstrap.Modal(document.getElementById('postModal'));
const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

// Check authentication
auth.onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Initialize page
    feather.replace();
    loadPosts();
});

// Load posts
async function loadPosts() {
    try {
        const snapshot = await db.collection('posts')
            .orderBy('timestamp', 'desc')
            .get();
        
        const tbody = document.getElementById('postsList');
        tbody.innerHTML = '';
        
        snapshot.forEach(doc => {
            const post = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${post.title}</td>
                <td>${post.author || 'Anonymous'}</td>
                <td>${new Date(post.timestamp).toLocaleString()}</td>
                <td>${post.views || 0}</td>
                <td><span class="badge bg-${post.status === 'published' ? 'success' : 'warning'}">${post.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editPost('${doc.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deletePost('${doc.id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading posts:', error);
        alert('Error loading posts. Please try again.');
    }
}

// Create/Edit post
let currentPostId = null;

document.getElementById('title').addEventListener('input', (e) => {
    const slug = e.target.value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    document.getElementById('slug').value = slug;
});

document.getElementById('btnSave').addEventListener('click', async () => {
    const title = document.getElementById('title').value;
    const slug = document.getElementById('slug').value;
    const content = quill.root.innerHTML;
    const status = document.querySelector('input[name="status"]:checked').value;
    
    if (!title || !slug || !content) {
        alert('Please fill in all required fields.');
        return;
    }
    
    try {
        const postData = {
            title,
            slug,
            content,
            status,
            timestamp: Date.now(),
            lastModified: Date.now()
        };
        
        if (!currentPostId) {
            // Create new post
            await db.collection('posts').add(postData);
            
            // Log activity
            await db.collection('logs').add({
                action: 'create_post',
                details: `Created post: ${title}`,
                timestamp: Date.now(),
                userId: auth.currentUser.uid
            });
        } else {
            // Update existing post
            await db.collection('posts').doc(currentPostId).update(postData);
            
            // Log activity
            await db.collection('logs').add({
                action: 'update_post',
                details: `Updated post: ${title}`,
                timestamp: Date.now(),
                userId: auth.currentUser.uid
            });
        }
        
        postModal.hide();
        loadPosts();
    } catch (error) {
        console.error('Error saving post:', error);
        alert('Error saving post. Please try again.');
    }
});

// Edit post
async function editPost(postId) {
    try {
        const doc = await db.collection('posts').doc(postId).get();
        if (!doc.exists) {
            alert('Post not found.');
            return;
        }
        
        const post = doc.data();
        currentPostId = postId;
        
        document.getElementById('modalTitle').textContent = 'Edit Post';
        document.getElementById('title').value = post.title;
        document.getElementById('slug').value = post.slug;
        quill.root.innerHTML = post.content;
        document.querySelector(`input[name="status"][value="${post.status}"]`).checked = true;
        
        postModal.show();
    } catch (error) {
        console.error('Error loading post:', error);
        alert('Error loading post. Please try again.');
    }
}

// Delete post
let postToDelete = null;

function deletePost(postId) {
    postToDelete = postId;
    deleteModal.show();
}

document.getElementById('btnConfirmDelete').addEventListener('click', async () => {
    if (!postToDelete) return;
    
    try {
        await db.collection('posts').doc(postToDelete).delete();
        
        // Log activity
        await db.collection('logs').add({
            action: 'delete_post',
            details: `Deleted post ID: ${postToDelete}`,
            timestamp: Date.now(),
            userId: auth.currentUser.uid
        });
        
        deleteModal.hide();
        loadPosts();
    } catch (error) {
        console.error('Error deleting post:', error);
        alert('Error deleting post. Please try again.');
    }
});

// Reset form when modal is closed
document.getElementById('postModal').addEventListener('hidden.bs.modal', () => {
    currentPostId = null;
    document.getElementById('modalTitle').textContent = 'New Post';
    document.getElementById('postForm').reset();
    quill.root.innerHTML = '';
});
