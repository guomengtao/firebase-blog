import { db } from './firebase-init.js';

// Initialize Quill editor
const quill = new Quill('#editor-container', {
    theme: 'snow',
    modules: {
        toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'align': [] }],
            ['link', 'image', 'code-block'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['clean']
        ]
    }
});

// Tag management
const tagInput = document.getElementById('tagInput');
const tagInputField = tagInput.querySelector('input');
let tags = new Set();

tagInputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && tagInputField.value.trim()) {
        e.preventDefault();
        const tag = tagInputField.value.trim().toLowerCase();
        if (!tags.has(tag)) {
            tags.add(tag);
            const tagElement = document.createElement('span');
            tagElement.className = 'tag';
            tagElement.innerHTML = `
                ${tag}
                <span class="remove-tag" onclick="removeTag('${tag}')">&times;</span>
            `;
            tagInput.insertBefore(tagElement, tagInputField);
        }
        tagInputField.value = '';
    }
});

window.removeTag = function(tag) {
    tags.delete(tag);
    const tagElements = tagInput.getElementsByClassName('tag');
    for (let element of tagElements) {
        if (element.textContent.includes(tag)) {
            element.remove();
            break;
        }
    }
};

// Load drafts and published posts
async function loadPosts() {
    try {
        const drafts = await db.collection('posts')
            .where('status', '==', 'draft')
            .orderBy('timestamp', 'desc')
            .get();

        const published = await db.collection('posts')
            .where('status', '==', 'published')
            .orderBy('timestamp', 'desc')
            .get();

        updatePostsList(drafts.docs, 'draftsList', 'draft');
        updatePostsList(published.docs, 'publishedList', 'published');
    } catch (error) {
        console.error('Error loading posts:', error);
        showError(window.fb.handleFirestoreError(error));
    }
}

function updatePostsList(posts, containerId, status) {
    const container = document.getElementById(containerId);
    container.innerHTML = posts.map(post => `
        <li>
            <span class="status-indicator status-${status}"></span>
            <a href="#" onclick="loadPost('${post.id}'); return false;">
                ${post.data().title}
            </a>
        </li>
    `).join('');
}

// Load post for editing
window.loadPost = async function(postId) {
    try {
        showLoading(true);
        hideError();

        const doc = await db.collection('posts').doc(postId).get();
        if (doc.exists) {
            const post = doc.data();
            document.getElementById('title').value = post.title;
            document.getElementById('category').value = post.category || '';
            quill.setContents(post.content);
            
            // Load tags
            tags.clear();
            tagInput.querySelectorAll('.tag').forEach(el => el.remove());
            post.tags.forEach(tag => {
                tags.add(tag);
                const tagElement = document.createElement('span');
                tagElement.className = 'tag';
                tagElement.innerHTML = `
                    ${tag}
                    <span class="remove-tag" onclick="removeTag('${tag}')">&times;</span>
                `;
                tagInput.insertBefore(tagElement, tagInputField);
            });

            // Load cover image
            if (post.coverImage) {
                document.getElementById('coverImageUrl').value = post.coverImage;
                const preview = document.getElementById('coverImagePreview');
                preview.src = post.coverImage;
                preview.classList.remove('d-none');
            }
        }
        showLoading(false);
    } catch (error) {
        console.error('Error loading post:', error);
        showError(window.fb.handleFirestoreError(error));
        showLoading(false);
    }
};

// Save draft
window.saveDraft = async function() {
    await savePost('draft');
};

// Publish post
window.publishPost = async function() {
    await savePost('published');
};

// Save post helper
async function savePost(status) {
    try {
        showLoading(true);
        hideError();

        const title = document.getElementById('title').value;
        const category = document.getElementById('category').value;
        const content = quill.getContents();
        const coverImage = document.getElementById('coverImageUrl').value;

        if (!title || !category || !content) {
            throw new Error('Please fill in all required fields');
        }

        const postData = {
            title,
            category,
            content,
            tags: Array.from(tags),
            coverImage,
            status,
            timestamp: new Date(),
            lastModified: new Date()
        };

        await db.collection('posts').add(postData);
        showLoading(false);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error saving post:', error);
        showError(window.fb.handleFirestoreError(error));
        showLoading(false);
    }
}

// Image upload functions
window.uploadToCloudinary = async function() {
    // Implementation will be added
    console.log('Cloudinary upload not implemented yet');
};

window.uploadToImgur = async function() {
    // Implementation will be added
    console.log('Imgur upload not implemented yet');
};

// UI helpers
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadPosts();
});
