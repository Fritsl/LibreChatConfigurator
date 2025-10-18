# Open WebUI Configuration Tool - Complete Project Specification

## Project Overview

Build a comprehensive web-based configuration manager for Open WebUI that provides an intuitive interface for managing 50+ environment variables, generates complete deployment packages, and enables full configuration backup/restore with versioning.

---

## Core Value Proposition

**Problem**: Open WebUI configuration requires manually editing docker-compose.yml files and managing dozens of environment variables, making it error-prone and difficult to replicate deployments.

**Solution**: A visual configuration tool that lets users:
- Configure all Open WebUI settings through a clean web interface
- Generate complete, ready-to-deploy Docker packages
- Save and restore configuration profiles with full version tracking
- Deploy with 1-click installation scripts (Windows .bat, Linux .sh)
- Update existing deployments without losing data

---

## Technical Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query for server state
- **Storage**: In-memory (Map-based) with browser localStorage for auto-persistence
- **Form Handling**: React Hook Form + Zod validation
- **Routing**: Wouter

---

## Key Features Required

### 1. Tabbed Configuration Interface

Organize settings into 6-8 logical categories:
1. **General** - WEBUI_NAME, PORT, DATA_DIR
2. **LLM Connections** - Ollama, OpenAI settings
3. **Database** - PostgreSQL, Qdrant vector DB
4. **Authentication** - OAuth/SSO configuration
5. **Image Generation** - AUTOMATIC1111, ComfyUI
6. **Performance** - Threading, caching, streaming
7. **Advanced** - Developer settings

Each tab contains form inputs for related environment variables.

### 2. Intelligent Input Components

For each environment variable, provide:
- **Label**: Human-readable name
- **Help Text**: Clear description of what it does
- **Input Type**: text, number, boolean, select, URL
- **Validation**: Real-time validation with error messages
- **Documentation Link**: Link to official Open WebUI docs
- **Required Indicator**: Visual marker for required fields

### 3. Profile Management System

**Features**:
- **Save Profile**: Name and save current configuration
- **Load Profile**: Restore from saved profiles
- **Auto-save**: Save to localStorage every 30 seconds
- **Profile List**: Display all saved profiles with timestamps
- **Quick Switch**: Dropdown to switch between profiles
- **Delete Profile**: Remove unwanted profiles

### 4. Versioned Export/Import

**Export Format** (JSON):
```json
{
  "toolVersion": "1.0.0",
  "openWebuiVersion": "main",
  "schemaVersion": "1.0",
  "exportDate": "2025-10-18T16:00:00.000Z",
  "configurationName": "Production-Setup",
  "configuration": {
    "WEBUI_NAME": "My Open WebUI",
    "PORT": "8080",
    "OLLAMA_BASE_URL": "http://ollama:11434"
  }
}
```

**Import Features**:
- Load previously exported configurations
- Version compatibility warnings
- Preview changes before applying
- Validate against expected schema

### 5. Smart Deployment Package Generation

**Generate ZIP containing**:

1. **docker-compose.yml**:
```yaml
services:
  open-webui:
    image: ghcr.io/open-webui/open-webui:main
    container_name: openwebui-{CONFIG_NAME}
    ports:
      - "{PORT}:8080"
    environment:
      - WEBUI_NAME={VALUE}
      - OLLAMA_BASE_URL={VALUE}
    volumes:
      - openwebui-data-{CONFIG_NAME}:/app/backend/data
    restart: unless-stopped

volumes:
  openwebui-data-{CONFIG_NAME}:
```

2. **install-windows.bat**:
```batch
@echo off
echo Installing Open WebUI: {CONFIG_NAME}

docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker not installed
    pause
    exit /b 1
)

docker pull ghcr.io/open-webui/open-webui:main
docker compose -p openwebui-{CONFIG_NAME} up -d

echo Installation complete!
echo Access at http://localhost:{PORT}
pause
```

3. **install-linux.sh**:
```bash
#!/bin/bash
echo "Installing Open WebUI: {CONFIG_NAME}"

if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker not installed"
    exit 1
fi

docker pull ghcr.io/open-webui/open-webui:main
docker compose -p openwebui-{CONFIG_NAME} up -d

echo "Installation complete!"
echo "Access at http://localhost:{PORT}"
```

4. **update-windows.bat** - Preserves data, updates container
5. **update-linux.sh** - Preserves data, updates container
6. **README.txt** - Installation instructions
7. **config-backup.json** - Full configuration export

### 6. Configuration Name as Unique Identifier

- User assigns a name (e.g., "Production", "Testing")
- Name used for:
  - Container name: `openwebui-Production`
  - Volume name: `openwebui-data-Production`
  - Docker Compose project: `openwebui-production`
- **Benefit**: Multiple deployments can coexist without conflicts
- **Update Safety**: Regenerate package with same name → update script preserves data

### 7. Search & Highlighting System

**Global Search**:
- Search box at top of interface
- Matches against:
  - Environment variable names
  - Labels
  - Help text
