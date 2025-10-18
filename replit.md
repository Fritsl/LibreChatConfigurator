# Overview

This project (v1.18.0) is a comprehensive web-based configuration interface for LibreChat v0.8.0-rc4, designed to provide a professional, modern UI for managing all 100+ configuration settings. The application allows users to configure LibreChat settings through an intuitive interface and generate complete installation packages including environment files, YAML configurations, and deployment scripts with proper Docker Compose environment variable passthrough.

The system implements a full-stack architecture with React frontend, Express backend, and Drizzle ORM for data persistence. It features a tabbed configuration interface with real-time validation, configuration profile management, and package generation capabilities. Web search configuration strictly follows official LibreChat RC4 documentation, supporting only tested and documented providers: Serper (API-based search) and SearXNG (external instance). Firecrawl scraper includes comprehensive advanced configuration options (formats, content filtering, performance settings, privacy controls) with optimal defaults applied automatically.

**Smart Installation System**: ZIP packages include intelligent cross-platform installation scripts (install_dockerimage.bat for Windows, install_dockerimage.sh for Linux/macOS) that use the Configuration Name as a unique identifier. First run creates full LibreChat Docker setup; subsequent runs with matching config name update only LibreChat container while preserving MongoDB database. This enables live configuration updates without data loss.

**Architecture v1.18.0 - Versioned Configuration System**: Introduced schema-driven configuration management with automatic version tracking and migration support. Every JSON export now includes structured metadata (tool version, schema version, LibreChat target, timestamp) enabling forward compatibility. Dynamic schema defaults generator automatically includes new fields as LibreChat evolves, eliminating hardcoded defaults. Import system detects version mismatches and displays compatibility warnings. All configuration file generation (ENV, YAML, JSON) handled server-side as single source of truth. Configuration loader uses deep merge to populate new fields for existing users. UPDATE MODE optimized: skips service wait time and automatically restarts containers without user prompts.

**UI Organization**: The UI/Visibility tab is the first tab in the interface, consolidating app title, welcome message, footer text, help URL, and all interface visibility settings in one central location. A yellow warning alert at the top explains the LibreChat RC4 bug with modelSpecs.addedEndpoints and advises keeping it OFF. Technical metadata is displayed in clickable popovers (click the info icon) showing the exact env var/YAML path and target file for each configuration field.

**Known LibreChat RC4 Bug - modelSpecs.addedEndpoints**: The "Visible Endpoints (UI)" setting (modelSpecs.addedEndpoints) was originally intended as a workaround to hide the deprecated Plugins menu. However, **it causes critical bugs** where interface visibility settings malfunction (e.g., Presets shows even when disabled). This setting is **disabled by default (empty array)** and marked with prominent red warnings in the UI. Users should keep it OFF unless they fully understand the risks and need custom model specs configuration. The deprecated Plugins menu cannot be reliably hidden in RC4 - users should ignore it and use Agents instead.

**Enabled Endpoints Configuration**: The Server Configuration tab includes an "Enabled Endpoints" setting that controls which AI providers are available via the ENDPOINTS environment variable. By default, it includes openAI, anthropic, google, azureOpenAI, and agents, but excludes gptPlugins (deprecated in RC4). **Important**: LibreChat has no DEFAULT_ENDPOINT env variable - instead, it uses the first endpoint in the ENDPOINTS list as the initial option and remembers the last-used endpoint for each user. To enforce a specific default, use the Agents-Only Mode preset which restricts ENDPOINTS to just "agents".

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
- **Schema Definition**: Comprehensive Zod schemas covering all 100+ LibreChat settings
- **Category Organization**: Settings organized into 18 logical categories (Server, Security, Database, UI/Visibility, Image Generation, etc.)
- **Profile System**: Save and load configuration profiles with versioning support
- **Real-time Validation**: Client and server-side validation with detailed error reporting
- **Auto-Persistence**: Configuration automatically saved to browser localStorage to prevent data loss on page refresh, tab close, or screen lock
- **Smart Installation**: Configuration name (set in UI) serves as unique identifier for Docker installations, enabling safe updates without database overwrites

## Versioned Configuration System (v1.18.0+)
**Future-Proof Architecture**: Eliminates reliance on hardcoded defaults through dynamic schema-driven generation.

