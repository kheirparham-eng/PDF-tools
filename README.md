# Liquid Glass PDF Suite 📄✨

A client-side, privacy-first PDF utility suite built with React 19, Vite, Tailwind CSS v4, `pdf-lib`, and `pdfjs-dist`. 100% of processing happens directly in the browser—no files or personal data are ever sent to any external server.

---

## 🚀 Features

- **Merge PDFs**: Combine multiple PDF files in custom order with page count previews and drag-and-drop reordering.
- **Split & Extract Pages**: Select custom ranges or individual pages to export as a single merged PDF or ZIP archive.
- **Grayscale / B&W Converter**: Strip colors and convert PDFs to standard Grayscale, High Contrast B&W, or Vintage Sepia.
- **Compress PDF**: Reduce file size using Recommended, Extreme, or Light compression presets.
- **PDF to Image**: Render PDF pages into high-resolution JPG or PNG images (single image or ZIP archive).
- **Image to PDF**: Convert photos (JPG, PNG, WebP) into custom PDF pages with layout, sizing, and margin controls.
- **Reorder & Rotate Pages**: Drag and re-arrange or rotate individual pages in real time before saving.

---

## 💻 How to Run Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` (comes with Node.js)

### Step-by-Step Local Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
   cd YOUR_REPOSITORY
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000` (or the URL outputted in your terminal, e.g. `http://localhost:5173`).

4. **Build for Production**
   ```bash
   npm run build
   ```
   This generates optimized static production files inside the `dist/` directory.

5. **Preview Production Build Locally**
   ```bash
   npm run preview
   ```

---

## 🌐 How to Host on GitHub Pages

This project is configured with a automated GitHub Actions workflow (`.github/workflows/deploy.yml`).

### Steps to Enable GitHub Pages:

1. Push your repository code to GitHub on the `main` or `master` branch:
   ```bash
   git add .
   git commit -m "Configure for GitHub Pages hosting"
   git push origin main
   ```

2. Open your GitHub Repository in your browser.
3. Go to **Settings** → **Pages** (under Code and automation in the left sidebar).
4. Under **Build and deployment**:
   - Change **Source** from *Deploy from a branch* to **GitHub Actions**.
5. Go to the **Actions** tab at the top of your repository to watch the deployment workflow run.
6. Once completed, your site will be live at:
   `https://YOUR_USERNAME.github.io/YOUR_REPOSITORY/`

---

## 🔒 Privacy & Security

- **100% Local Browser Execution**: All file reads, page rendering, image manipulation, and PDF generation occur in your browser's WebAssembly and JavaScript environment.
- **Zero Server Uploads**: Files never touch any backend server or third-party service.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **PDF Processing**: `pdf-lib`, `pdfjs-dist`
- **Icons & UI**: Lucide React, Motion, Canvas Confetti
