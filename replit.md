# Financial Management System

## Overview

This is a comprehensive financial management system built for collections and expense tracking. The application provides role-based access control with admin and collector roles, managing clients, contracts, installments, and expenses. It features a modern web interface with a React frontend and Express.js backend, using PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with shadcn/ui components
- **Styling**: Tailwind CSS with CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Session Management**: Express sessions with PostgreSQL storage
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **Build System**: ESBuild for production bundling

### Authentication & Authorization
- Session-based authentication using express-session
- Role-based access control (admin/collector)
- Session persistence in PostgreSQL using connect-pg-simple
- Route-level protection with middleware

## Key Components

### Database Schema
- **Users**: Authentication and role management (admin/collector)
- **Clients**: Customer information with CPF/phone identification
- **Contracts**: Financial agreements with installment terms
- **Installments**: Individual payment schedules with due dates
- **Expenses**: Cost tracking per user
- **Amortizations**: Payment history tracking
- **Logs**: System activity auditing

### Core Modules
1. **Dashboard**: Overview statistics and key metrics
2. **User Management**: Admin-only user creation and role assignment
3. **Client Management**: Customer database with search capabilities
4. **Contract Management**: Financial agreement creation and tracking
5. **Collections**: Due/overdue installment management with WhatsApp integration
6. **Expense Tracking**: Personal and administrative expense management
7. **Public Consultation**: Client-facing debt inquiry portal

### API Structure
- RESTful endpoints following `/api/{resource}` pattern
- Authentication middleware for protected routes
- Role-based authorization for admin-only operations
- Structured error handling and logging
- Session-based user state management

## Data Flow

### Authentication Flow
1. User submits credentials via login form
2. Server validates against user database
3. Session created and stored in PostgreSQL
4. User object stored in session for subsequent requests
5. Frontend receives user data and updates auth context

### Business Logic Flow
1. **Contract Creation**: Admin/collector creates contract with client info
2. **Installment Generation**: System automatically creates payment schedule
3. **Collection Management**: Users view due/overdue payments
4. **Payment Processing**: Manual payment recording with amortization tracking
5. **Expense Tracking**: Users record business expenses with categorization

### Data Persistence
- Drizzle ORM provides type-safe database operations
- PostgreSQL migrations managed via drizzle-kit
- Database connections through Neon serverless adapter
- Transactional operations for data consistency

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database operations
- **connect-pg-simple**: PostgreSQL session store

### UI/UX Libraries
- **Radix UI**: Headless component primitives
- **Tailwind CSS**: Utility-first styling framework
- **Lucide React**: Icon library
- **React Hook Form**: Form state management
- **Zod**: Runtime type validation

### Development Tools
- **TypeScript**: Type safety across frontend/backend
- **Vite**: Frontend build tool and dev server
- **ESBuild**: Backend bundling for production
- **TanStack Query**: Server state management

## Deployment Strategy

### Development
- Vite dev server for frontend with HMR
- tsx for TypeScript execution in development
- Concurrent frontend/backend development
- Session storage in development database

### Production Build
1. Frontend: Vite builds React app to `dist/public`
2. Backend: ESBuild bundles Express server to `dist/index.js`
3. Static files served by Express in production
4. Environment variables for database connectivity
5. Session persistence in production PostgreSQL

### Environment Configuration
- `NODE_ENV` for environment detection
- `DATABASE_URL` for PostgreSQL connection
- `SESSION_SECRET` for session encryption
- Replit-specific tooling integration for cloud deployment

The system is designed for scalability with clear separation of concerns, type safety throughout the stack, and a responsive user interface suitable for both desktop and mobile use.