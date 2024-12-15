// Imgur API Configuration
const IMGUR_CLIENT_ID = '212b229cc73869d';
const IMGUR_API_URL = 'https://api.imgur.com/3/image';

// Firebase initialization
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const gallery = document.getElementById('gallery');
const loadingSpinner = document.getElementById('loadingSpinner');
const toastContainer = document.getElementById('toast-container');

// Event Listeners
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length > 0) {
        handleFiles(files);
    }
});

fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
});

// Functions
async function handleFiles(files) {
    if (!auth.currentUser) {
        showToast('Please sign in to upload images', 'danger');
        return;
    }

    loadingSpinner.style.display = 'flex';
    
    for (const file of files) {
        try {
            const imgurResponse = await uploadToImgur(file);
            await saveToFirestore(imgurResponse.data);
            showToast('Image uploaded successfully!', 'success');
        } catch (error) {
            console.error('Upload error:', error);
            showToast('Failed to upload image: ' + error.message, 'danger');
        }
    }

    loadingSpinner.style.display = 'none';
    loadGallery();
}

async function uploadToImgur(file) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(IMGUR_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Client-ID ${IMGUR_CLIENT_ID}`
        },
        body: formData
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

async function saveToFirestore(imgurData) {
    try {
        const user = auth.currentUser;
        
        // Save image data
        await db.collection('imgur_images').add({
            userId: user.uid,
            imgurId: imgurData.id,
            deleteHash: imgurData.deletehash,
            url: imgurData.link,
            thumbnailUrl: imgurData.link.replace(/\.(png|jpg|jpeg|gif)$/, 'm.$1'), // Medium thumbnail
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Log the upload
        await db.collection('logs').add({
            type: 'imgur_upload',
            action: 'image_upload',
            userId: user.uid,
            imgurId: imgurData.id,
            imageUrl: imgurData.link,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Firestore save error:', error);
        throw error;
    }
}

async function loadGallery() {
    try {
        const user = auth.currentUser;
        if (!user) {
            gallery.innerHTML = '<p class="text-center">Please sign in to view your uploads</p>';
            return;
        }

        const snapshot = await db.collection('imgur_images')
            .where('userId', '==', user.uid)
            .orderBy('timestamp', 'desc')
            .get();

        gallery.innerHTML = '';
        
        if (snapshot.empty) {
            gallery.innerHTML = '<p class="text-center">No images uploaded yet</p>';
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            const div = document.createElement('div');
            div.className = 'gallery-item';
            div.innerHTML = `
                <img src="${data.thumbnailUrl}" alt="Uploaded image">
                <div class="gallery-item-overlay">
                    <div>
                        <button class="btn btn-sm btn-outline-primary btn-icon" onclick="copyToClipboard('${data.url}')">
                            <i class="fas fa-copy"></i>
                        </button>
                        <a href="${data.url}" target="_blank" class="btn btn-sm btn-outline-secondary btn-icon">
                            <i class="fas fa-external-link-alt"></i>
                        </a>
                    </div>
                    <button class="btn btn-sm btn-outline-danger btn-icon" onclick="deleteImage('${doc.id}', '${data.deleteHash}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            gallery.appendChild(div);
        });
    } catch (error) {
        console.error('Error loading gallery:', error);
        showToast('Error loading gallery: ' + error.message, 'danger');
    }
}

async function deleteImage(docId, deleteHash) {
    if (!confirm('Are you sure you want to delete this image?')) {
        return;
    }

    try {
        loadingSpinner.style.display = 'flex';

        // Delete from Imgur
        const response = await fetch(`https://api.imgur.com/3/image/${deleteHash}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Client-ID ${IMGUR_CLIENT_ID}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Delete from Firestore
        await db.collection('imgur_images').doc(docId).delete();

        showToast('Image deleted successfully!', 'success');
        loadGallery();
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Failed to delete image: ' + error.message, 'danger');
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('URL copied to clipboard!', 'success');
    }).catch(err => {
        console.error('Copy failed:', err);
        showToast('Failed to copy URL', 'danger');
    });
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast, { autohide: true, delay: 3000 });
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// Initialize gallery when auth state changes
auth.onAuthStateChanged(user => {
    if (user) {
        loadGallery();
    } else {
        gallery.innerHTML = '<p class="text-center">Please sign in to view your uploads</p>';
    }
});
