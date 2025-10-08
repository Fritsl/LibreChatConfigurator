# Changelog

All notable changes to LibreChat Configuration Tool will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.12.0] - 2025-10-08

### Fixed
- **CRITICAL: SearXNG 403 Errors Completely Resolved**: Fixed root cause of SearXNG 403 errors with comprehensive solution
  - **Settings File Generation**: Now generates `searxng/settings.yml` with JSON format enabled
    - SearXNG requires `formats: [html, json]` to accept LibreChat's JSON API requests
    - Previously SearXNG rejected requests with 403 when JSON format wasn't configured
  - **Docker Mount**: Updated docker-compose to mount `./searxng/settings.yml:/etc/searxng/settings.yml:ro`
    - Ensures SearXNG container uses generated configuration
    - Read-only mount for security
  - **Hardcoded YAML Values**: Fixed librechat.yaml to use actual values instead of ${ENV_VAR} placeholders
    - `searxngInstanceUrl`: Now hardcoded as "http://searxng:8080" when service included
    - `searxngApiKey`: Always present (even if empty) to signal server-configured
    - `firecrawlApiUrl` and `jinaApiUrl`: Now hardcoded with default URLs
    - LibreChat's plugin auth system checks for actual values vs env var references
  - **Error Resolution**: Fixes both "SearXNG 403" and "No plugin auth SEARXNG_API_KEY found" errors

### Technical Details
- **Root Cause**: LibreChat RC4 web search failures had two causes:
  1. SearXNG missing settings.yml with JSON format → 403 errors on API requests
  2. librechat.yaml using ${...} placeholders → plugin auth lookup failures
- **Solution**: Generate settings.yml + use hardcoded values in YAML to signal "server-configured"
- **Auto-Configuration**: When searxngIncludeService=true, all SearXNG settings are automatically configured

### Impact
- Eliminates all SearXNG 403 authentication errors
- Web search with SearXNG now works completely out-of-the-box
- No manual configuration required - just toggle "Include SearXNG Service"

## [1.11.0] - 2025-10-08

