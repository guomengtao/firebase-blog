async function checkCloudinaryConnection() {
    const CLOUDINARY_API_URL = 'https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/list';

    try {
        const response = await fetch(CLOUDINARY_API_URL, {
            method: 'GET'
        });

        const statusElement = document.getElementById('cloudinaryStatus');
        if (response.ok) {
            statusElement.classList.remove('alert-info');
            statusElement.classList.add('alert-success');
            statusElement.textContent = 'Connected to Cloudinary successfully!';
        } else {
            statusElement.classList.remove('alert-info');
            statusElement.classList.add('alert-danger');
            statusElement.textContent = 'Failed to connect to Cloudinary.';
        }
    } catch (error) {
        const statusElement = document.getElementById('cloudinaryStatus');
        statusElement.classList.remove('alert-info');
        statusElement.classList.add('alert-danger');
        statusElement.textContent = 'Error connecting to Cloudinary.';
    }
}

document.addEventListener('DOMContentLoaded', checkCloudinaryConnection);
