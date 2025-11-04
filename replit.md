# Overview

This project provides a web-based configuration interface for LibreChat v0.8.0-rc4, enabling users to manage over 100 settings through an intuitive UI. Its primary purpose is to generate complete LibreChat installation packages, including environment files, YAML configurations, and Docker Compose deployment scripts. Key capabilities include configuration profile management, a "Smart Installation System" for cross-platform Docker deployments with live updates, and a "Versioned Configuration System" for schema-driven management and automatic version tracking. The system aims to simplify LibreChat deployment and management by offering a centralized, validated, and intuitive configuration experience, including seamless Office document support with automatic RAG integration and 100% documentation parity with LibreChat RC4.

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
- **Schema Definition**: Zod schemas for all LibreChat settings, organized into 18 logical categories.
- **Profile System**: Save and load configuration profiles with versioning.
- **Validation**: Real-time client and server-side validation.
- **Auto-Persistence**: Configuration saved to browser localStorage.
- **Versioned Configuration System**: JSON exports include metadata (`toolVersion`, `librechatVersion`, `schemaVersion`, `exportDate`, `configurationName`), with dynamic schema defaults and import compatibility checking.
- **Strict Import Validation System**: Comprehensive pre-import validation for YAML and .env files, rejecting imports with unmapped fields.
- **YAML-First Policy**: Fields with a `yamlPath` are strictly exported to `librechat.yaml` and not `.env`.
- **LibreChat Bug Handling System**: Intelligent workaround system for known LibreChat bugs, routing bug-affected fields to .env instead of YAML with UI warnings.

## System Design Choices
- **UI/UX**: Tabbed interface with specialized input controls, responsive design, and smart UI elements that adapt based on dependencies. Includes user experience presets (e.g., "Agents-Only Mode"). Features contextual UI alerts for RAG recommendations.
- **Technical Implementations**: Features a Smart Installation System for Docker deployments with live configuration updates. Includes a Secret Caching System for server-side secrets. Achieves 100% bidirectional parity across all 400+ configuration fields using a unified registry system and `configPath` translation layer for LibreChat's native YAML format. Includes automatic handling of RAG infrastructure (pgVector, RAG API) for Office documents and smart API key fallback for `RAG_OPENAI_API_KEY`. Critical fixes implemented for `.env` file quoting and disabling incomplete Speech and Memory blocks in YAML exports to prevent validation errors.
- **Feature Specifications**:
    - **Custom Endpoints**: Creation of multiple OpenAI-compatible endpoints.
    - **Image Generation**: Comprehensive DALL-E configuration via Agents.
    - **SearXNG Auto-Inclusion**: Toggle for including SearXNG in Docker Compose.
    - **Speech Preset System**: Quick-start presets for speech configurations.
    - **Model Specs Configuration**: Manual control over `modelSpecs` settings including `enforce` and `prioritize` flags, with an Agent ID Warning System.
    - **Agent Capabilities Manager**: Guided configuration with visual indicators.
    - **Preview & Package Generation**: Live preview of generated files and creation of complete deployment packages.
    - **Search Functionality**: Global search across settings.
    - **File Upload Configuration**: Comprehensive default file upload limits for agent endpoints, including automatic RAG setup for Office documents.
    - **Web Search Configuration**: Aligned with LibreChat RC4 webSearch YAML configuration.
    - **Advanced Title Customization**: Full control over conversation title generation.
    - **Complete Firecrawl Configuration**: All advanced web scraping options available.

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
- **Docker Images**: `ankane/pgvector:latest` (for RAG), `ghcr.io/danny-avila/librechat-rag-api-dev-lite:latest` (for RAG API).