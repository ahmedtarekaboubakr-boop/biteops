# JJ's Burger Joint - Operations Management System

A web application for tracking operations across multiple burger joint locations in Egypt.

## Features

- **Owner Dashboard**: Create and manage manager profiles
- **Role-based Access Control**: Three user types (Owner, Manager, Staff)
- **Manager Profile Management**: 
  - Name
  - Username (for login)
  - Password (for login)
  - Date of Birth
  - Employee Code
  - Start Date
  - Payroll Information

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: SQLite
- **Authentication**: JWT

## Getting Started

### Prerequisites

- Node.js (v18 or higher) and npm

**If Node.js is not installed:**

1. **macOS**: 
   - Download from https://nodejs.org/ (LTS version recommended)
   - Or install via Homebrew: `brew install node`

2. **Windows**: Download installer from https://nodejs.org/

3. **Linux**: 
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

Verify installation:
```bash
node --version
npm --version
```

### Quick Start

1. Install all dependencies:
```bash
npm run install:all
```

2. Start the development servers:
```bash
npm run dev
```

This will start:
- Frontend server on http://localhost:3000
- Backend server on http://localhost:3001

### Default Login Credentials

- **Email**: owner@jjs.com
- **Password**: admin123

## Project Structure

```
├── client/          # React frontend application
├── server/          # Express backend API
└── package.json     # Root package.json with scripts
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login (supports email or username)
- `GET /api/auth/me` - Get current user

### Managers (Owner only)
- `GET /api/managers` - Get all managers
- `POST /api/managers` - Create manager profile
- `GET /api/managers/:id` - Get single manager
- `PUT /api/managers/:id` - Update manager
- `DELETE /api/managers/:id` - Delete manager

## Next Steps

- Manager dashboard (for managers to sign in and manage operations)
- Staff management
- Location management
- Operations tracking features
