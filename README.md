# Ultra Modern Admin Panel

A beautiful, high-performance admin panel built with Next.js 14, TypeScript, and Tailwind CSS for managing news articles.

## Features

- 🎨 **Ultra Modern Design** - Beautiful gradients, smooth animations, and glassmorphism effects
- 📰 **News Management** - Full CRUD operations for news articles
- 🔍 **Advanced Search** - Search by title, description, category, and tags
- 🖼️ **Image Preview** - Real-time image preview when entering URL
- 💾 **LocalStorage** - All data persists in browser localStorage
- 🎯 **No Scroll Modal** - All form fields visible without scrolling
- ⚡ **TypeScript** - Fully typed for better development experience
- 📱 **Fixed Layout** - Optimized for desktop/web use

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Usage

1. Click **"Add New News"** button to create a new article
2. Fill in all required fields (marked with *)
3. Image preview will appear automatically when you enter a valid URL
4. Use the search bar to filter news articles
5. Click edit/delete buttons to manage existing articles
6. All changes are automatically saved to localStorage

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Storage:** Browser localStorage

## Project Structure

```
├── app/
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Main admin panel page
│   └── globals.css      # Global styles
├── components/
│   ├── Sidebar.tsx      # Sidebar navigation
│   └── NewsModal.tsx    # Modal for add/edit news
└── package.json         # Dependencies
```

## License

MIT