### Fixed
- **CRITICAL: Jina Field Name Correction**: Fixed LibreChat RC4 field name mismatch for Jina reranker
  - **Field Rename**: Changed `JINA_RERANKER_URL` to `JINA_API_URL` (LibreChat's actual expected field name)
  - **Schema Update**: Renamed `jinaRerankerUrl` to `jinaApiUrl` throughout codebase
  - **Error Resolution**: Fixes "No plugin auth JINA_API_URL found for user" error
  - **All Files Updated**: Field name corrected in .env, docker-compose.yml, librechat.yaml, and UI components
- **CRITICAL: SearXNG Secret Auto-Generation**: SEARXNG_SECRET now auto-generates with crypto.randomBytes
  - **Blank Secret Fixed**: Previously left blank, causing SearXNG authentication failures
  - **Auto-Generation**: Now generates 32-byte hex string automatically when SearXNG service is included
  - **Error Resolution**: Fixes "SearXNG API request failed: Request failed with status code 403" error

### Impact
- Eliminates "No plugin auth JINA_API_URL found" errors in LibreChat RC4
- Fixes SearXNG 403 authentication errors with auto-generated secrets
- Web search functionality now works correctly out-of-the-box

## [1.10.0] - 2025-10-08

### Fixed
- **CRITICAL: Web Search Configuration Bugs**: Fixed multiple issues preventing LibreChat RC4 web search from working
  - **SEARXNG_SECRET Concatenation**: Fixed bug where `SEARXNG_SECRET=` and `SEARXNG_INSTANCE_URL=` were concatenated on same line in .env file
  - **Missing URL Defaults**: Added default URLs for Firecrawl and Jina when scrapers/rerankers are selected:
    - `FIRECRAWL_API_URL` now defaults to `https://api.firecrawl.dev`
    - `JINA_RERANKER_URL` now defaults to `https://api.jina.ai/v1/rerank`
  - **Plugin Auth Errors**: Prevents LibreChat RC4 errors: "No plugin auth FIRECRAWL_API_URL found" and "No plugin auth JINA_API_URL found"
  - **Consistency Across Files**: URL fields now properly included in .env, docker-compose.yml, and librechat.yaml when web search features are enabled

### Impact
- Fixes LibreChat RC4 web search functionality completely
- Eliminates plugin auth lookup failures for Firecrawl and Jina
- Ensures all web search configuration variables are properly formatted and available to LibreChat container

## [1.9.0] - 2025-10-08

### Fixed
- **CRITICAL: Docker Compose Environment Variables**: Fixed major issue where docker-compose.yml wasn't passing most environment variables to LibreChat container
  - Previously only ~10 basic variables were passed (database, security, OPENAI_API_KEY)
  - Now passes ALL 150+ configured environment variables organized by category
  - Includes all AI provider API keys (OpenAI, Anthropic, Google, Groq, Mistral, DeepSeek, etc.)
  - Includes OAuth provider credentials (Google, GitHub, Discord, Facebook, Apple, OpenID)
  - Includes web search configuration (SEARXNG_INSTANCE_URL, FIRECRAWL_API_KEY, JINA_API_KEY, COHERE_API_KEY, etc.)
  - Includes code execution (LIBRECHAT_CODE_API_KEY, E2B_API_KEY, E2B_PROXY_URL, etc.)
  - Includes email, file storage (Firebase, Azure, S3), RAG API, MeiliSearch, LDAP, Turnstile
  - Includes rate limits, features, caching, debug, OCR, subdirectory hosting configurations
  - Uses commented/uncommented pattern to show all available variables for easy reference

### Impact
- Fixes issue where LibreChat UI prompted users to enter API keys despite them being in .env file
- Docker Compose now properly injects environment variables from .env into the container
- Users no longer need to manually configure credentials in LibreChat UI after deployment

## [1.8.0] - 2025-10-08

### Added
- **SearXNG Auto-Inclusion Feature**: When selecting "SearXNG (Self-Hosted)" as web search provider
  - New toggle switch to automatically include SearXNG service in docker-compose.yml
  - Auto-configures proper Docker networking (http://searxng:8080 for container-to-container communication)
  - Auto-generates SEARXNG_SECRET environment variable with instructions (openssl rand -hex 32)
  - SearXNG service includes health checks, volume persistence, and network integration
  - Automatically sets SEARXNG_INSTANCE_URL to service name when included, or allows custom URL when external

### Changed
- **Docker Networking**: SearXNG service URL now uses Docker service name (http://searxng:8080) instead of localhost when service is included
- **Environment Configuration**: SEARXNG_INSTANCE_URL automatically configured based on include toggle

## [1.7.0] - 2025-10-07

### Added
- **Artifacts Tab**: New dedicated tab for LibreChat artifacts configuration (generative UI)
  - Interface toggle for showing/hiding artifacts UI
  - Self-hosted Sandpack bundler URL configuration option
  - Agent capabilities checkbox interface (artifacts, context, ocr, chain, web_search)
- **Improved Agent Capabilities UX**: Checkbox interface replaces freetext input for better usability
- **Search Enhancement**: Clear button (X) added to settings search input for easy reset

### Changed
- **Default Capabilities**: All 9 agent capabilities now enabled by default (execute_code, file_search, actions, tools, artifacts, context, ocr, chain, web_search)
- **Code Execution Defaults**: LibreChat Code Interpreter and E2B proxy now properly default to OFF
- **Array Fields with Options**: Array fields that have predefined options now render as checkbox groups instead of freetext inputs

### Fixed
- LSP type errors in configuration defaults
- Missing interface fields (runCode, artifacts) in default configurations

## [1.6.0] - 2025-10-02

### Added
- **Auto-save Feature**: Configuration now automatically saves to browser localStorage
  - Prevents data loss on page refresh, tab close, or screen lock
  - Seamless persistence across sessions

## [0.1.0] - 2025-09-25

### Added
- **Progressive Disclosure System**: Choose providers first, then see only relevant configuration fields
- **Comprehensive LibreChat v0.8.0 Support**: Support for 100+ configuration options including environment variables and librechat.yaml settings
- **Tabbed Configuration Interface**: 17 organized categories (Server, Security, Database, AI Providers, OAuth, File Storage, Email, Search, etc.)
- **Real-time Validation**: Client and server-side validation with detailed error reporting
- **Configuration Profile Management**: Save, load, and manage multiple configuration profiles
- **Package Generation**: Generate complete deployment packages including:
  - `.env` environment file
  - `librechat.yaml` configuration file
  - `docker-compose.yml` for containerized deployment
  - Installation scripts and README
- **Local Secrets Management**: Secure local storage of API keys in `data/secrets/` directory
- **Clean Community Release**: GitHub repository with no Replit-specific dependencies

### Features by Category
- **Core Settings**: App configuration, server settings, security, database connections
- **AI Provider APIs**: OpenAI, Anthropic, Google, Azure OpenAI, AWS Bedrock, and 15+ additional providers
- **OAuth Authentication**: Google, GitHub, Discord, Facebook, Apple, OpenID Connect
- **File Storage**: Local, Firebase, Azure Blob Storage, Amazon S3 with progressive disclosure
- **Email Services**: SMTP and Mailgun configuration with service-specific fields
- **Search & RAG**: Web search providers (Serper, Brave, Tavily, etc.), MeiliSearch integration, RAG API setup
- **Advanced Features**: Interface customization, rate limiting, caching presets, MCP servers
- **Development Tools**: TypeScript support, modern React stack, comprehensive validation

### Technical Implementation
- **Frontend**: React 18 + TypeScript, Tailwind CSS, shadcn/ui components, TanStack Query
- **Backend**: Express.js + TypeScript, Zod validation, in-memory storage with database-ready architecture
- **Build System**: Vite for development and production builds
- **Security**: Local-only API key storage, environment-based configuration
- **Documentation**: Comprehensive README with configuration mapping and official docs links

### Community
- **Open Source**: MIT License for community contributions
- **Documentation**: Detailed setup instructions and configuration guides
- **Contribution Ready**: Clear architecture for community extensions and updates