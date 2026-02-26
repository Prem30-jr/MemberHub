# project_subscription

## 🚀 Stack Overview
- **Frontend**: React
- **Backend**: Node + Express
- **Database**: MongoDB
- **Authentication**: Firebase Auth

## 📋 Prerequisites
- **Node.js**: Required for Frontend and Node.js backends.
- **Python**: Required if using Flask or Django.
- **Database**: Ensure MongoDB is running locally or you have a cloud connection string.

## 🛠️ Installation & Setup

### 1. Environment Setup
A local `.env` file has been generated with your configuration.
Check the `.env` file in the root to ensure your keys and connection strings are correct.

### 2. Backend Setup
```bash
cd server
# Install dependencies (if not already installed)
npm install

# Start Server
npm start
```

### 3. Frontend Setup
```bash
cd client
# Install dependencies
npm install

# Start Development Server
npm start
```

## 🏃 Running the Project
1. Open two terminal windows.
2. In the first window, start the backend (see above).
3. In the second window, start the frontend (see above).
4. Open your browser to the URL shown in the frontend terminal (usually http://localhost:3000 or 5173).

## 📂 Project Structure
```
project_subscription/
├── client/           # Frontend Application
├── server/           # Backend Application
├── .env              # Environment Variables
└── README.md         # This file
```

## 🛑 common Issues
- **Connection Refused**: Check if your database is running and the connection string in `.env` is correct.
- **Port In Use**: If port 5000 or 3000 is taken, update `.env` or the start scripts.

Enjoy coding! 🚀
