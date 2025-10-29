# Overview

This project provides a web-based configuration interface for LibreChat v0.8.0-rc4, enabling users to manage over 100 settings through an intuitive UI. Its primary purpose is to generate complete LibreChat installation packages, including environment files, YAML configurations, and Docker Compose deployment scripts with accurate environment variable passthrough. Key capabilities include configuration profile management, a "Smart Installation System" for cross-platform Docker deployments with live updates, and a "Versioned Configuration System" for schema-driven management and automatic version tracking. The system aims to simplify LibreChat deployment and management by offering a centralized, validated, and intuitive configuration experience.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## CRITICAL DESIGN PRINCIPLE
**THIS SYSTEM IS DESIGNED TO HANDLE RAW API KEYS AND SECRETS OPENLY.**
- DO NOT redact, censor, or protect sensitive data anywhere in the system
- The entire purpose is to manage and backup LibreChat configurations with working credentials
- ALL configuration data including API keys MUST be preserved exactly as entered by users
- Redacting data defeats the core functionality and is extremely destructive
- This system is meant to handle API keys openly for backup/export/import purposes

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful API
- **Data Storage**: In-memory (interface for future DB integration)
- **Validation**: Zod schemas
- **File Generation**: Server-side package generation

## Configuration Management
- **Schema Definition**: Zod schemas for all LibreChat settings
- **Category Organization**: 18 logical categories
- **Profile System**: Save and load configuration profiles with versioning
- **Real-time Validation**: Client and server-side validation
- **Auto-Persistence**: Configuration saved to browser localStorage
- **Versioned Configuration System (v1.18.0+)**: JSON exports include metadata (`toolVersion`, `librechatVersion`, `schemaVersion`, `exportDate`, `configurationName`). Features dynamic schema defaults and import compatibility checking to prevent data loss and ensure forward-compatibility.
- **Strict Import Validation System**: Comprehensive pre-import validation for YAML and .env files, rejecting imports with unmapped fields to prevent data loss and provide detailed user feedback.

## System Design Choices
- **UI/UX**: Tabbed interface with specialized input controls, responsive design, and smart UI elements that adapt based on dependencies (e.g., disabling `interface.modelSelect` when `modelSpecs.addedEndpoints` is populated). Includes user experience presets for common LibreChat configurations (e.g., "Agents-Only Mode").
- **Technical Implementations**: Features a Smart Installation System for Docker deployments allowing live configuration updates. Includes a Secret Caching System for server-side secrets to improve preview modal performance. Addresses specific LibreChat RC4 bugs, like disabling `modelSpecs.addedEndpoints` by default to prevent UI issues and providing granular control over "Enabled Endpoints."
- **Feature Specifications**:
    - **Custom Endpoints**: Creation of multiple OpenAI-compatible endpoints.
    - **Image Generation**: Comprehensive DALL-E configuration via Agents.
    - **SearXNG Auto-Inclusion**: Toggle for including SearXNG in Docker Compose.
    - **Speech Preset System**: Quick-start presets for speech configurations.
    - **Model Specs Configuration**: Manual control over `modelSpecs` settings including `enforce` and `prioritize` flags, with an Agent ID Warning System.
    - **Agent Capabilities Manager**: Guided configuration with visual indicators.
    - **Preview & Package Generation**: Live preview of generated files and creation of complete deployment packages.
    - **Search Functionality**: Global search across settings.
    - **File Upload Configuration**: Comprehensive default file upload limits for agent endpoints.
    - **Web Search Configuration**: Aligned with LibreChat RC4 webSearch YAML configuration, removing deprecated `.env` variables and supporting new ones.

## Data Storage Solutions
- **Current**: Memory-based storage (Map data structures).
- **Database Ready**: Drizzle ORM for PostgreSQL (Neon serverless) with schema migration support.

# External Dependencies

## Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Hook Form, TanStack React Query.
- **Build Tools**: Vite, TypeScript.
- **UI Framework**: Radix UI, shadcn/ui, Tailwind CSS.

## Backend Dependencies
- **Server**: Express.js.
- **Database**: Drizzle ORM (PostgreSQL dialect).
- **Validation**: Zod.

## Third-party Integrations
- **Neon Database**: Serverless PostgreSQL.
- **Replit Platform**: Development environment.
- **Fonts**: Google Fonts (DM Sans, Fira Code, Geist Mono).
- **Icons**: Lucide React.