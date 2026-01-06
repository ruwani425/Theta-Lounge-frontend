# 🌿 Floating Theraphy – Therapy Center Frontend

A modern **frontend application** for the Floating Theraphy wellness management system, built using **React + TypeScript**.  
This application provides a smooth, responsive user experience for clients booking therapy sessions and for admins managing schedules, users, and permissions.

---

## 🧩 Overview

The Floating Theraphy frontend focuses on performance, aesthetics, and usability, delivering a premium wellness experience through a clean UI and secure role-based access.

### Key Highlights
- Client-friendly booking & package management UI
- Secure admin dashboard with protected routes
- Responsive, mobile-first design
- Seamless integration with MERN backend APIs
- Deployed on **Vercel**

---

## ✨ Features

### 🌟 User Experience
- 🎨 Elegant UI with custom typography  
  *(Playfair Display, Poppins, Inter)*
- 📱 Fully responsive, mobile-first design
- 🎥 Video backgrounds with overlay effects
- 🎯 Custom Tailwind CSS theme (Floating Therapy palette)

### 🔐 Security & Routing
- Firebase Authentication
- Protected admin routes
- Role-based UI rendering

### ⚡ Performance
- Vite-powered fast development
- Hot Module Replacement (HMR)
- Optimized production builds

---

## 📸 Screenshots

### 🌿 Client Interface
![Login Page](screencapture-floating-therapy-frontend-vercel-app-login-2026-01-05-17_42_30.png)
![Home Page](screencapture-floating-therapy-frontend-vercel-app-2026-01-05-18_02_25.png)
![Appointments](screencapture-floating-therapy-frontend-vercel-app-appointments-2026-01-05-17_41_20.png)
![About Page](screencapture-floating-therapy-frontend-vercel-app-about-2026-01-05-17_39_41.png)
![Pricing](screencapture-floating-therapy-frontend-vercel-app-pricing-2026-01-05-17_41_48.png)

### 🛠 Admin Dashboard
![Admin Dashboard](screencapture-floating-therapy-frontend-vercel-app-admin-dashboard-2026-01-05-17_44_24.png)
![Reports](screencapture-floating-therapy-frontend-vercel-app-admin-reports-2026-01-05-17_45_05.png)
![Calendar](screencapture-floating-therapy-frontend-vercel-app-admin-calendar-management-2026-01-05-17_43_38.png)
![Package Activations](screencapture-floating-therapy-frontend-vercel-app-admin-package-activations-2026-01-05-17_44_39.png)
![Reservations](screencapture-floating-therapy-frontend-vercel-app-admin-reservations-2026-01-05-17_43_07.png)
![Users management](screencapture-floating-therapy-frontend-vercel-app-admin-users-2026-01-05-17_44_05.png)
![Tank management](screencapture-floating-therapy-frontend-vercel-app-admin-tank-management-2026-01-05-17_43_52.png)
![Access control](screencapture-floating-therapy-frontend-vercel-app-admin-access-controll-2026-01-05-17_45_40.png)
---


## 🛠 Technologies & Tools

### Frontend Stack
- **React.js** (TypeScript)
- **Vite**
- **Tailwind CSS**
- **React Router DOM**
- **Firebase Authentication**
- **Lucide React** – Icon library

### Backend Integration
- Node.js & Express
- MongoDB & Mongoose
- Nodemailer (Email notifications)
- Node-Cron (Automated tasks)

### Deployment & DevOps
- **Vercel** – Frontend hosting
- **GitHub** – Version control
- **Postman** – API testing

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js **v18+**
- Backend API running
- Firebase project configured

---

### 📦 Frontend Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── admin/           # Admin-specific components
│   ├── layout/          # Layout components (Navbar, Footer)
│   └── shared/          # Shared UI components
├── core/                # Core configs (Axios, API handlers)
├── firebase/            # Firebase configuration
├── pages/               # Application pages
│   ├── admin/           # Admin pages
│   └── client/          # Public/client pages
├── types/               # TypeScript type definitions
└── utils/               # Utility functions (cookies, helpers)

```

## 🚀 Live Deployment

- 🌍 **Frontend Application**  
  https://theta-lounge-frontend.vercel.app

- ⚙️ **Backend REST API**  
  https://theta-lounge-backend.vercel.app

## License

All rights reserved.
