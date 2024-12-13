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
const storage = firebase.storage();

// Constants
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_IMAGE_DIMENSION = 1920;
const STORAGE_LIMIT = 5 * 1024 * 1024 * 1024; // 5GB

// DOM Elements
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const uploadList = document.getElementById('uploadList');
const imageGallery = document.getElementById('imageGallery');
const errorLog = document.getElementById('errorLog');
const storageBarFill = document.getElementById('storageBarFill');
const storageUsage = document.getElementById('storageUsage');

// Drag and drop handling
uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    handleFiles(files);
});

uploadZone.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
    fileInput.value = ''; // Reset input
});

// Handle multiple file uploads
async function handleFiles(files) {
    for (const file of files) {
        if (file.size > MAX_IMAGE_SIZE) {
            showError(`文件 ${file.name} 太大（最大 ${MAX_IMAGE_SIZE/1024/1024}MB）`);
            continue;
        }
        
        const uploadItem = createUploadItem(file);
        uploadList.appendChild(uploadItem);
        
        try {
            await uploadImage(file, uploadItem);
        } catch (error) {
            console.error('Upload error:', error);
            updateUploadStatus(uploadItem, 'error', error.message);
        }
    }
    
    // Refresh gallery and storage info
    loadImages();
    checkStorageUsage();
}

// Create upload item UI
function createUploadItem(file) {
    const item = document.createElement('div');
    item.className = 'upload-item';
    item.innerHTML = `
        <span>${file.name}</span>
        <div class="progress">
            <div class="progress-bar"></div>
        </div>
        <span class="status">准备上传...</span>
    `;
    return item;
}

// Update upload status UI
function updateUploadStatus(uploadItem, status, message) {
    const statusElement = uploadItem.querySelector('.status');
    statusElement.textContent = message;
    statusElement.className = 'status ' + status;
}

// Compress image before upload
async function compressImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
                    if (width > height) {
                        height *= MAX_IMAGE_DIMENSION / width;
                        width = MAX_IMAGE_DIMENSION;
                    } else {
                        width *= MAX_IMAGE_DIMENSION / height;
                        height = MAX_IMAGE_DIMENSION;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', 0.8);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Upload image to Firebase Storage
async function uploadImage(file, uploadItem) {
    const compressedImage = await compressImage(file);
    const fileName = `uploads/${Date.now()}_${file.name}`;
    const storageRef = storage.ref(fileName);
    
    const uploadTask = storageRef.put(compressedImage);
    
    uploadTask.on('state_changed',
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            uploadItem.querySelector('.progress-bar').style.width = progress + '%';
            updateUploadStatus(uploadItem, '', `上传中 ${progress.toFixed(1)}%`);
        },
        (error) => {
            throw error;
        },
        async () => {
            const url = await storageRef.getDownloadURL();
            const metadata = await storageRef.getMetadata();
            updateUploadStatus(uploadItem, 'success', '上传完成');
            
            // Add to gallery immediately
            addImageToGallery({
                name: file.name,
                url: url,
                timestamp: metadata.timeCreated,
                size: metadata.size,
                fullPath: metadata.fullPath
            });
        }
    );
}

// Load all images from storage
async function loadImages() {
    try {
        imageGallery.innerHTML = ''; // Clear gallery
        
        const result = await storage.ref('uploads').listAll();
        
        for (const item of result.items) {
            const url = await item.getDownloadURL();
            const metadata = await item.getMetadata();
            
            addImageToGallery({
                name: metadata.name,
                url: url,
                timestamp: metadata.timeCreated,
                size: metadata.size,
                fullPath: metadata.fullPath
            });
        }
    } catch (error) {
        console.error('Error loading images:', error);
        showError('加载图片失败: ' + error.message);
    }
}

// Add image to gallery
function addImageToGallery(image) {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    
    const date = new Date(image.timestamp);
    const size = (image.size / 1024).toFixed(1) + ' KB';
    
    item.innerHTML = `
        <img src="${image.url}" alt="${image.name}">
        <div class="info">
            <div>${image.name}</div>
            <div>上传时间：${date.toLocaleString()}</div>
            <div>大小：${size}</div>
        </div>
        <div class="delete" data-path="${image.fullPath}">&times;</div>
    `;
    
    // Add delete handler
    item.querySelector('.delete').addEventListener('click', async (e) => {
        if (confirm('确定要删除这张图片吗？')) {
            try {
                const path = e.target.dataset.path;
                await storage.ref(path).delete();
                item.remove();
                checkStorageUsage();
            } catch (error) {
                console.error('Error deleting image:', error);
                showError('删除图片失败: ' + error.message);
            }
        }
    });
    
    imageGallery.insertBefore(item, imageGallery.firstChild);
}

// Check storage usage
async function checkStorageUsage() {
    try {
        const result = await storage.ref().listAll();
        let totalSize = 0;
        
        for (const item of result.items) {
            const metadata = await item.getMetadata();
            totalSize += metadata.size;
        }
        
        const usagePercent = (totalSize / STORAGE_LIMIT) * 100;
        storageBarFill.style.width = usagePercent + '%';
        
        const usageText = `${(totalSize / 1024 / 1024).toFixed(2)}MB / ${STORAGE_LIMIT/1024/1024/1024}GB`;
        storageUsage.textContent = usageText;
        
        if (usagePercent > 80) {
            storageBarFill.style.backgroundColor = '#f44336';
            showError('警告：存储空间使用量接近限制');
        }
    } catch (error) {
        console.error('Error checking storage:', error);
        showError('检查存储空间失败: ' + error.message);
    }
}

// Show error message
function showError(message) {
    errorLog.style.display = 'block';
    errorLog.textContent = message;
    setTimeout(() => {
        errorLog.style.display = 'none';
    }, 5000);
}

// Initial load
loadImages();
checkStorageUsage();