- **Tab Filtering**: Only show tabs with matching settings
- **Visual Highlighting**: Yellow pulsing border around matching fields
- **Auto-scroll**: Scroll to first match when opening tab
- **Clear on Search Clear**: Remove highlights when search cleared

### 8. Live Preview System

**Preview Tabs**:
- **docker-compose.yml**: Syntax-highlighted YAML
- **Environment Variables**: Formatted list
- **Install Commands**: Generated script preview

**Features**:
- Real-time updates as user changes settings
- Copy to clipboard for each preview
- Download individual files

---

## Environment Variables to Support

### General
- WEBUI_NAME (default: "Open WebUI")
- PORT (default: 8080)
- ENV (dev/prod)
- DATA_DIR (default: /app/backend/data)

### LLM Connections
- OLLAMA_BASE_URL
- OLLAMA_BASE_URLS (semicolon-separated)
- OPENAI_API_KEY
- OPENAI_API_BASE_URL

### Database
- DATABASE_URL (PostgreSQL connection string)
- ENABLE_POSTGRES_VECTOR_EXTENSION (boolean)
- QDRANT_URI
- QDRANT_API_KEY
- QDRANT_USE_GRPC (boolean)
- QDRANT_GRPC_PORT (default: 6334)
- QDRANT_REQUEST_TIMEOUT (default: 60)

### Authentication
- ENABLE_OAUTH_SIGNUP (boolean)
- OAUTH_MERGE_ACCOUNTS_BY_EMAIL (boolean)
- OAUTH_CLIENT_ID
- OAUTH_CLIENT_SECRET
- OPENID_PROVIDER_URL
- OAUTH_PROVIDER_NAME
- OAUTH_SCOPES (default: "openid email profile")

### Image Generation
- ENABLE_IMAGE_GENERATION (boolean)
- AUTOMATIC1111_BASE_URL
- COMFYUI_BASE_URL

### Performance
- THREAD_POOL_SIZE (default: 0 = 40 threads)
- MODEL_LIST_CACHE_TTL (seconds)
- ENABLE_PERSISTENT_STREAMING (boolean, default: true)

### Advanced
- ENABLE_PERSISTENT_CONFIG (boolean, default: true)
- UPLOAD_MAX_SIZE (default: "1MB")

---

## Data Security & Validation

**Security**:
- All processing client-side only
- API keys never sent to external servers
- Proper YAML escaping (quotes, newlines, special chars)
- Proper shell escaping in .bat and .sh files
- No logging of sensitive data

**Validation**:
- Required fields enforced
- URL format validation
- Port number range (1-65535)
- Dependency validation (e.g., OAuth needs all OAuth fields)
- Real-time error messages

---

## User Experience Flow

### First-Time User
1. Opens app
2. Fills in basic settings (name, port, Ollama URL)
3. Clicks "Generate Package"
4. Names configuration "Production"
5. Downloads ZIP
6. Runs install-windows.bat
7. Open WebUI running in <2 minutes

### Updating Deployment
1. Changes setting (adds OpenAI API key)
2. Generates package with SAME configuration name
3. Runs update-windows.bat
4. Deployment updates, data preserved

### Managing Multiple Profiles
1. Configures "Production" setup
2. Saves profile
3. Changes settings for "Development"
4. Saves as new profile
5. Quick-switch between profiles
6. Generate separate packages for each

---

## Success Criteria

1. Non-technical users can deploy Open WebUI in <5 minutes
2. Generated packages work on first run (no manual editing)
3. All official Open WebUI env vars are configurable
4. Export/import maintains 100% fidelity
5. Update scripts never destroy data
6. Cross-platform support (Windows + Linux + macOS)

---

## Technical Implementation Details

### Storage Architecture
- In-memory storage for backend (MemStorage interface)
- Browser localStorage for auto-persistence
- No external database required

### File Generation Pipeline
- Server-side ZIP generation
- Proper escaping for all output formats
- Include config-backup.json in every package

### Validation Strategy
- Zod schemas for all configurations
- Client-side + server-side validation
- Clear error messages with actionable guidance

### Component Structure
```
src/
├── components/
│   ├── configuration-tabs.tsx      # Main tabbed interface
│   ├── setting-input.tsx            # Reusable input component
│   ├── profile-manager.tsx          # Save/load profiles UI
│   ├── package-generator.tsx        # Generate & download packages
│   ├── preview-panel.tsx            # Live configuration preview
│   └── search-bar.tsx               # Global search
├── pages/
│   └── home.tsx                     # Main application page
├── lib/
│   ├── field-definitions.ts         # All env var metadata
│   └── generators/
│       ├── docker-compose.ts        # Generate docker-compose.yml
│       ├── install-scripts.ts       # Generate .bat/.sh files
│       └── package.ts               # Create ZIP package
└── shared/
    └── schema.ts                    # Zod schemas & TypeScript types
```

### Field Definition System

Each environment variable has metadata:

