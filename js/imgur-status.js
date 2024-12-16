async function checkImgurConnection() {
    const IMGUR_API_URL = 'https://api.imgur.com/3/image';
    const IMGUR_CLIENT_ID = '212b229cc73869d';

    try {
        const response = await fetch(IMGUR_API_URL, {
            method: 'GET',
            headers: {
                Authorization: `Client-ID ${IMGUR_CLIENT_ID}`
            }
        });

        const statusElement = document.getElementById('imgurStatus');
        if (response.ok) {
            statusElement.classList.remove('alert-info');
            statusElement.classList.add('alert-success');
            statusElement.textContent = 'Connected to Imgur successfully!';
        } else {
            statusElement.classList.remove('alert-info');
            statusElement.classList.add('alert-danger');
            statusElement.textContent = `Failed to connect to Imgur. Status: ${response.status} - ${response.statusText}`;
        }
    } catch (error) {
        const statusElement = document.getElementById('imgurStatus');
        statusElement.classList.remove('alert-info');
        statusElement.classList.add('alert-danger');
        statusElement.textContent = 'Rate limit exceeded. Please try again later.';
    }
}

document.addEventListener('DOMContentLoaded', checkImgurConnection);
