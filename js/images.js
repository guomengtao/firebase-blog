document.addEventListener('DOMContentLoaded', function() {
    const imageGrid = document.getElementById('imageGrid');
    const searchInput = document.getElementById('searchInput');
    const sourceFilter = document.getElementById('sourceFilter');
    const sortOrder = document.getElementById('sortOrder');
    const loadingSpinner = document.getElementById('loadingSpinner');

    // Sample image data - Replace with actual data from your storage services
    let images = [
        {
            id: 1,
            name: 'Sample Image 1',
            url: 'https://via.placeholder.com/200x150',
            source: 'cloudinary',
            date: '2024-12-15',
            size: '100KB'
        },
        {
            id: 2,
            name: 'Sample Image 2',
            url: 'https://via.placeholder.com/200x150',
            source: 'imgur',
            date: '2024-12-14',
            size: '200KB'
        }
    ];

    function createImageCard(image) {
        return `
            <div class="image-card">
                <img src="${image.url}" alt="${image.name}">
                <div class="image-info">
                    <h5 title="${image.name}">${image.name}</h5>
                    <small class="text-muted">
                        ${image.source} • ${image.date} • ${image.size}
                    </small>
                </div>
                <div class="image-actions">
                    <button class="btn btn-sm btn-primary" onclick="copyImageUrl('${image.url}')">
                        Copy URL
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteImage(${image.id})">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }

    function filterImages() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedSource = sourceFilter.value;
        const selectedSort = sortOrder.value;

        let filteredImages = images.filter(image => {
            const matchesSearch = image.name.toLowerCase().includes(searchTerm);
            const matchesSource = !selectedSource || image.source === selectedSource;
            return matchesSearch && matchesSource;
        });

        // Sort images
        filteredImages.sort((a, b) => {
            switch (selectedSort) {
                case 'newest':
                    return new Date(b.date) - new Date(a.date);
                case 'oldest':
                    return new Date(a.date) - new Date(b.date);
                case 'name':
                    return a.name.localeCompare(b.name);
                default:
                    return 0;
            }
        });

        displayImages(filteredImages);
    }

    function displayImages(imagesToShow) {
        imageGrid.innerHTML = imagesToShow.map(image => createImageCard(image)).join('');
    }

    // Event listeners for search, filter, and sort
    searchInput.addEventListener('input', filterImages);
    sourceFilter.addEventListener('change', filterImages);
    sortOrder.addEventListener('change', filterImages);

    // Copy image URL to clipboard
    window.copyImageUrl = function(url) {
        navigator.clipboard.writeText(url).then(() => {
            alert('Image URL copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy URL:', err);
        });
    };

    // Delete image
    window.deleteImage = function(imageId) {
        if (confirm('Are you sure you want to delete this image?')) {
            // Add actual delete logic here
            images = images.filter(image => image.id !== imageId);
            filterImages();
        }
    };

    // Initial display
    loadingSpinner.style.display = 'none';
    filterImages();
});
