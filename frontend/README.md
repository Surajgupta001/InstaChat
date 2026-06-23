# 📱 InstaChat Frontend Mobile Client

This is the cross-platform mobile client for **InstaChat**, built using React Native, Expo (SDK 56), TypeScript, Expo Router, and Zustand.

For full architectural diagrams, flow charts, store structures, and environment variables details, please refer to the main repository [README.md](../README.md).

## ⚙️ Tech Stack & Key Features
* **Framework:** React Native / Expo Go (SDK 56)
* **Routing:** Expo Router (File-based, stack navigation)
* **Auth:** Clerk Expo
* **State Management:** Zustand (reactive store slices)
* **Real-time Client:** Browser native `WebSocket` API
* **UX/UI Components:** `react-native-reanimated`, Expo Linear Gradient, Expo Symbols, Expo Video, and ThemeContext theme manager.

## 🚀 Setup & Execution

1. **Install dependencies:**
   ```bash
   bun install # or npm install
   ```

2. **Configure Environment:**
   Create a `.env` file in this directory:
   ```env
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
   ```

3. **Verify API Endpoints:**
   Ensure the local host settings in [Config.ts](constants/Config.ts) match your current local machine's IP address when running on a physical phone.

4. **Start Development App:**
   ```bash
   bun run start # or npm run start
   ```
   Press `a` (Android) or `i` (iOS) to launch the emulator, or scan the QR code using the Expo Go application.

---
*For complete structural details and installation guidelines, see the main [README.md](../README.md).*
