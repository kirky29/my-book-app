# Book Tracker App

A simple, mobile-first web application for tracking your book collection and wishlist. Perfect for checking if you already own a book while shopping in bookstores.

## Features

- 📱 **Mobile-optimized interface** - Designed specifically for phone screens
- 📚 **Track owned books** - Keep a record of books you already have
- 📖 **Wishlist management** - Save books you want to read or buy
- 🔍 **Quick search** - Find books by title or author instantly
- 📷 **Barcode scanner** - Scan book ISBNs with your phone's camera for instant book lookup
- 🌐 **Google Books integration** - Search and add books with accurate information and covers
- 🖼️ **Book covers** - Visual book covers for easy identification
- 📄 **Detailed book profiles** - View comprehensive book information and metadata
- 📝 **Personal notes** - Add and edit your thoughts, quotes, and reminders for each book
- 📊 **Rich book data** - Publisher, publication date, page count, ISBN, and categories
- 💾 **Local storage** - Data persists between sessions
- ⚡ **Fast and responsive** - Built with Next.js and Tailwind CSS

## Use Case

Perfect for bookstore browsing! When you see an interesting book but can't remember if you already own it, simply open the app and search to check your collection.

## Getting Started

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

This app is ready to deploy on Vercel:

1. Push to GitHub
2. Connect your GitHub repository to Vercel
3. Deploy with one click

## How to Use

1. **Add books**: Tap the "+" button to add a new book
   - **Search mode**: Search Google Books database for accurate book information
   - **Scan mode**: Use your camera to scan book barcodes for instant lookup
   - **Manual mode**: Enter book details manually
2. **Mark ownership**: Choose between "I Own This" or "Wishlist"
3. **Search quickly**: Use the search bar to find specific books in your collection
4. **Filter by status**: Toggle between All, Owned, and Wishlist
5. **View book details**: Tap any book to see its full profile page with:
   - Larger book cover image
   - Complete description and metadata
   - Publisher, publication date, page count, ISBN
   - Book categories and additional information
6. **Add personal notes**: Use the notes section to save your thoughts and quotes
7. **Manage books**: Toggle status between owned/wishlist or remove books entirely
8. **Quick actions**: Use the status toggle button on book cards for fast updates

## Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Barcode scanning**: ZXing library for camera-based ISBN scanning
- **Storage**: Browser localStorage
- **Deployment**: Vercel-ready

## Mobile Features

- Touch-optimized interface
- PWA-ready (can be added to home screen)
- Responsive design for all screen sizes
- Fast loading and smooth animations
- Camera access for barcode scanning
- Flash/torch support for scanning in low light

## Camera Permissions

The barcode scanner requires camera access to function:

1. **First use**: Your browser will request camera permission
2. **Allow access**: Tap "Allow" to enable barcode scanning
3. **Scan books**: Point your camera at any book's ISBN barcode
4. **Auto-detection**: The app automatically detects and processes ISBN codes
5. **Instant lookup**: Scanned books are immediately searched in Google Books database

**Note**: Camera permissions are only used for barcode scanning and no images are stored or transmitted. 