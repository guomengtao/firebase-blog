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

// 更新UI元素的函数
function updateUIElements(isConnected, details = {}) {
    const statusDot = document.getElementById('statusDot');
    const connectionStatus = document.getElementById('connectionStatus');
    const projectId = document.getElementById('projectId');
    const dbStatus = document.getElementById('dbStatus');
    const lastCheck = document.getElementById('lastCheck');
    const errorDetails = document.getElementById('errorDetails');
    const networkStatus = document.getElementById('networkStatus');

    // 更新状态指示器
    statusDot.className = 'status-indicator ' + (isConnected ? 'online' : 'offline');
    connectionStatus.textContent = isConnected ? '已连接' : '未连接';

    // 更新详细信息
    projectId.textContent = firebaseConfig.projectId;
    dbStatus.textContent = isConnected ? '正常运行' : '连接失败';
    lastCheck.textContent = new Date().toLocaleString();

    // 显示网络状态
    networkStatus.textContent = navigator.onLine ? '网络连接正常' : '网络断开';

    // 更新错误详情
    if (details.error) {
        errorDetails.innerHTML = `
            <div class="error-box">
                <p><strong>错误类型:</strong> ${details.error.code || details.error.name || '未知错误'}</p>
                <p><strong>错误信息:</strong> ${details.error.message || '无详细信息'}</p>
                <p><strong>可能的原因:</strong></p>
                <ul>
                    ${getErrorSuggestions(details.error)}
                </ul>
            </div>
        `;
    } else {
        errorDetails.innerHTML = '';
    }
}

// 获取错误建议
function getErrorSuggestions(error) {
    let suggestions = [];
    
    if (error.code === 'permission-denied' || error.message.includes('Missing or insufficient permissions')) {
        suggestions = [
            '需要在 Firebase 控制台中更新安全规则',
            '当前安全规则可能过于严格，需要允许读写操作',
            '请访问 Firebase 控制台 -> Firestore Database -> Rules',
            '临时测试可以设置 allow read, write: if true'
        ];
    } else if (error.code === 'not-found') {
        suggestions = [
            '请确认项目 ID 是否正确',
            '检查数据库是否已创建',
            '验证集合路径是否正确'
        ];
    } else if (!navigator.onLine) {
        suggestions = [
            '检查网络连接是否正常',
            '确认是否可以访问其他网站',
            '尝试刷新页面'
        ];
    } else {
        suggestions = [
            '检查 Firebase 控制台中的项目设置',
            '确认浏览器是否支持所有必需的功能',
            '尝试清除浏览器缓存后重试',
            '确认 Firebase 配置信息是否正确'
        ];
    }

    return suggestions.map(suggestion => `<li>${suggestion}</li>`).join('');
}

// 检查 Firebase 连接状态
async function checkFirebaseStatus() {
    try {
        // 首先检查网络连接
        if (!navigator.onLine) {
            throw new Error('网络连接已断开');
        }

        // 创建测试集合和文档
        const testCollection = db.collection('test_connection');
        const testDoc = testCollection.doc('test');
        
        // 尝试写入测试数据
        await testDoc.set({
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // 尝试读取测试数据
        await testDoc.get();
        
        // 如果成功，删除测试数据
        await testDoc.delete();
        
        // 更新状态为已连接
        updateUIElements(true, {
            latency: '正常',
            lastSync: new Date().toISOString()
        });

    } catch (error) {
        console.error('Firebase connection error:', error);
        updateUIElements(false, { error });
    }
}

// 页面加载时检查状态
document.addEventListener('DOMContentLoaded', () => {
    checkFirebaseStatus();
});

// 定期检查连接状态（每60秒）
setInterval(checkFirebaseStatus, 60000);
