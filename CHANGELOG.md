# Changelog

All notable changes to LibreChat Configuration Tool will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.17.1] - 2025-10-09

### Fixed - CRITICAL BUG
- **Invalid YAML Structure**: Removed incorrect `app:` wrapper from generated librechat.yaml
  - **Issue**: LibreChat v0.8.0-RC4 was rejecting configurations with error: "Unrecognized key(s) in object: 'app'"
  - **Root Cause**: YAML generator was wrapping webSearch config in invalid `app:` key (lines 773-782)
  - **Fix**: Removed `app:` wrapper - `webSearch` is now properly generated as top-level YAML key
  - **Impact**: 
    - ✅ Generated configurations now load successfully in LibreChat RC4
    - ✅ Firecrawl timeout and advanced options now work correctly (were being ignored due to invalid config)
    - ✅ Web search configuration properly recognized by LibreChat
  - **User Impact**: If you downloaded configurations from v1.17.0, they won't work. Re-download from v1.17.1

### Technical Details
- The `app:` structure was from an older LibreChat version and is not supported in RC4
- Proper RC4 structure has `webSearch:` as a top-level key alongside `version`, `cache`, `endpoints`, etc.
- The correct webSearch configuration was already being generated (line 1028+), but the invalid app: section appeared first and caused parsing to fail

## [1.17.0] - 2025-10-09

### Added
- **Advanced Firecrawl Configuration Options**: Comprehensive settings for optimal web scraping
  - **Output Formats**: Select multiple formats (markdown, html, links, screenshot)
  - **Content Filtering**: `onlyMainContent` to extract main content only
  - **Performance Settings**: 
    - `timeout` (20000ms default) - Maximum time to wait for page load
    - `waitFor` (1000ms default) - Additional wait time for dynamic content
  - **Privacy & Performance**: 
    - `blockAds` (true default) - Block advertisements for cleaner content
    - `removeBase64Images` (true default) - Remove embedded images for smaller payload
    - `mobile` (true default) - Use mobile user agent for lighter markup
  - **Caching**: `maxAge` (0 default) - Set to >0 for cached pages
  - **Proxy**: `proxy` ("auto" default) - Automatic proxy selection for reliability
  - **Optimal Defaults**: Best-practice settings applied automatically when Firecrawl is selected

### Changed
- **UI Enhancement**: Advanced Firecrawl options now in collapsible section for cleaner interface
- **YAML Generation**: `firecrawlOptions` object properly formatted in generated librechat.yaml
- **Configuration Schema**: Extended to support all Firecrawl advanced parameters

### Technical Details
- Added `firecrawlOptions` to webSearch schema with proper Zod validation
- Updated web-search-editor.tsx with collapsible UI for advanced settings
- Updated YAML generator to include firecrawlOptions in webSearch section
- All options have sensible defaults matching LibreChat best practices

### Why This Matters
- **Better Performance**: Optimized settings reduce payload size and improve scraping speed
- **Cleaner Data**: Content filtering removes ads, base64 images, and non-main content
- **Reliability**: Auto proxy and mobile mode increase scraping success rate
- **Flexibility**: Fine-tune all Firecrawl parameters to your specific needs

## [1.16.0] - 2025-10-08

### BREAKING CHANGES
- **Restricted Web Search to Officially Supported Providers**: Aligned configuration with LibreChat RC4 official documentation
  - **Removed Search Providers**: Brave, Tavily, Perplexity, Google Custom Search, Bing Search API
  - **Kept Only Documented Providers**: Serper and SearXNG (as per official LibreChat webSearch documentation)
  - **Removed Schema Fields**: `braveApiKey`, `tavilyApiKey`, `perplexityApiKey`, `googleSearchApiKey`, `googleCSEId`, `bingSearchApiKey` from webSearch configuration
  - **Removed Scraper Option**: Brave scraper (kept Firecrawl and Serper as documented)
  - **Why**: These providers were not documented in official LibreChat RC4 web search configuration and may not work reliably

### Changed
- **Schema**: Updated `searchProvider` enum to only include: "none", "serper", "searxng"
- **Schema**: Updated `scraperType` enum to only include: "none", "firecrawl", "serper"
- **UI**: Removed dropdown options for unsupported search providers
- **Backend**: Removed environment variable generation for unsupported providers
- **Backend**: Cleaned up librechat.yaml generation to exclude unsupported provider fields
- **Backend**: Simplified docker-compose.yml to only include officially supported providers

### Impact
- Ensures all generated configurations align with official LibreChat RC4 documentation
- Prevents users from configuring unsupported providers that may not work
- Generated packages are guaranteed to use only tested and documented search configurations
- Reduces configuration complexity and potential error points

