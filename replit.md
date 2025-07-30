# replit.md

## Overview

This is a modern web application for commercial stock management ("GestStock Pro"), built as a full-stack TypeScript application. The system provides inventory management capabilities including product tracking, stock movements, and dashboard analytics. The application follows a monorepo structure with shared types and schemas between the frontend and backend.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application uses a modern full-stack architecture with the following key decisions:

### Frontend Architecture
- **Framework**: React with TypeScript for type safety and modern development experience
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Shadcn/ui components built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for the REST API
- **Database**: PostgreSQL with Neon serverless database
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Schema Validation**: Zod for runtime type validation
- **Storage Strategy**: In-memory storage with JSON file persistence as fallback (MemStorage class)

### Build System
- **Bundler**: Vite for fast development and optimized production builds
- **TypeScript**: Shared configuration across client, server, and shared modules
- **Module System**: ESM (ES Modules) throughout the application

## Key Components

### Data Models
- **Products**: Core inventory items with fields for name, SKU, category, quantity, minimum stock levels
- **Stock Movements**: Audit trail for all inventory changes (add/remove operations)
- **Statistics**: Dashboard metrics for total products, stock levels, and alerts

### Frontend Components
- **Dashboard**: Main interface with statistics cards and product management
- **Product Table**: Comprehensive product listing with search, filtering, and actions
- **Modals**: Add product and stock adjustment interfaces
- **Layout**: Navigation bar and responsive layout components

### Backend Services
- **Storage Interface**: Abstract IStorage interface with in-memory implementation
- **API Routes**: RESTful endpoints for products, stock movements, and statistics
- **Validation**: Input validation using shared Zod schemas

## Data Flow

1. **Client Requests**: Frontend makes HTTP requests to Express API endpoints
2. **Validation**: Server validates input using Zod schemas shared between client and server
3. **Storage Operations**: MemStorage class handles data persistence to JSON files
4. **Response**: API returns typed responses consumed by React Query
5. **UI Updates**: TanStack Query automatically updates UI components when data changes

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL for production data storage
- **Drizzle Kit**: Database migration and schema management tools

### UI Libraries
- **Radix UI**: Accessible component primitives for dropdowns, dialogs, forms
- **Lucide React**: Icon library for consistent iconography
- **Date-fns**: Date manipulation utilities

### Development Tools
- **Replit Integration**: Development environment integration with error overlays and debugging tools

## Deployment Strategy

### Development
- **Dev Server**: Vite development server with HMR (Hot Module Replacement)
- **File Watching**: TSX for running TypeScript server with automatic restarts
- **Database**: Drizzle Kit for schema synchronization

### Production
- **Build Process**: 
  1. Vite builds optimized client bundle
  2. ESBuild bundles server code for Node.js runtime
- **Static Assets**: Client build output served from `/dist/public`
- **Server**: Express server runs from bundled code in `/dist`
- **Database**: PostgreSQL connection via environment variable

### Configuration
- **Environment Variables**: DATABASE_URL for database connection
- **Path Aliases**: Shared TypeScript paths for clean imports
- **Asset Management**: Vite handles static asset optimization and bundling

The application prioritizes type safety, developer experience, and maintainability through its use of TypeScript, shared schemas, and modern tooling. The architecture supports both development flexibility and production scalability.