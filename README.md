Synabto Office - Web App
A modern, lightweight office management system built for small to medium teams. It acts as a single source of truth for tasks, HR operations, and office logistics.

✨ Key Features
Role-Based Access Control (RBAC): Secure login system with Admin and Employee roles.
Task Management: Create, assign, and track tasks. Filter by status and export reports to CSV.
HR & Leaves: Employees can submit leave requests; Managers can approve or reject them with a single click.
Asset Tracking: Keep track of office equipment (laptops, licenses, etc.) and assign them to employees.
Meeting Room Booking: Reserve rooms with an automatic conflict-detection algorithm.
Smart Notifications: Bell icon alerts for task assignments and leave request updates.
Data Isolation: Employees only see data relevant to them (their tasks, their leaves).
Analytics Dashboard: Quick stats overview for management.
🛠️ Tech Stack
Frontend: React.js (Vite), Axios, PapaParse
Backend: Node.js, Express.js
Database: SQLite (better-sqlite3)
Auth: JWT (JSON Web Tokens), bcryptjs
🚀 Getting Started
Prerequisites
Node.js installed on your machine.
Installation
Clone the repository:
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.gitcd YOUR_REPO_NAME
Setup the Backend (Server):
bash

cd server
npm install
node index.js
(The server will run on http://localhost:5000 and create the SQLite database automatically)
Setup the Frontend (Client):
Open a new terminal window:
bash

cd client
npm install
npm run dev
(The app will run on http://localhost:5173)
Default Login Credentials
Email: admin@test.com
Password: 123456
