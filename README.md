# 📚 Student Planner & Attendance Analytics Dashboard

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-attendance--dashboard--gray.vercel.app-6366f1?style=for-the-badge)](https://attendance-dashboard-gray.vercel.app)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)

> 🌐 **Live Site:** [https://attendance-dashboard-gray.vercel.app](https://attendance-dashboard-gray.vercel.app)

A modern, full-stack, secure **Student Agenda Planner and Real-Time Attendance Analytics Dashboard** built from the ground up using **Next.js (App Router)**, **React**, **Prisma ORM**, and **Turso (libSQL cloud database)**.

This application features complete **relational database isolation** and a custom **secure HTTP-Only JWT Cookie Authentication system**, designed as a production-grade showcase of advanced full-stack software engineering practices.

---

## 🎯 Architecture & Core Engineering Highlights

The following systems demonstrate production-ready full-stack design patterns and robust architecture:

### 1. Cryptographic Security & Custom Session Layer
- **Robust Identity Control**: Implemented a custom identity provider utilizing salted password hashing (**PBKDF2 via Node's native `crypto`**), avoiding plain-text exposure and resisting rainbow-table attacks.
- **XSS & CSRF Mitigated Sessions**: Sessions are securely signed using JSON Web Tokens (`jsonwebtoken`) and distributed via **HttpOnly, SameSite=Lax** browser cookies, completely immune to client-side credential extraction.
- **Edge Proxy Guards (`proxy.js`)**: Developed a unified routing guard utilizing Next.js 16 Edge proxy mechanics to decrypt sessions and perform sub-millisecond redirect checks.

### 2. Isolated Relational Database Design
- **Cascade-Safe Schemas**: Structured SQLite database relations mapped inside `prisma/schema.prisma` linking `Subject`, `TimetableSlot`, and `AttendanceLog` to a unique `User` UUID. If a user deletes a subject or deletes their profile, cascade triggers cleanly purge orphan slots and timelines.
- **SQL Transactions**: Mark-in and rollback mechanics on logs utilize atomic database transactions, ensuring subject counters and chronological logs remain in lockstep without race-condition hazards.

### 3. Highly Interactive Glassmorphic Frontend
- **Polished Responsive Sidebar Engine**: A split layout utilizing pure Vanilla CSS (no Tailwind) providing a sticky desktop sidebar with dynamic indicators and collapsible drawer navigation on mobile viewports.
- **Smart Agenda Checklist**: A calendar-date agenda parser check-in log. Marking classes as attended or missed automatically locks the action button in a beautiful status capsule (e.g. `✓ Attended Today`), preventing redundant double-markings.
- **What-If Analytics Simulator**: Allows students to simulate attending or bunking upcoming classes to visualize projected percentages before stepping foot in a lecture hall.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI Engine**: React 19 (Client Components, Hooks, Refs)
- **Styling**: Pure Vanilla CSS 3 (Dynamic custom properties, Flexbox/Grid layouts, custom keyframe transitions)
- **Database Engine**: SQLite 3 Local Database
- **ORM & Migrations**: Prisma 7 (Compiled-less runtime using LibSQL adapter)
- **Authentication**: JWT Cookies, Salted PBKDF2 Hashing
- **Visuals & Charts**: Chart.js 4 (Dynamic Canvas rendering), Canvas-Confetti (Interactive reward particle showers)

---

## 📂 Project Architecture

```text
├── app/
│   ├── api/
│   │   ├── auth/            # Sign Up, Login, Logout, Session Hydration
│   │   ├── logs/            # Chronological attendance checkins (Atomic Transactions)
│   │   ├── reset/           # Factory reset & user-isolated database seeding
│   │   ├── subjects/        # Subject directories & goal thresholds
│   │   └── timetable/       # Weekly class hour schedulers
│   ├── login/               # Stunning glowing glass-card login portal
│   ├── signup/              # Responsive signup visual layout
│   ├── globals.css          # Design tokens, themes (light/dark), and tab transitions
│   ├── layout.js            # Standard HTML5 headers, SEO meta tags
│   └── page.js              # Core React Dashboard, Stats, Agenda, Timetables, and Simulator
├── lib/
│   ├── auth.js              # Cryptographic PBKDF2 hashers & JWT cookie helpers
│   └── prisma.js            # Prisma client adapter singleton (Prisma 7 LibSQL runtime)
├── prisma/
│   ├── schema.prisma        # SQLite relational DB models with cascade foreign keys
│   └── migrations/          # Chronological local DB schema migrations history
├── proxy.js                 # Unified Next.js 16 Edge Route Guard Interceptor
├── package.json             # App dependencies & run scripts
└── README.md                # Interactive documentation
```

---

## 🚀 Getting Started & Local Installation

Follow these quick commands to spin up the local development suite on your machine:

### 1. Clone & Set Environment variables
```bash
git clone https://github.com/Sanj245/attendance-dashboard.git
cd attendance-dashboard
```
Create a `.env` file in the root folder:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="super-secret-student-planner-key-2026"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Initialize the SQLite Local Database
Run the schema migrations to create the SQLite database file (`dev.db`) and seed the system structures:
```bash
npx prisma migrate dev --name init
```

### 4. Boot Up the Server
Launch the Next.js development compile engine:
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 💡 Getting Started Quickly (Demo Account & Mock Data)

To inspect the dashboard's capabilities instantly without manually setting up data:
1. Register a new user on the `/signup` screen.
2. The registration logic automatically triggers a **custom database seed** specifically bound to your new profile session.
3. You will immediately be redirected to the main dashboard, pre-populated with **4 beautiful subjects, a weekly timetable, and historical logs** ready for you to interact with!
