// Import db from firebase-init.js
import { db } from './firebase-init.js';

// Cloudinary configuration
const cloudName = 'dqxud2dnr';
const uploadPreset = 'ml_default';

// Initialize Firebase Auth
const auth = firebase.auth();

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewArea = document.getElementById('previewArea');
const previewImage = document.getElementById('previewImage');
const uploadButton = document.getElementById('uploadButton');
const cancelButton = document.getElementById('cancelButton');
const progressArea = document.getElementById('progressArea');
const progressBar = document.getElementById('progressBar');
const gallery = document.getElementById('gallery');

// Initialize Cloudinary Upload Widget
const myWidget = cloudinary.createUploadWidget(
    {
        cloudName: cloudName,
        uploadPreset: uploadPreset,
        sources: ['local', 'url', 'camera'],
        multiple: false,
        maxFiles: 1,
        cropping: true,
        croppingAspectRatio: 16/9,
        croppingShowDimensions: true,
        showAdvancedOptions: false,
        styles: {
            palette: {
                window: "#FFFFFF",
                windowBorder: "#90A0B3",
                tabIcon: "#0078FF",
                menuIcons: "#5A616A",
                textDark: "#000000",
                textLight: "#FFFFFF",
                link: "#0078FF",
                action: "#FF620C",
                inactiveTabIcon: "#0E2F5A",
                error: "#F44235",
                inProgress: "#0078FF",
                complete: "#20B832",
                sourceBg: "#E4EBF1"
            }
        }
    },
    (error, result) => {
        if (!error && result && result.event === "success") {
            const imageUrl = result.info.secure_url;
            saveImageToFirestore(imageUrl);
            loadGallery();
        }
    }
);

// Event Listeners
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#0d6efd';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = '#ccc';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#ccc';
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

uploadButton.addEventListener('click', () => {
    myWidget.open();
});

cancelButton.addEventListener('click', () => {
    resetUpload();
});

// Functions
function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        previewArea.classList.remove('d-none');
        uploadArea.classList.add('d-none');
    };
    reader.readAsDataURL(file);
}

function resetUpload() {
    fileInput.value = '';
    previewImage.src = '';
    previewArea.classList.add('d-none');
    uploadArea.classList.remove('d-none');
    progressArea.classList.add('d-none');
    progressBar.style.width = '0%';
}

async function saveImageToFirestore(imageUrl) {
    try {
        const user = auth.currentUser;
        if (!user) {
            alert('Please sign in to upload images');
            return;
        }

        await db.collection('images').add({
            url: imageUrl,
            userId: user.uid,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Create log entry
        await db.collection('logs').add({
            type: 'upload',
            action: 'image_upload',
            userId: user.uid,
            imageUrl: imageUrl,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

    } catch (error) {
        console.error('Error saving image:', error);
        alert('Error saving image. Please try again.');
    }
}

async function loadGallery() {
    try {
        const user = auth.currentUser;
        if (!user) {
            gallery.innerHTML = '<p>Please sign in to view your uploads</p>';
            return;
        }

        const snapshot = await db.collection('images')
            .where('userId', '==', user.uid)
            .orderBy('timestamp', 'desc')
            .get();

        gallery.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const div = document.createElement('div');
            div.className = 'gallery-item';
            div.innerHTML = `
                <img src="${data.url}" alt="Uploaded image">
                <button class="copy-url" data-clipboard-text="${data.url}">
                    <i class="fas fa-copy"></i>
                </button>
            `;
            gallery.appendChild(div);
        });

        // Initialize clipboard functionality
        new ClipboardJS('.copy-url').on('success', () => {
            alert('URL copied to clipboard!');
        });

    } catch (error) {
        console.error('Error loading gallery:', error);
        gallery.innerHTML = '<p>Error loading gallery. Please try again.</p>';
    }
}

// Check authentication state
auth.onAuthStateChanged(user => {
    if (user) {
        loadGallery();
    } else {
        gallery.innerHTML = '<p>Please sign in to view your uploads</p>';
    }
});
