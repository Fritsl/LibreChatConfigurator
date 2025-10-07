# Changelog

All notable changes to LibreChat Configuration Tool will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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