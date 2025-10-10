# LibreChat Configuration Tool

## 🎥 Video Demo

[![LibreChat Configuration Tool Demo](https://img.youtube.com/vi/7NOCdZaukuM/maxresdefault.jpg)](https://youtu.be/7NOCdZaukuM?si=lRFjX0mcHJpOT5Ey)

**[▶️ Watch the full demo video](https://youtu.be/7NOCdZaukuM?si=lRFjX0mcHJpOT5Ey)** - See the LibreChat Configuration Tool in action!

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)

## Why This Tool Exists

**LibreChat is powerful, but configuration shouldn't require a PhD in YAML.**

This tool provides a clean UI for managing 100+ LibreChat settings and generates complete deployment packages. No more manually editing environment files or debugging YAML syntax errors.

**Key Benefits:**
- ✅ **Progressive disclosure** - Pick providers first, see only relevant fields
- ✅ **Real-time validation** - Catch errors before deployment
- ✅ **Complete packages** - All deployment files generated in one click
- ✅ **Smart updates** - Update LibreChat without overwriting your database
- ✅ **Beginner-friendly** - No YAML or Docker expertise required

## Quick Start

### 🌐 Online (Limited Features)

**[Launch Configuration Tool](https://librechatconfigurator.netlify.app/)**

- ✅ Configure all LibreChat settings  
- ✅ Download individual files (.env, YAML, JSON)
- ❌ ZIP package generation unavailable (no backend)

### 💻 Local Installation (Full Features)

**Prerequisites:** Node.js 20+ and Docker Desktop

```bash
# Clone repository
git clone https://github.com/Fritsl/LibreChatConfigurator.git
cd LibreChatConfigurator

# Install and start
npm install
npm run dev

# Open http://localhost:5000
```

**Full features locally:**
- ✅ Complete ZIP package generation with Docker Compose setup
- ✅ Cross-platform installation scripts (.sh for Linux/macOS, .bat for Windows)
- ✅ Smart update system using configuration names as unique identifiers
- ✅ Profile management and configuration backup/restore

## Installing LibreChat with Generated Package

### 📦 Smart Installation System

The generated ZIP package includes intelligent installation scripts that handle both fresh installations and updates:

#### **Windows Installation**

1. **Download & Extract**: Download your ZIP package from the configurator and extract it to a folder
2. **Ensure Docker is Running**: Make sure Docker Desktop is running before proceeding
3. **Run Installation**: Open the extracted folder and double-click `install_dockerimage.bat`

#### **Linux/macOS Installation**

```bash
chmod +x install_dockerimage.sh
./install_dockerimage.sh
```

### 🔄 How Smart Updates Work

**Configuration Name = Unique Identifier**

The system uses the **Configuration Name** you set in the tool (not the ZIP filename) as a unique identifier. This name is embedded in `LibreChatConfigSettings.json` within your package.

**First Installation:**
- Creates complete LibreChat Docker setup
- Pulls all required images from Docker Hub
- Initializes MongoDB database
- Starts LibreChat on port 3080

**Subsequent Updates (Same Configuration Name):**
- ✅ **Preserves MongoDB** - Your data stays intact
- ✅ **Updates LibreChat only** - Applies new .env and YAML settings
- ✅ **Restarts containers** - Changes take effect immediately
- ✅ **Works across folders** - Even from a new ZIP download

**Different Configuration Name:**
- Treated as new installation
- Creates separate Docker instance

### 🎯 Typical Workflow

1. **Configure in Tool** → Set "Configuration Name" at the top (e.g., "Production-LibreChat")
2. **Download ZIP** → Generate package with all files
3. **First Run** → `install_dockerimage.bat` creates full Docker setup on port 3080
4. **Make Changes** → Adjust settings in configurator tool
5. **Update Live** → Download new ZIP, run `install_dockerimage.bat` again
   - Database preserved ✅
   - LibreChat updated with new settings ✅

### 📦 What's in the ZIP Package?

Each generated package contains these files:

#### Core Files (Always Included)

| File | Purpose | When to Use |
|------|---------|-------------|
| **`.env`** | Environment variables (API keys, secrets, server settings) | Automatically used by installation scripts. Can also manually place in LibreChat directory. |
| **`librechat.yaml`** | Main LibreChat configuration (UI settings, endpoints, features) | Automatically used by installation scripts. Can also manually place in LibreChat directory. |
| **`docker-compose.override.yml`** | Docker service configuration with environment passthrough | Automatically used by installation scripts for Docker deployments. |
| **`LibreChatConfigSettings.json`** | Configuration metadata with unique name identifier | Used by installation scripts to detect update vs. fresh install. Also for backup/restore in this tool. |
| **`install_dockerimage.bat`** | Windows installation script | **Run this on Windows** - handles Docker setup and updates automatically. |
| **`install_dockerimage.sh`** | Linux/macOS installation script | **Run this on Linux/macOS** - handles Docker setup and updates automatically. |
| **`00-README-INSTALLATION.txt`** | Installation instructions | Read this first - contains step-by-step setup guide. |
| **`README.md`** | Documentation about your configuration | Reference for what settings you configured. |

#### Database Backup Scripts (Optional)

| File | Purpose | When to Use |
|------|---------|-------------|
| **`backup_mongodb.bat`** | Windows MongoDB backup script | Run on Windows to create a database backup before major changes. |
| **`backup_mongodb.sh`** | Linux/macOS MongoDB backup script | Run on Linux/macOS to create a database backup before major changes. |
| **`restore_mongodb.bat`** | Windows MongoDB restore script | Run on Windows to restore a previous database backup. |
| **`restore_mongodb.sh`** | Linux/macOS MongoDB restore script | Run on Linux/macOS to restore a previous database backup. |

**Quick Start:** Run the installation script for your OS (`.bat` for Windows, `.sh` for Linux/macOS) - it handles everything automatically.

**Manual Installation:** If not using Docker, copy `.env` and `librechat.yaml` to your LibreChat directory.

### ⚠️ Development Status

**This tool is under active development and may contain bugs.** Always backup your configurations and test in a non-production environment first.

## Features

### Configuration Management
- **100+ Settings Coverage** - All LibreChat v0.8.0-rc4 configuration options
- **Tabbed Interface** - 18 organized categories (Server, Security, AI Providers, etc.)
- **Profile System** - Save and load configuration profiles with versioning
- **Auto-Save** - Browser localStorage prevents data loss on refresh/close

### Package Generation
- **Complete Deployment Files**:
  - `.env` - Environment variables
  - `librechat.yaml` - Main configuration
  - `docker-compose.override.yml` - Docker setup
  - `LibreChatConfigSettings.json` - Configuration metadata
  - Installation scripts (.bat for Windows, .sh for Linux/macOS)

### Advanced Features
- **Versioned Exports** - Metadata tracking (tool version, schema version, LibreChat target)
- **Import Compatibility Checking** - Warns about version mismatches
- **Custom Endpoints** - Multiple OpenAI-compatible endpoints with individual API keys
- **DALL-E Integration** - Complete image generation setup
- **Web Search (RC4)** - Serper and SearXNG with auto-Docker integration
- **Smart Defaults** - Optimal configurations applied automatically

### User Experience
- **Search Functionality** - Find any setting instantly
- **Real-time Validation** - Immediate feedback on errors
- **Technical Metadata** - Hover over info icons to see env var names and file paths
- **Responsive Design** - Works on desktop, tablet, and mobile

## Supported Configuration

This tool supports all LibreChat v0.8.0-rc4 settings organized into categories:

**Core (.env)**
- Server (APP_TITLE, HOST, PORT, domains)
- Security (JWT secrets, session settings)
- Database (MongoDB, Redis, PostgreSQL)
- UI/Visibility (welcome message, footer, menu toggles)

**AI Providers (.env + YAML)**
- OpenAI, Anthropic, Google, Azure OpenAI
- AWS Bedrock, Groq, Mistral, Cohere
- Custom OpenAI-compatible endpoints
- 15+ additional providers

**Authentication (.env)**
- Email/Password login
- OAuth (Google, GitHub, Discord, Facebook, Apple, OpenID Connect)
- Domain restrictions and registration controls

**Advanced Features (YAML)**
- Web Search & RAG (Serper, SearXNG, Firecrawl)
- File Storage (Local, S3, Azure Blob, Firebase)
- Email Services (SMTP, Mailgun)
- Rate Limiting & Caching
- MCP Servers (Model Context Protocol)
- Image Generation (DALL-E 2/3)

**📚 Full Documentation:** [LibreChat Configuration Guide](https://www.librechat.ai/docs/configuration/)

## Architecture

Modern full-stack TypeScript application:

```
├── client/          # React 18 Frontend
│   ├── components/  # Tabbed UI, Forms, Inputs
│   ├── lib/        # Configuration defaults & utilities
│   └── pages/      # Main configuration interface
├── server/          # Express.js Backend
│   ├── routes.ts   # API endpoints & file generation
│   └── storage.ts  # In-memory storage with DB interface
├── shared/          # Type-safe schemas (Zod)
│   ├── schema.ts           # Configuration data models
│   ├── schema-defaults.ts  # Dynamic defaults generator
│   └── version.ts          # Version metadata
└── scripts/         # Build & deployment automation
```

**Tech Stack:**
- Frontend: React, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Express.js, Zod validation
- State: TanStack Query, React Hook Form
- Build: Vite, ESBuild

## Development

### Commands

```bash
npm run dev          # Development server (port 5000)
npm run build        # Production build
npm start            # Production server
npm run lint         # ESLint
npm run type-check   # TypeScript validation
```

### Adding New Settings

1. Update schema in `shared/schema.ts`
2. Add UI component in `client/src/components/`
3. Update file generators in `server/routes.ts`
4. Test end-to-end

## Contributing

We welcome contributions! Here's how to help:

1. **Fork** the repository
2. **Create branch**: `git checkout -b feature/your-feature`
3. **Make changes** and test thoroughly
4. **Submit PR** with clear description

**Areas needing help:**
- 🤖 New AI provider integrations
- 🎨 UI/UX improvements
- 📚 Documentation enhancements
- 🧪 Test coverage
- 🌍 Internationalization

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## Known Issues (v1.18.0)

- **modelSpecs.addedEndpoints bug**: LibreChat RC4 has a known issue where this setting causes interface visibility problems. Keep it disabled (empty array) unless you need custom model specs.
- **Active development**: Tool is evolving with LibreChat. Report bugs via [GitHub Issues](https://github.com/Fritsl/LibreChatConfigurator/issues).

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- **LibreChat Team** - For the amazing open-source AI platform
- **Contributors** - Everyone improving this tool
- **Community** - Users providing feedback and bug reports

---

**Made with ❤️ by the LibreChat community**
