# SmartAttend AI — College Event and Workshop Attendance Management System

SmartAttend AI is a production-grade full-stack college capstone project designed to streamline and automate event/workshop registration, attendance tracking, and attendee assistance in academic institutions.

The system features two clearly separated application areas:
1. **Student Panel**: Registration, Login, Dashboard, Digital Profile (editable), Browse Events & Workshops, One-click Event Registration, My QR Passes (dynamic 2D QR matrix generation), Verified Attendance History, Available Certificates, and AI Event Assistant.
2. **Admin Panel**: Secure Institutional Login, Administrator Dashboard, Event Management (Create, Edit, Cancel, Delete), Student Directory, Registrations Registry, QR Gate Scanner with anti-passback protection, Attendance Reports & CSV Export, Certificate Management, and System Settings.

Strict architectural mandate: SmartAttend AI uses **strictly QR-matrix verification**. Biometrics, face recognition, and liveness checks are completely excluded.

---

## 🛠️ Technology Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS (Dark navy, blue, and clean white theme)
- **Backend**: Python 3.14 + Django 5 + Django REST Framework (DRF)
- **Database**: MySQL 8.0 (configured via environment variables)
- **Authentication**: Django token & session authentication with secure password hashing
- **QR Engine**: Python `qrcode` dynamic matrix generation + live gate scanner
- **AI Engine**: Context-aware AI Event Assistant

---

## 📁 Project Architecture

```
smartattend-ai/
├── frontend/                   # React + Vite + TypeScript application
│   ├── src/
│   │   ├── components/         # StudentSidebar, AdminSidebar, Navbar, Badges, etc.
│   │   ├── views/              # Student & Admin Panel views
│   │   │   ├── DashboardView.tsx
│   │   │   ├── EventsView.tsx
│   │   │   ├── MyPassesView.tsx
│   │   │   ├── AttendanceHistoryView.tsx
│   │   │   ├── StudentCertificatesView.tsx
│   │   │   ├── DigitalProfileView.tsx
│   │   │   ├── AIAssistantView.tsx
│   │   │   ├── AdminDashboardView.tsx
│   │   │   ├── AdminEventsView.tsx
│   │   │   ├── AdminStudentsView.tsx
│   │   │   ├── AdminRegistrationsView.tsx
│   │   │   ├── AdminQRScannerView.tsx
│   │   │   ├── AdminReportsView.tsx
│   │   │   ├── AdminCertificatesView.tsx
│   │   │   └── AdminSettingsView.tsx
│   │   ├── services/           # api.ts (DRF integration)
│   │   └── types/              # TypeScript interfaces
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── backend/                    # Python Django + DRF application
│   ├── smartattend/            # Core settings, WSGI, ASGI, Root URL routing
│   ├── core/                   # Health check endpoint (/api/health/) & base utilities
│   ├── accounts/               # Custom User (role: student|admin), StudentProfile, Auth API
│   ├── events/                 # Event scheduling, catalog & management
│   ├── registrations/          # EventRegistration (QR pass token) & Certificates
│   ├── attendance/             # QR-only Gate Scanner & AttendanceRecord audit logs
│   ├── ai_assistant/           # Natural language event query answering
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
├── .env.example                # Root environment variables template
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start Guide (Windows)

### Prerequisites
- **Node.js**: v22+
- **Python**: 3.14+
- **MySQL Server**: 8.0+

---

### Step 1: Backend Setup & First Admin Creation

1. Open PowerShell and navigate to `backend/`:
   ```powershell
   cd backend
   ```

2. (Recommended) Create and activate a virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. Install backend dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

4. Configure your `.env` file:
   ```powershell
   copy .env.example .env
   ```
   Open `backend/.env` and update your MySQL password:
   ```ini
   DB_PASSWORD=your_mysql_root_password
   ```

5. Run database migrations:
   ```powershell
   python manage.py makemigrations accounts events registrations attendance
   python manage.py migrate
   ```

6. **Create the First Administrator Account**:
   Run the secure Django management command:
   ```powershell
   python manage.py create_admin --email admin@college.edu --username admin --password SecureAdminPass123 --name "Dean of Technology"
   ```
   Or run interactively:
   ```powershell
   python manage.py create_admin
   ```

7. **Seed Initial Campus Events**:
   ```powershell
   python manage.py seed_events
   ```

8. Start the Django backend:
   ```powershell
   python manage.py runserver
   ```
   Backend API runs at `http://127.0.0.1:8000/`.

---

### Step 2: Frontend Setup

1. In a new PowerShell terminal, navigate to `frontend/`:
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```
2. Open `http://localhost:5173/` in your browser.

---

## 🔒 Role-Based Access Control (RBAC) & Security

| Feature | Student Panel | Admin Panel | Backend Permission |
| :--- | :--- | :--- | :--- |
| **Self-Registration** | Allowed (Student accounts only) | Prohibited (No public signup) | `AllowAny` for student registration only |
| **Authentication** | Student Sign In | Admin Portal Sign In | Rejects students on Admin portal with HTTP 403 |
| **Event Catalog** | Read-Only & 1-Click Register | Create, Edit, Cancel, Delete | Mutating APIs protected by `[IsAdminRole]` |
| **QR Passes** | View & print personal passes only | View all campus registrations | Students cannot see passes of other students |
| **Attendance Verification**| View personal check-in history | Operate Gate QR Scanner station | `scan/` API protected by `[IsAdminRole]` |
| **Anti-Passback** | Enforced | Real-time duplicate alerts logged | Returns HTTP 409 Conflict on repeated scan |
| **Certificates** | View & download personal credentials | Issue & manage credentials | `issue-certificate/` protected by `[IsAdminRole]` |
| **Attendance Reports** | Hidden | View audit table & Download CSV | `reports/` and `export-csv/` protected by `[IsAdminRole]` |

---

## 🧪 Running Automated Unit Tests

Run all 26 backend unit tests covering accounts, core, events, registrations, and attendance role-enforcement:
```powershell
python backend/manage.py test accounts core events registrations attendance
```

Verify frontend production build and TypeScript compilation:
```powershell
cd frontend
npm run build
```
