# Firebase Blog with Real-time Chat

A modern blog platform built with Firebase, featuring real-time chat functionality and a rich text editor.

## Features

### Blog System
- Rich text editor with image support
- Custom URL slugs for articles
- Tag system
- Cover image support
- Markdown support
- Real-time updates

### Chat System
- Real-time messaging
- User presence detection
- Nickname support
- Message timestamps
- Online user count

## Technologies Used

- Firebase Firestore
- Firebase Storage
- Firebase Hosting
- TinyMCE Editor
- HTML5/CSS3
- JavaScript (ES6+)

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/firebase-blog.git
cd firebase-blog
```

2. Configure Firebase:
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Firestore and Storage
   - Copy your Firebase config to `app.js`

3. Configure TinyMCE:
   - Get your API key from [TinyMCE](https://www.tiny.cloud/)
   - Update the API key in `editor.html`

4. Deploy:
```bash
firebase deploy
```

## File Structure

```
firebase-blog/
├── index.html          # Main blog page
├── editor.html         # Blog post editor
├── chat.html          # Real-time chat room
├── app.js             # Main application logic
├── editor.js          # Editor functionality
├── chat.js            # Chat functionality
└── style.css          # Styles
```

## Security

Make sure to update the Firebase security rules for production use. Current rules are for development only.

## License

MIT License - feel free to use this code for your own projects!

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
