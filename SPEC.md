# CareerFlow - Requirements & Specification (v1.0)

## 1. Overview

CareerFlow is a full-stack web application that enables users to track, manage, and analyze job and internship applications through a structured pipeline. The system provides secure user accounts, intuitive application management, and data-driven insights into the job search process.

CareerFlow is designed to reflect real-world product engineering practices, emphasizing scalability, security, and maintainability.

## 2. Goals & Non-Goals

### Goals

- Enable users to manage job applications end-to-end
- Provide a clear, intuitive pipeline view of application stages
- Ensure secure authentication and data isolation
- Demonstrate production-quality full-stack engineering

### Non-Goals (v1.0)

- Automatic ingestion from job boards
- Resume parsing or ATS integrations
- Native mobile application

## 3. User Personas

### Primary Persona

**Students / Early-Career Engineers**

- Apply to many roles in parallel
- Need lightweight tracking and reminders
- Value speed, clarity, and reliability

### Secondary Persona

**General Job Seekers**

- Longer hiring cycles
- Emphasis on notes, contacts, and analytics

## 4. Functional Requirements

### 4.1 Authentication & Account Management

- **FR-AUTH-1**: Users can register with email and password
- **FR-AUTH-2**: Users can authenticate and receive a JWT-based session token
- **FR-AUTH-3**: Users can log out and invalidate client sessions
- **FR-AUTH-4**: Passwords must be securely hashed (bcrypt or Argon2)
- **FR-AUTH-5**: Users can update profile metadata (name, timezone)

**Acceptance Criteria**

- Duplicate email registration is rejected
- Auth-protected routes reject unauthenticated requests
- Users can only access their own data

### 4.2 Application Management (Core Domain)

Each **Application** represents one job or internship submission.

- **FR-APP-1**: Users can create an application with required fields
- **FR-APP-2**: Users can view a list of all applications
- **FR-APP-3**: Users can update application fields
- **FR-APP-4**: Users can delete applications (soft delete recommended)
- **FR-APP-5**: Users can transition applications between predefined stages
- **FR-APP-6**: Users can assign optional deadlines

**Application Fields (Minimum)**

- Company name (required)
- Role title (required)
- Application status (enum)
- Application date
- Location (remote/on-site/hybrid)
- Deadline (optional)
- Notes (optional, long text)
- Source (LinkedIn, referral, company site)

**Application Status Enum**

- Draft
- Applied
- Online Assessment
- Interviewing
- Offer
- Rejected
- Withdrawn

### 4.3 Notes & Activity Tracking

- **FR-NOTE-1**: Users can add free-text notes to applications
- **FR-NOTE-2**: Notes are timestamped and ordered chronologically
- **FR-NOTE-3**: Notes can be edited or deleted

### 4.4 Search, Filter & Sorting

- **FR-FILTER-1**: Users can filter applications by status
- **FR-FILTER-2**: Users can search by company or role name
- **FR-FILTER-3**: Users can sort by date applied or deadline

### 4.5 Dashboard & Visualization

- **FR-DASH-1**: Users can view a summary dashboard
- **FR-DASH-2**: Display counts by application status
- **FR-DASH-3**: Show time-based metrics (applications per week/month)

## 5. Non-Functional Requirements

### 5.1 Security

- All API endpoints require authentication except login/register
- Input validation on both client and server
- Protection against common attacks (SQL injection, XSS)
- HTTPS enforced in production

### 5.2 Performance

- API responses under 300ms for typical requests
- Pagination for large application lists

### 5.3 Reliability

- Graceful error handling
- Meaningful HTTP status codes
- Centralized logging (basic)

## 6. System Architecture

### 6.1 High-Level Architecture

- **Frontend**: React (SPA)
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Auth**: JWT-based stateless auth
- **Deployment**:
  - Frontend: Vercel
  - Backend: Render / Railway
  - DB: Supabase / Neon

## 7. Data Model (Simplified)

### User

- id (UUID)
- email (unique)
- password_hash
- name
- created_at

### Application

- id (UUID)
- user_id (FK)
- company
- role
- status
- applied_date
- deadline
- notes
- source
- created_at
- updated_at
- deleted_at (nullable)

## 8. API Specification (Sample)

- `POST /auth/register`: Creates a new user account
- `POST /auth/login`: Authenticates user and returns JWT
- `GET /applications`: Returns all applications for authenticated user
- `POST /applications`: Creates a new application
- `PUT /applications/{id}`: Updates application details
- `DELETE /applications/{id}`: Soft-deletes application

## 9. Frontend Requirements

- Responsive layout (desktop-first)
- Component-based architecture
- Controlled forms with validation
- Loading and error states
- Clear separation between UI and data logic

## 10. Future Enhancements (v2+)

- Email reminders for deadlines
- Kanban-style drag-and-drop pipeline
- Analytics on response rates
- Multi-user collaboration (shared pipelines)
- Role-based access (admin)

## 11. Quality & Documentation

- README with setup instructions
- Clear commit history
- Inline code comments where needed
- Deployed live demo
