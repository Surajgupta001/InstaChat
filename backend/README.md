# 🚀 InstaChat Backend API Server

This is the backend API and real-time WebSocket server for **InstaChat**, built using Node.js, Express, TypeScript, Mongoose, and WebSockets.

For full architectural diagrams, flow charts, API tables, and environment variables details, please refer to the main repository [README.md](../README.md).

## ⚙️ Tech Stack & Key Libraries
* **Runtime:** Node.js (with TSX / TypeScript execution)
* **Framework:** Express.js (v5)
* **Real-time Server:** Raw WebSocket (`ws` library)
* **Database ODM:** Mongoose (MongoDB)
* **Authentication:** `@clerk/express`
* **Media Processing:** Multer (memory buffers) & Cloudinary SDK
* **Security & Performance:** Helmet, HPP, Express Rate Limiter, Zod

## 🚀 Setup & Execution

1. **Install dependencies:**
   ```bash
   bun install # or npm install
   ```

2. **Configure Environment:**
   Create a `.env` file in this directory with details from the root [Environment Variables](../README.md#11-environment-variables) section.

3. **Start Development Server:**
   ```bash
   bun run server # runs nodemon hot-reloading
   ```

4. **Compile Production Build:**
   ```bash
   bun run build # compiles TypeScript to dist/
   ```

---
*For complete API routes, WebSocket events, and security guidelines, see the main [README.md](../README.md).*
