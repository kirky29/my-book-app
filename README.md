# Book Tracker - "Do I Own This Book?"

A simple, focused mobile app that answers one question: **"Do I already own this book?"**

Perfect for bookstore browsing - when you see an interesting book but can't remember if you already have it, just open the app and check!

## 🎯 Core Purpose

**Primary Use Case**: You're in a bookstore, see an interesting book, and want to quickly check if you already own it.

## ✨ Key Features

- 🔍 **Instant Search** - Search by title or author to see if you own it
- 📷 **Barcode Scanner** - Scan ISBN for instant lookup
- 📚 **Simple Library** - Clean list of books you own
- ➕ **Quick Add** - Fast way to add books you buy
- ☁️ **Cloud Sync** - Your library syncs across all devices
- 📱 **Mobile-First** - Designed for phone use in stores

## 🚀 How It Works

### 1. **Quick Check** (Main Use Case)
- Open the app
- Type the book title or author
- Instantly see if you own it (green checkmark) or not
- If you don't own it, you can add it to your library

### 2. **Barcode Scanning**
- Tap the scan button
- Point camera at book's ISBN barcode
- App automatically looks up the book
- Add it to your library with one tap

### 3. **Simple Library Management**
- View all your books in a clean list
- Each book shows: title, author, cover, and ownership status
- Export your library as backup

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Icons**: Lucide React
- **Barcode Scanning**: ZXing library

## 📱 Mobile Features

- Touch-optimized interface
- PWA-ready (can be added to home screen)
- Camera access for barcode scanning
- Fast loading and smooth animations
- Works offline (with sync when online)

## 🎨 Design Philosophy

**Simplicity First**: This app does one thing really well - helping you remember which books you own. No complex features, no overwhelming options, just a clean, fast way to check your library.

## 🚀 Getting Started

### Development

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deployment

Ready to deploy on Vercel:

1. Push to GitHub
2. Connect your GitHub repository to Vercel
3. Deploy with one click

## 📖 Usage Guide

### Adding Books
1. **Search Method**: Type book title/author → select from results → add to library
2. **Scan Method**: Tap scan → point at ISBN → add to library
3. **Manual Method**: Tap "Add Book" → enter title and author → save

### Checking Your Library
1. **Search**: Type any part of title or author
2. **Browse**: Scroll through your complete library
3. **Quick Stats**: See total books owned at the top

### Managing Your Library
- **Export**: Download your library as JSON backup
- **Sync**: Changes automatically sync across devices
- **Simple**: Just title, author, cover, and ownership status

## 🎯 Perfect For

- **Bookstore browsing** - Check if you already own a book
- **Library visits** - Remember what you've already read
- **Online shopping** - Avoid buying duplicates
- **Gift giving** - Know what books someone already has
- **Collection management** - Keep track of your personal library

## 🔧 Configuration

The app uses Firebase for data storage and authentication. Set up your Firebase project and add the configuration to `lib/firebase.ts`.

## 📄 License

MIT License - feel free to use and modify for your own projects.

---

**Built with ❤️ for book lovers who can't remember what they already own.** 