### Migration Guide
If you were using an unsupported search provider:
1. **Review LibreChat Documentation**: Check https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/web_search
2. **Switch to Supported Provider**: 
   - For API-based search: Use Serper (https://serper.dev)
   - For privacy-focused search: Use SearXNG (deploy your own instance)
3. **Alternative Options**: Consider using LibreChat's native OpenRouter integration if you need provider-specific search features

## [1.15.0] - 2025-10-08

### BREAKING CHANGES
- **Removed Local SearXNG Docker Service Creation**: Simplified SearXNG configuration
  - **Removed**: `searxngIncludeService` toggle that automatically created SearXNG Docker container
  - **Removed**: Automatic `settings.yml` generation for SearXNG
  - **Removed**: SearXNG service definition from docker-compose.yml
  - **Removed**: searxng_config Docker volume
  - **Removed**: SEARXNG_SECRET environment variable
  - **Why**: Local SearXNG Docker setup was complex and unreliable. Users consistently experienced 403 errors, configuration issues, and service startup problems.

### Changed
- **SearXNG as External Service Only**: Treat SearXNG like any other search provider
  - Now requires: User-provided SearXNG instance URL (required) and optional API key
  - Works with: Any publicly accessible SearXNG instance (self-hosted elsewhere or public)
  - Benefits: Simpler configuration, more reliable, works out-of-the-box with external instances
  - No more Docker complexity or auto-generated configuration files

### Migration Guide
If you were using the local SearXNG Docker service feature:
1. Deploy SearXNG separately using its official Docker setup
2. Configure your SearXNG instance with JSON format enabled
3. Enter your SearXNG URL in the configuration tool (e.g., `https://search.example.com`)
4. Optionally add an API key if your instance requires authentication

### Impact
- Eliminates all SearXNG-related Docker and configuration complexity
- Users can now use reliable external SearXNG instances without local setup hassles
- Configuration tool becomes more maintainable with less service-specific logic
- Consistent with how other search providers (Brave, Tavily, Perplexity) are handled

## [1.14.1] - 2025-10-08

### Fixed
- **CRITICAL: Profile Generation Blockers**: Fixed critical bugs preventing generated packages from working
  - **JSON Profile `search` Field**: Now automatically set to `true` when webSearch is configured, `false` when disabled
    - Was: Always `false` regardless of webSearch configuration
    - Now: Correctly reflects whether web search is enabled
  - **JSON Profile `searxngInstanceUrl`**: Now automatically populated when SearXNG service is included
    - Was: Empty string even with `searxngIncludeService: true`
    - Now: Auto-set to `"http://searxng:8080"` when Docker service included
  - **librechat.yaml App-Level Config**: Added complete provider configuration under `app.webSearch`
    - Added: `searchProvider`, `searxngInstanceUrl`, `searxngApiKey` fields
    - Ensures client-side web search functionality works correctly
  - **docker-compose.yml URL Reference**: Fixed non-existent environment variable reference
    - Was: Referenced `${SEARXNG_INSTANCE_URL}` (removed in v1.14.0)
    - Now: Hardcoded to `http://searxng:8080` when service included, uses env var for external instances
  - **Profile Update Flow**: Added normalization to PUT endpoint
    - Prevents regression when users edit saved profiles
    - Maintains `search` and `searxngInstanceUrl` alignment with webSearch settings
  - **Bidirectional Normalization**: Both enable and disable flows now work correctly
    - Switching from SearXNG to 'none' properly sets `search: false`
    - Prevents stale `search: true` flags after disabling web search

### Impact
- Generated packages now work completely out-of-the-box with no manual editing required
- Eliminates all user-identified blockers preventing LibreChat web search from functioning
- Both creating and editing configuration profiles maintain correct web search settings
- Docker Compose files reference correct internal service URLs

## [1.14.0] - 2025-10-08

### Fixed
- **SearXNG Rate Limiting Syntax**: Corrected settings.yml to use proper SearXNG YAML format
  - Changed: `limiter: false` → `rate_limit: { enabled: false }`
  - Prevents SearXNG configuration errors on startup
- **Docker Healthcheck Improvements**: Enhanced SearXNG container health monitoring
  - Interval reduced from 30s to 10s for faster detection
  - Retries increased from 3 to 10 to handle slower startup times
  - Reduces first-boot race conditions between services
- **Service Dependencies**: LibreChat now waits for SearXNG to be healthy before starting
  - Changed depends_on to use extended format with conditions
  - SearXNG uses `condition: service_healthy` (waits for healthcheck to pass)
  - MongoDB and Redis use `condition: service_started` (basic dependency)
  - Prevents API calls to unhealthy SearXNG service
- **Removed SEARXNG_INSTANCE_URL from .env**: Eliminated configuration redundancy
  - Was previously generated in both .env and hardcoded in librechat.yaml
  - Now only hardcoded in YAML (single source of truth)
  - Prevents potential configuration drift between files
- **Conditional Scraper/Reranker Credentials**: Made API keys/URLs conditional in librechat.yaml
  - scraperType and rerankerType fields always preserved (supports post-generation key injection)
  - firecrawlApiKey/firecrawlApiUrl only emitted when firecrawlApiKey is provided
  - jinaApiKey/jinaApiUrl only emitted when jinaApiKey is provided
  - cohereApiKey only emitted when cohereApiKey is provided
  - Prevents plugin-auth errors when credentials are missing
  - Allows users to add API keys manually after package generation

### Impact
- Web search configuration is now production-ready with improved reliability
- Eliminates edge-case errors discovered through testing
- Better Docker container orchestration prevents startup race conditions
- Configuration files remain clean and maintainable with single source of truth

## [1.13.0] - 2025-10-08

### Added
- **SEARCH_PROVIDER Environment Variable**: Added to .env file generation when web search is enabled
  - Automatically set to the configured search provider (searxng, brave, tavily, etc.)
  - Required by LibreChat RC4 to identify which search service to use
  - Only generated when searchProvider is not 'none'
- **App-Level Search Configuration in librechat.yaml**: Added top-level `app:` section
  - `app.search: true` - Enables search functionality at application level
  - `app.webSearch.enabled: true` - Explicitly enables web search feature
  - Complements existing `webSearch:` provider configuration section
  - Conditionally generated only when web search is configured

### Impact
- Completes LibreChat RC4 web search configuration per ChatGPT recommendations
- Ensures all required environment variables and YAML settings are present
- Combined with v1.12.0 SearXNG fixes, provides complete out-of-the-box web search functionality

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