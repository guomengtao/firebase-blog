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
const storage = firebase.storage();

// DOM Elements
const blogForm = document.getElementById('blogForm');
const titleInput = document.getElementById('title');
const urlSlugInput = document.getElementById('urlSlug');
const coverImageInput = document.getElementById('coverImage');
const coverPreview = document.getElementById('coverPreview');
const tagInput = document.getElementById('tagInput');
const tagsContainer = document.getElementById('tagsContainer');
const contentEditor = document.getElementById('content');
const loadingDiv = document.querySelector('.loading');
const imageUpload = document.getElementById('imageUpload');
const imageButton = document.getElementById('imageButton');

// Editor toolbar
document.querySelectorAll('.toolbar button[data-command]').forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        const command = button.dataset.command;
        
        if (command === 'createLink') {
            const url = prompt('输入链接地址：');
            if (url) document.execCommand(command, false, url);
        } else {
            document.execCommand(command, false, null);
        }
        
        contentEditor.focus();
    });
});

// Image handling
imageButton.addEventListener('click', () => imageUpload.click());

imageUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        await uploadAndInsertImage(file);
    }
});

// Handle paste events for images
contentEditor.addEventListener('paste', async (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    
    for (let item of items) {
        if (item.type.indexOf('image') === 0) {
            e.preventDefault();
            const file = item.getAsFile();
            await uploadAndInsertImage(file);
        }
    }
});

// Upload and insert image
async function uploadAndInsertImage(file) {
    try {
        const fileName = `blog_images/${Date.now()}_${file.name}`;
        const storageRef = storage.ref(fileName);
        
        await storageRef.put(file);
        const url = await storageRef.getDownloadURL();
        
        document.execCommand('insertImage', false, url);
    } catch (error) {
        console.error('Error uploading image:', error);
        alert('图片上传失败: ' + error.message);
    }
}

// Tags handling
let tags = new Set();

tagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const tag = tagInput.value.trim();
        if (tag && !tags.has(tag)) {
            tags.add(tag);
            renderTags();
        }
        tagInput.value = '';
    }
});

function renderTags() {
    tagsContainer.innerHTML = '';
    tags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'tag';
        tagElement.innerHTML = `
            ${tag}
            <span class="remove" onclick="removeTag('${tag}')">&times;</span>
        `;
        tagsContainer.appendChild(tagElement);
    });
}

function removeTag(tag) {
    tags.delete(tag);
    renderTags();
}

// Cover image preview
coverImageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            coverPreview.innerHTML = `<img src="${e.target.result}" alt="Cover preview">`;
        };
        reader.readAsDataURL(file);
    }
});

// Generate URL slug from title
titleInput.addEventListener('input', () => {
    if (!urlSlugInput.value) {
        urlSlugInput.value = titleInput.value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
});

// Form submission
blogForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loadingDiv.style.display = 'flex';

    try {
        // Upload cover image if selected
        let coverImageUrl = '';
        if (coverImageInput.files.length > 0) {
            const file = coverImageInput.files[0];
            const fileName = `covers/${Date.now()}_${file.name}`;
            const storageRef = storage.ref(fileName);
            await storageRef.put(file);
            coverImageUrl = await storageRef.getDownloadURL();
        }

        // Create blog post document
        const post = {
            title: titleInput.value,
            urlSlug: urlSlugInput.value || generateUrlSlug(),
            coverImage: coverImageUrl,
            content: contentEditor.innerHTML,
            tags: Array.from(tags),
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Save to Firestore
        await db.collection('posts').add(post);

        // Redirect to home page
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error saving blog post:', error);
        alert('保存博客文章时出错: ' + error.message);
    } finally {
        loadingDiv.style.display = 'none';
    }
});

// Generate random URL slug if not provided
function generateUrlSlug() {
    return 'post-' + Date.now();
}
