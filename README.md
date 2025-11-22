# Calendra

**Calendra** is a modern web application built with Next.js, TypeScript, and Tailwind CSS to provide an intuitive calendar scheduling experience.

---

## ✨ Features

- Create and manage calendar events  
- Responsive UI for mobile and desktop  
- Built with modern tech stack (Next.js + TypeScript)  
- Easily customizable and scalable  

 🔗 **Google Calendar API Integration**
  - Full integration with Google Calendar using Google APIs
  - Sync events between Calendra and your Google Calendar
  - OAuth 2.0 authentication for secure Google login
  - Real-time event synchronization after login

---

## 🧰 Tech Stack

- **Next.js** – React framework for production  
- **TypeScript** – Typed JavaScript for reliability  
- **Tailwind CSS** – Utility-first styling  
- **Drizzle** (or similar) – ORM/database layer (as per your config)  
  
---

## 📁 Project Structure

```txt
Calendra/
├── app/
│   ├── components/
│   ├── constants/
│   ├── drizzle/
│   └── lib/
├── public/
│   └── assets/
├── components.json
├── drizzle.config.ts
├── middleware.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── README.md
```
```
🚀 Installation & Setup

Clone the repository

git clone https://github.com/Tanush008/Calendra.git
cd Calendra


Install dependencies

npm install
# or
yarn install


Start the development server

npm run dev


Open your browser at http://localhost:3000 (or whichever port Next.js uses) to view the app.

Build for production

npm run build


Preview the production build

npm run start
