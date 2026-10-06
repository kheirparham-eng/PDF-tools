# PDF Utility Studio 📄✨

[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Privacy](https://img.shields.io/badge/Privacy-100%25_Client--Side-10b981?style=flat-square&logo=shield&logoColor=white)](#-privacy--security)

A fast, client-side, privacy-first PDF utility suite crafted with a modern Liquid Glass aesthetic. All document processing happens strictly inside your browser's local sandbox—no file uploads, zero telemetry, and complete offline capability.

🌐 **Live Demo**: [https://kheirparham-eng.github.io/PDF-tools](https://kheirparham-eng.github.io/PDF-tools)

---

## ⚡ Key Features

| Tool | Description |
| :--- | :--- |
| 🖨️ **Print & Page Layout** | Pre-press layout engine with N-Up imposition (1/2/4-Up), duplex mirrored gutters, Bates numbering, custom margins, crop marks, and direct browser printing. |
| 🔗 **Merge PDFs** | Combine multiple PDF files in custom order with page count previews and drag-and-drop sequencing. |
| ✂️ **Split & Extract** | Extract specific pages or ranges to a single combined document or individual files in a ZIP archive. |
| ⚡ **Compress PDF** | Reduce PDF file size significantly while preserving typography and image sharpness. |
| 🖼️ **PDF to Image** | Export PDF pages as high-resolution PNG or JPEG raster images. |
| 📷 **Image to PDF** | Convert PNG, JPG, or WebP photos into standardized, custom-margined PDF documents. |
| 🔄 **Reorder & Rotate** | Interactively drag to rearrange pages, delete unwanted sheets, and rotate orientations in real time. |
| 🎨 **Grayscale / B&W** | Convert color documents to clean monochrome for printing and archival compliance. |

---

## 🚀 Quickstart

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+) & `npm`

### Installation & Run

```bash
# 1. Clone the repository
git clone https://github.com/kheirparham-eng/PDF-tools.git
cd PDF-tools

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🔒 Privacy & Security

- **Zero Cloud Uploads**: Files are read directly via HTML5 File API and processed in isolated browser memory.
- **Offline & Air-Gapped Ready**: Operates seamlessly without an active internet connection.
- **Instant Clean Memory**: All buffers and canvas objects are purged upon closing or refreshing the tab.

---

## 🛠️ Built With

- **Core**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Liquid Glass Frost System
- **PDF Engines**: `pdf-lib` (Document generation & imposition), `pdfjs-dist` (High-fidelity rasterization & previews)
- **Icons**: Lucide React


