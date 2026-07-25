# Liquid Glass PDF Suite 📄✨

A client-side, privacy-first PDF utility suite built with React 19, Vite, Tailwind CSS v4, `pdf-lib`, and `pdfjs-dist`. 100% of processing happens directly in the browser—no files or personal data are ever sent to any external server.

🌐 **Live Demo**: [https://kheirparham-eng.github.io/PDF-tools](https://kheirparham-eng.github.io/PDF-tools)

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
   git clone https://github.com/kheirparham-eng/PDF-tools.git
   cd PDF-tools
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000` (or `http://localhost:5173`).

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

This project includes a pre-configured GitHub Actions deployment workflow (`.github/workflows/deploy.yml`).

### Step-by-step Setup on GitHub:

1. **Commit and push all recent changes to GitHub**:
   ```bash
   git add .
   git commit -m "Add GitHub Pages workflow and updated configuration"
   git push origin main
   ```

2. **Enable GitHub Actions for Pages**:
   - Navigate to your repository: [https://github.com/kheirparham-eng/PDF-tools](https://github.com/kheirparham-eng/PDF-tools)
   - Click on **Settings** tab at the top.
   - In the left sidebar under *Code and automation*, click **Pages**.
   - Under **Build and deployment** → **Source**, select **GitHub Actions** from the dropdown menu (instead of "Deploy from a branch").

3. **Automatic Deployment**:
   - Click on the **Actions** tab at the top of the repository.
   - You will see the **Deploy to GitHub Pages** workflow running automatically.
   - Once the workflow turns green, your site will be live at:  
     👉 **[https://kheirparham-eng.github.io/PDF-tools/](https://kheirparham-eng.github.io/PDF-tools/)**

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
