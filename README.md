# Firebase Blog Platform

A modern, feature-rich blogging platform built with Firebase, featuring both a public-facing blog and a comprehensive admin dashboard.

## Features

### Public Blog
- Clean, responsive blog interface
- Article reading with rich text support
- Real-time comments and discussions
- Social media sharing
- Search functionality
- Categories and tags
- Mobile-friendly design

### Admin Dashboard
- **Post Management**
  - Create, edit, and delete posts
  - Rich text editor (Quill)
  - Draft/Published status
  - URL slug management
  - View post statistics

- **User Management**
  - Admin and blog manager roles
  - User permission control
  - Account management

- **Analytics**
  - Visitor tracking
  - Traffic analysis
  - Popular content insights
  - Geographic distribution
  - Device and browser statistics
  - Export capabilities

- **System Logs**
  - Activity monitoring
  - Error tracking
  - User actions
  - System events
  - Filterable log view
  - CSV export

## Technology Stack
- Firebase Authentication
- Firebase Firestore
- Firebase Storage
- Firebase Hosting
- Bootstrap 5
- Chart.js
- Quill Editor

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/firebase-blog.git
cd firebase-blog
```

2. Update Firebase configuration in the following files:
- `app.js`
- `admin/admin.js`
- `admin/posts.js`
- `admin/managers.js`
- `admin/logs.js`
- `admin/visitors.js`

3. Deploy to Firebase:
```bash
firebase deploy
```

## Security
- Role-based access control
- Secure admin dashboard
- Protected API endpoints
- Data validation
- XSS protection

## Contributing
Feel free to submit issues and enhancement requests!

## License
MIT License