### Export Metadata
Every JSON export includes structured version metadata:
- **toolVersion**: Configurator version that created the export (e.g., "1.18.0")
- **librechatVersion**: Target LibreChat version (e.g., "0.8.0-rc4")
- **schemaVersion**: Configuration schema version for migration tracking (e.g., "1.0.0")
- **exportDate**: ISO timestamp of export creation
- **configurationName**: Optional name for identification

### Dynamic Schema Defaults
- **Automatic Field Detection**: New fields added to LibreChat RC4+ are automatically included in exports
- **Zod Schema Walking**: Recursively generates defaults from schema definitions (objects, arrays, enums, optionals)
- **Explicit Overrides**: Applies user-friendly defaults for better UX (e.g., cache enabled, memory disabled)
- **Cached Generation**: Generates defaults once, returns copies to prevent mutations

### Import Compatibility Checking
- **Version Detection**: Imports automatically check for tool, schema, and LibreChat version mismatches
- **Warning System**: Displays non-intrusive warnings when importing configs from different versions
- **Graceful Degradation**: All versions remain compatible; new fields use defaults if missing from old exports
- **Future Migration Support**: Infrastructure ready for schema migrations when breaking changes occur

### Benefits
1. **No Stale Defaults**: System automatically adapts as LibreChat adds new configuration fields
2. **Complete Backups**: Exports always include ALL fields (100+ vs old 51), ensuring 1:1 restore capability
3. **Version Transparency**: Users see exactly which versions created each export
4. **Forward Compatible**: Configurations can be safely moved between configurator versions
5. **Migration Ready**: Infrastructure in place to handle future breaking changes with conflict resolution

### Technical Implementation
- **shared/version.ts**: Central version management and metadata contract
- **shared/schema-defaults.ts**: Dynamic defaults generator from Zod schemas
- **client/src/pages/home.tsx**: Export/import with version checking
- **Backward Compatible**: Legacy exports without metadata still work; new exports include both old and new metadata structures

## Data Storage Solutions
- **Current**: Memory-based storage using Map data structures
- **Database Ready**: Drizzle ORM configuration for PostgreSQL with Neon serverless
- **Schema Migration**: Database schema defined in shared/schema.ts with migration support
- **Connection**: Environment-based database URL configuration

## Key Features
- **Tabbed Interface**: 18 categorized tabs with icons and progress indicators
- **Input Controls**: Specialized inputs for different data types (text, number, boolean, select, arrays)
- **Custom Endpoints**: Create multiple OpenAI-compatible endpoints with individual API keys and friendly names for organizing usage by project/team (e.g., "OpenAI - Work", "OpenAI - Personal")
- **Image Generation (DALL-E)**: Comprehensive DALL-E configuration for AI image generation via Agents, including support for DALL-E 2 and DALL-E 3, custom base URLs, reverse proxies, and system prompts
- **SearXNG Auto-Inclusion**: Toggle to automatically include SearXNG service in docker-compose with proper Docker networking (http://searxng:8080) and auto-generated secrets
- **Speech Preset System**: Quick-start presets for speech configuration with two options:
  - **ChatGPT Feel**: OpenAI Whisper STT + OpenAI TTS (tts-1-hd), conversation mode enabled, ISO 639-1 language codes (en, es, fr), customizable voice (alloy, echo, fable, onyx, nova, shimmer)
  - **Private & Cheap**: Browser-based speech (local provider), no API keys required, BCP-47 language codes (en-US, es-ES), uses browser's native speech capabilities
- **User Experience Presets**: One-click configuration presets for common LibreChat deployment scenarios:
  - **Agents-Only Mode**: Configures LibreChat RC4 for dedicated agents workflow by setting all required fields (modelSpecs.enforce=true, modelSpecs.prioritize=true, endpoints.agents.disableBuilder=true, interface.presets=false, interface.endpointsMenu=false, interface.modelSelect=false) with automatic default agent selection
  - **Standard Mode**: Restores default LibreChat interface with full endpoint menu and model selection
- **Model Specs Configuration**: Manual control over modelSpecs settings with support for all LibreChat RC4 fields (name, label, description, default, endpoint, agent_id) enabling custom preset definitions and fine-grained UI control
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