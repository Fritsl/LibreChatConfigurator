# Overview

This project (v1.17.3) is a comprehensive web-based configuration interface for LibreChat v0.8.0-rc4, designed to provide a professional, modern UI for managing all 73+ configuration settings. The application allows users to configure LibreChat settings through an intuitive interface and generate complete installation packages including environment files, YAML configurations, and deployment scripts with proper Docker Compose environment variable passthrough.

The system implements a full-stack architecture with React frontend, Express backend, and Drizzle ORM for data persistence. It features a tabbed configuration interface with real-time validation, configuration profile management, and package generation capabilities. Web search configuration strictly follows official LibreChat RC4 documentation, supporting only tested and documented providers: Serper (API-based search) and SearXNG (external instance). Firecrawl scraper includes comprehensive advanced configuration options (formats, content filtering, performance settings, privacy controls) with optimal defaults applied automatically.

**Architecture v1.17.3**: All configuration file generation (ENV, YAML, JSON) is handled server-side as a single source of truth. The preview modal fetches files from the server API rather than duplicating generation logic, ensuring preview and downloaded files are always identical. LibreChatConfigSettings.json version auto-syncs with tool version. Configuration loader uses deep merge to populate new fields for existing users.

# User Preferences

Preferred communication style: Simple, everyday language.

## Development Notes

**Cross-Platform Installation Scripts**: Always maintain both `install_dockerimage.sh` (Linux/macOS) and `install_dockerimage.bat` (Windows) in parallel. Any changes to installation logic must be applied to both files to ensure consistent experience across all operating systems.

# System Architecture

## CRITICAL DESIGN PRINCIPLE
**THIS SYSTEM IS DESIGNED TO HANDLE RAW API KEYS AND SECRETS OPENLY.**
- DO NOT redact, censor, or protect sensitive data anywhere in the system
- The entire purpose is to manage and backup LibreChat configurations with working credentials
- ALL configuration data including API keys MUST be preserved exactly as entered by users
- Redacting data defeats the core functionality and is extremely destructive
- This system is meant to handle API keys openly for backup/export/import purposes

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system and CSS variables for theming
- **State Management**: React hooks for local state, TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation schemas

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful API with structured endpoints for configuration management
- **Data Storage**: In-memory storage with interface for future database integration
- **Validation**: Zod schemas for runtime type checking and validation
- **File Generation**: Server-side package generation for deployment files

## Configuration Management
- **Schema Definition**: Comprehensive Zod schemas covering all 73+ LibreChat settings
- **Category Organization**: Settings organized into 17 logical categories (Server, Security, Database, UI/Visibility, etc.)
- **Profile System**: Save and load configuration profiles with versioning support
- **Real-time Validation**: Client and server-side validation with detailed error reporting
- **Auto-Persistence**: Configuration automatically saved to browser localStorage to prevent data loss on page refresh, tab close, or screen lock

## Data Storage Solutions
- **Current**: Memory-based storage using Map data structures
- **Database Ready**: Drizzle ORM configuration for PostgreSQL with Neon serverless
- **Schema Migration**: Database schema defined in shared/schema.ts with migration support
- **Connection**: Environment-based database URL configuration

## Key Features
- **Tabbed Interface**: 17 categorized tabs with icons and progress indicators
- **Input Controls**: Specialized inputs for different data types (text, number, boolean, select, arrays)
- **Custom Endpoints**: Create multiple OpenAI-compatible endpoints with individual API keys and friendly names for organizing usage by project/team (e.g., "OpenAI - Work", "OpenAI - Personal")
- **SearXNG Auto-Inclusion**: Toggle to automatically include SearXNG service in docker-compose with proper Docker networking (http://searxng:8080) and auto-generated secrets
- **Preview System**: Live preview of generated configuration files
- **Package Generation**: Complete deployment package creation with multiple file formats
- **Search Functionality**: Global search across all configuration settings
- **Responsive Design**: Mobile-first design with adaptive layouts

## Component Architecture
- **Configuration Tabs**: Main interface component with category-based organization
- **Setting Input**: Reusable input component with type-specific rendering
- **Validation Panel**: Real-time validation status and error reporting
- **Preview Modal**: File preview with syntax highlighting
- **Status Indicators**: Visual feedback for configuration validity

# External Dependencies

## Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Hook Form, TanStack React Query
- **Build Tools**: Vite with TypeScript support, ESBuild for production builds
- **UI Framework**: Radix UI primitives, shadcn/ui components, Tailwind CSS

## Backend Dependencies
- **Server**: Express.js with TypeScript support via tsx
- **Database**: Drizzle ORM with PostgreSQL dialect, Neon serverless database
- **Validation**: Zod for schema validation, zod-validation-error for error formatting
- **Utilities**: Date-fns for date handling, nanoid for ID generation

## Development Tools
- **TypeScript**: Full TypeScript support with strict configuration
- **Linting/Formatting**: Configured for TypeScript and React best practices
- **Testing**: Ready for testing framework integration
- **Deployment**: Docker and production build configurations

## Third-party Integrations
- **Neon Database**: Serverless PostgreSQL for production data storage
- **Replit Platform**: Development environment integration with runtime error overlay
- **Fonts**: Google Fonts integration (DM Sans, Fira Code, Geist Mono)
- **Icons**: Lucide React for consistent iconography

## File Upload and Storage
- **Strategy**: Configurable file storage (local, S3, Azure Blob, Firebase)
- **Limits**: Configurable file size and count limitations
- **Processing**: Image processing and OCR capabilities

## Authentication and Security
- **JWT**: Token-based authentication with refresh token support
- **Encryption**: Configurable credential encryption with key/IV management
- **Session Management**: Express session handling with PostgreSQL store
- **CORS**: Configurable cross-origin resource sharing