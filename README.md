# Nik's Garden 🌸

A vibrant, collaborative digital garden where visitors can draw their own flowers and plant them in a shared space. Inspired by [Anna's Garden](https://annasgarden.vercel.app).

## 🚀 Features
- **Interactive Drawing Tool**: Create your own unique flower with a multi-color canvas.
- **Collaborative Garden**: Plant your flower on a shared island and see what others have grown.
- **Real-Time Synergy**: Uses Socket.io to sync new plants and "likes" across all users instantly.
- **Environmental FX**: Animated bees, butterflies, ladybugs, and swaying decorations.
- **Day/Night Cycle**: Toggle between a sunny day and a glowing, star-filled night.

## 🛠️ Tech Stack
- **Frontend**: React, Tailwind CSS, Framer Motion, 
- **Backend**: Node.js, Express, Socket.io
- **Database**: MongoDB (Mongoose)
- **Audio**: Web Audio API (Synthesized nature sounds)

## 📦 Project Structure
- `/client`: React frontend (Vite)
- `/server`: Node.js backend (Express + MongoDB)

## 🏃 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [MongoDB](https://www.mongodb.com/) (Running locally or a cluster URI)

### Setup
1. Clone the repository
2. Install dependencies for both parts:
   ```bash
   # From the root directory
   npm install
   ```

### Running the App
Start both the client and server concurrently from the root:
```bash
npm run dev
```

The app will be available at:
- **Frontend**: `http://localhost:5173` (or the port shown in terminal)
- **Backend API**: `http://localhost:5000`

## 🤝 Contributing
Feel free to fork and add your own decorations or creatures!
