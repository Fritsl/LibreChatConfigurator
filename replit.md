# Overview

This project is a web-based configuration interface for LibreChat v0.8.0-rc4, enabling users to manage over 100 settings through an intuitive UI. It generates complete installation packages, including environment files, YAML configurations, and Docker Compose deployment scripts with proper environment variable passthrough.

The system features a React frontend, Express backend, and Drizzle ORM, offering a tabbed interface with real-time validation, configuration profile management, and smart package generation. It includes a "Smart Installation System" for cross-platform Docker deployments, allowing live configuration updates without data loss. A "Versioned Configuration System" with schema-driven management ensures automatic version tracking and migration support, dynamic schema defaults, and import compatibility checks.

The UI consolidates settings like app title, welcome message, and interface visibility. The system addresses a known LibreChat RC4 bug related to `modelSpecs.addedEndpoints` by disabling it by default due to its impact on interface visibility settings. It also provides granular control over "Enabled Endpoints" to configure available AI providers.

# Recent Changes

## October 27, 2025
- **Configuration Name Update Bug**: Fixed issue where configuration name wasn't being updated in the configuration object when loading from Package History. The name was being set in React state and localStorage, but not in the configuration object itself, causing exports and saves to retain the old name. Now properly updates all three locations.

## October 26, 2025  
- **100% Configuration Field Coverage**: Fixed critical persistence issue where 68+ fields were missing from defaultConfiguration, causing data loss across localStorage save/load and JSON export/import. Added all missing fields including:
  - **Top-level fields (50+)**: filteredTools, includedTools, DALL-E (8 fields), RAG API (7 fields), E2B extended (4 fields), Azure OpenAI (4 fields), AWS extended (3 fields), Azure Storage (2 fields), MeiliSearch (2 fields), Rate limiting/security (10 fields), LDAP (5 fields), Turnstile (2 fields), Caching (5 fields), MCP OAuth (2 fields), System (3 fields), and various URLs/API keys
  - **Nested object fields (18+)**: webSearch.jinaApiUrl, memory (validKeys, tokenLimit, agent with full model_parameters), ocr (apiKey, baseURL), stt (apiKey, baseURL, language), tts (apiKey, baseURL), speech.speechTab (complete STT/TTS configuration), interface.defaultPreset, modelSpecs (enforce, prioritize, list)
  - All user configuration data now persists correctly across browser reloads, localStorage operations, and JSON import/export cycles

## Earlier October 26, 2025
- **Model Specs Enforce/Prioritize Controls**: Added manual toggle controls for `modelSpecs.enforce` and `modelSpecs.prioritize` in the UI/Visibility tab. These settings are critical for default agent functionality - without them, LibreChat ignores configured agent IDs and shows the "last used agent" instead.
- **Agent ID Warning System**: ModelSpecsPresetManager now displays a prominent warning when users set an `agent_id` without enabling both `enforce` and `prioritize` flags. The warning explains that the agent ID won't work as a default without these settings and provides clear instructions to fix it.
- **Upload as Text UX Improvement**: Added clear cross-references between the two separate "Upload as Text" settings (UI/Visibility and Agent Capabilities) to prevent user confusion. Each setting now explicitly explains what it controls and that both must be configured together to fully disable the feature.
- **Agents Endpoint File Upload Configuration**: Fixed critical bug where agents endpoint had no default file upload limits, causing LibreChat to reject valid files with restrictive hardcoded defaults. Now includes comprehensive default configuration (5 files, 10MB per file, 50MB total) with broad MIME type support (images, documents, code files). Added prominent UI warning in File Storage tab to remind users to configure file limits for all enabled endpoints.
- **MeiliSearch Configuration Fix**: Fixed MEILI_NO_ANALYTICS to only appear as an active setting when MEILISEARCH_URL is configured, preventing errors when MeiliSearch is not in use.
- **Secret Caching System**: Implemented server-side caching for JWT_SECRET, JWT_REFRESH_SECRET, CREDS_KEY, and CREDS_IV to prevent regeneration across multiple preview requests, eliminating preview modal flickering issues.

## October 19, 2025
- **Interface Schema Migration**: Removed deprecated `interface.endpointsMenu` field (deprecated in LibreChat v1.2.4) and migrated to `interface.modelSelect` throughout the codebase
- **New RC4 Fields Added**: Integrated missing fields from LibreChat v1.2.4 documentation:
  - `interface.mcpServers.placeholder`: Placeholder text for MCP server configuration
  - `interface.temporaryChatRetention`: Chat retention period in hours (1-8760, default: 720)
  - `interface.webSearch`: Toggle web search UI visibility
- **Schema Compliance**: Updated all configuration defaults, UI presets, and test data to match current LibreChat RC4 specifications
- **Smart UI Disable System**: Added dependency-aware UI that automatically disables `interface.modelSelect` when `modelSpecs.addedEndpoints` is populated, matching LibreChat's behavior. Shows clear explanation with lock icon and provides "Configure Model Specs" button that scrolls to and highlights the dependent field. Prevents confusing state where user sets modelSelect=false but LibreChat silently enables it.

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
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React hooks, TanStack Query
- **Routing**: Wouter
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
- **Smart Installation**: Configuration name as unique identifier for Docker updates

## Versioned Configuration System (v1.18.0+)
- **Export Metadata**: JSON exports include `toolVersion`, `librechatVersion`, `schemaVersion`, `exportDate`, and `configurationName`.
- **Dynamic Schema Defaults**: Automatically includes new fields from LibreChat RC4+ using Zod schema walking.
- **Import Compatibility Checking**: Detects version mismatches and provides warnings.
- **Benefits**: Eliminates stale defaults, ensures complete backups, provides version transparency, and is forward-compatible and migration-ready.

## Data Storage Solutions
- **Current**: Memory-based storage (Map data structures)
- **Database Ready**: Drizzle ORM for PostgreSQL (Neon serverless) with schema migration support.

## Key Features
- **Tabbed Interface**: 18 categorized tabs.
- **Input Controls**: Specialized inputs for various data types.
- **Custom Endpoints**: Create multiple OpenAI-compatible endpoints.
- **Image Generation (DALL-E)**: Comprehensive DALL-E configuration via Agents.
- **SearXNG Auto-Inclusion**: Toggle to include SearXNG in Docker Compose.
- **Speech Preset System**: Quick-start presets for ChatGPT Feel (OpenAI) and Private & Cheap (browser-based) speech configurations.
- **User Experience Presets**: One-click configuration for "Agents-Only Mode" and "Standard Mode".
- **Model Specs Configuration**: Manual control over `modelSpecs` settings.
- **Agent Capabilities Manager**: Guided configuration for agent capabilities with visual indicators, descriptions, and direct navigation to settings.
- **Preview System**: Live preview of generated configuration files.
- **Package Generation**: Complete deployment package creation.
- **Search Functionality**: Global search across settings.
- **Responsive Design**: Mobile-first design.

# External Dependencies

## Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Hook Form, TanStack React Query.
- **Build Tools**: Vite, TypeScript, ESBuild.
- **UI Framework**: Radix UI, shadcn/ui, Tailwind CSS.

## Backend Dependencies
- **Server**: Express.js, tsx.
- **Database**: Drizzle ORM (PostgreSQL dialect), Neon serverless.
- **Validation**: Zod, zod-validation-error.
- **Utilities**: Date-fns, nanoid.

## Third-party Integrations
- **Neon Database**: Serverless PostgreSQL.
- **Replit Platform**: Development environment.
- **Fonts**: Google Fonts (DM Sans, Fira Code, Geist Mono).
- **Icons**: Lucide React.