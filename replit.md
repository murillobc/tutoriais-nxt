# Overview

This is a tutorial release management system for Nextest, designed to allow employees to create and manage tutorial access for external clients. The application features a React frontend built with TypeScript, Vite, and shadcn/ui components, paired with an Express backend using Drizzle ORM for PostgreSQL database management. The system implements email-based authentication with verification codes, restricted to @nextest.com.br domain users, and provides a comprehensive dashboard for managing tutorial releases with client information tracking.

## Recent Updates (v2.1 - August 2025)
- ✅ **Expiration System**: Added automatic 90-day expiration for tutorial releases when status changes to "success"
- ✅ **Auto-Expiration**: Automated system to mark releases as "expired" when expiration date is reached
- ✅ **Report Generation**: PDF and Excel export functionality for tutorial releases data
- ✅ **Enhanced Dashboard**: New expiration date column and export buttons
- ✅ **Database Migration**: Updated schema to support expiration dates and new status types

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development
- **UI Library**: shadcn/ui components built on Radix UI primitives with Tailwind CSS
- **Styling**: Custom design system with Nextest brand colors (#0075C5 blue, #60AB4B green, #01283E dark, #1AA3F7 light blue)
- **State Management**: TanStack Query for server state and React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

## Backend Architecture
- **Runtime**: Node.js with Express.js framework using TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations
- **Authentication**: Email/password system with forgot password functionality, domain-restricted to @nextest.com.br
- **Email Service**: Nodemailer for sending verification codes with HTML email templates
- **API Design**: RESTful endpoints with structured error handling and request logging middleware

## Database Schema
- **Users**: Employee accounts with name, email, department, and status fields
- **Verification Codes**: Temporary codes for email authentication with expiration tracking
- **Tutorials**: Tutorial content catalog with categories and active status
- **Tutorial Releases**: Client access records linking users to client information and selected tutorials
  - **New**: `expirationDate` field for 90-day automatic expiration from success status
  - **Updated**: Status now includes 'expired' option alongside pending, success, failed

## Key Features
- **Domain-Restricted Authentication**: Only @nextest.com.br email addresses can register and login
- **Tutorial Release Management**: Track client details (name, CPF, email, company) and assigned tutorials
- **Dashboard Analytics**: Display statistics for total releases, monthly counts, active releases, and company metrics
- **Search and Filtering**: Client and release search functionality with status filtering including expired status
- **Input Validation**: CPF and phone number masking with comprehensive form validation
- **HTTP Status API**: External systems can update tutorial release status via POST /api/tutorial-releases/:id/status endpoint
- **Expiration Management**: Automatic 90-day expiration system with visual indicators and status updates
- **Report Generation**: PDF and Excel export capabilities with comprehensive data including expiration dates
- **Docker Support**: Full Docker and Docker Compose configuration for VPS deployment with Traefik reverse proxy
- **Production Environment**: Configured for educanextest.com.br domain with SSL/TLS support

# External Dependencies

## Database
- **Neon PostgreSQL**: Serverless PostgreSQL with WebSocket support for production deployment
- **Drizzle Kit**: Database migrations and schema management tools with migrations output to ./migrations directory

## Email Services
- **Resend SMTP**: Configured to use smtp.resend.com on port 587 for reliable email delivery
- **Nodemailer**: Email sending library with HTML template support and Resend integration

## UI Framework
- **Radix UI**: Accessible component primitives for complex UI elements
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Icon library for consistent iconography

## Development Tools
- **Vite**: Build tool with hot module replacement and optimized production builds
- **ESBuild**: Fast JavaScript bundler for server-side code compilation
- **TypeScript**: Type safety across the entire application stack

## Third-Party Integrations
- **TanStack Query**: Server state management with caching and background updates
- **React Hook Form**: Form state management with performance optimization
- **Zod**: Runtime type validation and schema definition
- **Input Masking**: Custom input formatting for Brazilian CPF and phone numbers