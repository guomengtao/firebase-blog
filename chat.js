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

// DOM elements
const messagesDiv = document.getElementById('messages');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const usernameInput = document.getElementById('username');
const userCountSpan = document.getElementById('userCount');

// Get or create username from localStorage
let username = localStorage.getItem('chatUsername') || '';
if (username) {
    usernameInput.value = username;
}

// Update username when input changes
usernameInput.addEventListener('change', (e) => {
    username = e.target.value.trim();
    localStorage.setItem('chatUsername', username);
});

// Generate a random user ID if not exists
const userId = localStorage.getItem('chatUserId') || Math.random().toString(36).substring(2);
localStorage.setItem('chatUserId', userId);

// Reference to messages collection
const messagesRef = db.collection('chat_messages');
const onlineUsersRef = db.collection('online_users');

// Add user to online users
async function updateOnlineStatus(online) {
    try {
        if (online) {
            await onlineUsersRef.doc(userId).set({
                username: username || '匿名用户',
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            await onlineUsersRef.doc(userId).delete();
        }
    } catch (error) {
        console.error('Error updating online status:', error);
    }
}

// Update online status when window loads/unloads
window.addEventListener('load', () => updateOnlineStatus(true));
window.addEventListener('beforeunload', () => updateOnlineStatus(false));

// Listen for online users changes
onlineUsersRef.onSnapshot((snapshot) => {
    userCountSpan.textContent = snapshot.size;
});

// Clean up old online users (inactive for more than 5 minutes)
setInterval(async () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const oldUsers = await onlineUsersRef
        .where('lastSeen', '<', fiveMinutesAgo)
        .get();
    
    oldUsers.forEach((doc) => {
        doc.ref.delete();
    });
}, 60000);

// Send message
messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const messageText = messageInput.value.trim();
    if (!messageText) return;

    if (!username) {
        alert('请先输入昵称！');
        usernameInput.focus();
        return;
    }

    try {
        await messagesRef.add({
            userId: userId,
            username: username,
            text: messageText,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        messageInput.value = '';
    } catch (error) {
        console.error('Error sending message:', error);
        alert('发送消息失败，请重试');
    }
});

// Display message
function displayMessage(message, data) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${data.userId === userId ? 'message-sent' : 'message-received'}`;
    
    const time = data.timestamp ? data.timestamp.toDate() : new Date();
    const timeStr = time.toLocaleTimeString();
    
    messageDiv.innerHTML = `
        <div class="message-info">
            <span class="message-username">${data.username}</span>
            <span class="message-time">${timeStr}</span>
        </div>
        <div class="message-content">${data.text}</div>
    `;
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Listen for new messages
messagesRef
    .orderBy('timestamp', 'desc')
    .limit(50)
    .onSnapshot((snapshot) => {
        const changes = snapshot.docChanges().reverse();
        
        changes.forEach(change => {
            if (change.type === 'added') {
                displayMessage(change.doc.id, change.doc.data());
            }
        });
    });