```typescript
interface FieldDefinition {
  key: string;                    // ENV_VAR_NAME
  label: string;                  // "Human-Readable Label"
  description: string;            // Help text
  type: 'text' | 'number' | 'boolean' | 'select' | 'url';
  required: boolean;
  defaultValue?: any;
  options?: string[];             // For select inputs
  docUrl?: string;                // Link to official docs
  placeholder?: string;
  validation?: ZodSchema;         // Zod validation schema
  dependsOn?: string;             // Field only shown if another field is set
}
```

---

## Official Resources

- **Documentation**: https://docs.openwebui.com/
- **Environment Variables**: https://docs.openwebui.com/getting-started/env-configuration/
- **GitHub**: https://github.com/open-webui/open-webui
- **Docker Image**: ghcr.io/open-webui/open-webui:main

---

## Development Guidelines

### Code Quality
- TypeScript strict mode
- Zod for all runtime validation
- Comprehensive error handling
- Inline documentation for complex logic

### UI/UX Standards
- Mobile-first responsive design
- Accessibility (ARIA labels, keyboard navigation)
- Loading states for async operations
- Clear error messages
- Confirmation dialogs for destructive actions

### Performance
- Lazy load tab content
- Debounce auto-save (30 second intervals)
- Optimize ZIP generation (stream large files)

### Security
- Never log sensitive data (API keys, secrets)
- Client-side only processing (no data sent to servers)
- Sanitize all user inputs before file generation
- Validate imported JSON against schema

---

## Project Timeline Estimate

- **Phase 1 - Core UI** (Day 1-2): Tabbed interface, field definitions, basic inputs
- **Phase 2 - Package Generation** (Day 3): docker-compose.yml generation
- **Phase 3 - Installation Scripts** (Day 4): .bat and .sh file generation
- **Phase 4 - Profiles & Export** (Day 5): Save/load profiles, versioned exports
- **Phase 5 - Search & Polish** (Day 6): Search functionality, visual refinements
- **Phase 6 - Testing & Documentation** (Day 7): Cross-platform testing, docs

**Total Estimated Time**: 7 days for full-featured V1

---

## API Endpoints

### Profile Management
- `GET /api/profiles` - List saved profiles
- `POST /api/profiles` - Save new profile
- `GET /api/profiles/:id` - Get specific profile
- `DELETE /api/profiles/:id` - Delete profile

### Configuration Management
- `POST /api/generate-package` - Generate deployment ZIP
- `POST /api/import-config` - Import JSON configuration
- `POST /api/export-config` - Export JSON configuration

---

## Data Schema

### Configuration Object
```typescript
interface OpenWebUIConfiguration {
  // General
  WEBUI_NAME?: string;
  PORT?: string;
  ENV?: 'dev' | 'prod';
  DATA_DIR?: string;
  
  // LLM Connections
  OLLAMA_BASE_URL?: string;
  OLLAMA_BASE_URLS?: string;
  OPENAI_API_KEY?: string;
  OPENAI_API_BASE_URL?: string;
  
  // Database
  DATABASE_URL?: string;
  ENABLE_POSTGRES_VECTOR_EXTENSION?: boolean;
  QDRANT_URI?: string;
  QDRANT_API_KEY?: string;
  QDRANT_USE_GRPC?: boolean;
  QDRANT_GRPC_PORT?: string;
  
  // Authentication
  ENABLE_OAUTH_SIGNUP?: boolean;
  OAUTH_MERGE_ACCOUNTS_BY_EMAIL?: boolean;
  OAUTH_CLIENT_ID?: string;
  OAUTH_CLIENT_SECRET?: string;
  OPENID_PROVIDER_URL?: string;
  OAUTH_PROVIDER_NAME?: string;
  OAUTH_SCOPES?: string;
  
  // Image Generation
  ENABLE_IMAGE_GENERATION?: boolean;
  AUTOMATIC1111_BASE_URL?: string;
  COMFYUI_BASE_URL?: string;
  
  // Performance
  THREAD_POOL_SIZE?: string;
  MODEL_LIST_CACHE_TTL?: string;
  ENABLE_PERSISTENT_STREAMING?: boolean;
  
  // Advanced
  ENABLE_PERSISTENT_CONFIG?: boolean;
  UPLOAD_MAX_SIZE?: string;
}

interface ConfigurationProfile {
  name: string;
  configuration: OpenWebUIConfiguration;
  createdAt: string;
  updatedAt: string;
}

interface VersionedExport {
  toolVersion: string;
  openWebuiVersion: string;
  schemaVersion: string;
  exportDate: string;
  configurationName: string;
  configuration: OpenWebUIConfiguration;
}
```

---

## Future Enhancements (Out of Scope for V1)

- Multi-deployment dashboard (manage multiple Open WebUI instances)
- Kubernetes deployment manifests
- Helm chart generation
- Configuration templates/presets (e.g., "Ollama Only", "OpenAI Only")
- Automatic Docker deployment (not just script generation)
- Real-time deployment status monitoring

---

*This specification is complete and ready for implementation by an AI coding agent or development team.*
