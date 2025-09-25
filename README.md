# LibreChat Configuration Tool

A web-based interface to configure LibreChat v0.8.0 easily with progressive disclosure and 100% parameter coverage.

## Requirements

- **Node.js 20+** (tested with Node 20.16+)

## Quick Start

1. **Clone this repository**
   ```bash
   git clone https://github.com/Frits1/LibreChatConfigurator.git
   cd LibreChatConfigurator
   ```

2. **Install and run**
   ```bash
   npm install && npm run dev
   ```

3. **Open in browser**
   ```
   http://localhost:5000
   ```

4. **Configure your settings**
   - Use the clean tabbed interface with progressive disclosure
   - Configure only the providers you need (OAuth, Email, File Storage, etc.)
   - Set your AI API keys, database settings, and features

5. **Download your config files**
   - Get your `.env` file with environment variables
   - Get your `librechat.yaml` configuration file  
   - Get complete deployment package with Docker setup

## Production Build

For production deployment:

```bash
npm run build
npm start
```

The app will build and serve on port 5000 in production mode.

## Features

- **Progressive Disclosure**: Choose providers first, then see only relevant configuration fields
- **Comprehensive Coverage**: I have tried to catch all LibreChat v0.8.0 settings - see mapping below
- **Clean Interface**: Organized into logical tabs with search functionality
- **Real-time Validation**: Immediate feedback on configuration issues
- **Profile Management**: Save and load different configuration profiles
- **Complete Package Generation**: Ready-to-deploy files including Docker setup

## Supported Configuration Settings

This tool aims to support all LibreChat v0.8.0 configuration options. Here's what's currently covered:

**Based on [LibreChat Documentation](https://docs.librechat.ai/)**

### Core Settings (.env)
| Setting | Type | Documentation |
|---------|------|--------------|
| `APP_TITLE` | String | [Configuration](https://docs.librechat.ai/install/configuration/basic_config) |
| `CUSTOM_FOOTER` | String | [Configuration](https://docs.librechat.ai/install/configuration/basic_config) |
| `DOMAIN_CLIENT`, `DOMAIN_SERVER` | String | [Configuration](https://docs.librechat.ai/install/configuration/basic_config) |
| `HOST`, `PORT` | Server | [Configuration](https://docs.librechat.ai/install/configuration/basic_config) |
| `MONGO_URI`, `REDIS_URI` | Database | [Database Setup](https://docs.librechat.ai/install/configuration/mongodb) |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Security | [Security](https://docs.librechat.ai/install/configuration/security) |
| `ALLOW_REGISTRATION`, `ALLOW_EMAIL_LOGIN` | Auth | [Authentication](https://docs.librechat.ai/install/configuration/authentication) |

### AI Provider API Keys (.env)
| Provider | Environment Variables | Documentation |
|----------|----------------------|--------------|
| OpenAI | `OPENAI_API_KEY` | [Providers](https://docs.librechat.ai/install/configuration/ai_setup) |
| Anthropic | `ANTHROPIC_API_KEY` | [Providers](https://docs.librechat.ai/install/configuration/ai_setup) |
| Google | `GOOGLE_API_KEY` | [Providers](https://docs.librechat.ai/install/configuration/ai_setup) |
| Azure OpenAI | `AZURE_OPENAI_*` | [Azure Setup](https://docs.librechat.ai/install/configuration/azure_openai) |
| AWS Bedrock | `AWS_*` | [Bedrock Setup](https://docs.librechat.ai/install/configuration/aws_bedrock) |
| 15+ Others | Various API keys | [AI Providers](https://docs.librechat.ai/install/configuration/ai_setup) |

### OAuth Providers (.env)
| Provider | Fields | Documentation |
|----------|--------|--------------|
| Google OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | [OAuth Setup](https://docs.librechat.ai/install/configuration/oauth) |
| GitHub OAuth | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | [OAuth Setup](https://docs.librechat.ai/install/configuration/oauth) |
| Discord, Facebook, Apple | Client credentials | [OAuth Setup](https://docs.librechat.ai/install/configuration/oauth) |
| OpenID Connect | Custom OIDC configuration | [OAuth Setup](https://docs.librechat.ai/install/configuration/oauth) |

### File Storage (.env)
| Strategy | Configuration | Documentation |
|----------|--------------|--------------|
| Local | `FILE_UPLOAD_PATH` | [File Handling](https://docs.librechat.ai/install/configuration/file_handling) |
| Firebase | `FIREBASE_*` credentials | [File Handling](https://docs.librechat.ai/install/configuration/file_handling) |
| Azure Blob | `AZURE_STORAGE_*` | [File Handling](https://docs.librechat.ai/install/configuration/file_handling) |
| Amazon S3 | `S3_*` credentials | [File Handling](https://docs.librechat.ai/install/configuration/file_handling) |

### Email Configuration (.env)
| Service | Fields | Documentation |
|---------|--------|--------------|
| SMTP | `EMAIL_SERVICE`, `EMAIL_USERNAME`, `EMAIL_PASSWORD` | [Email Setup](https://docs.librechat.ai/install/configuration/email) |
| Mailgun | `MAILGUN_API_KEY`, `MAILGUN_DOMAIN` | [Email Setup](https://docs.librechat.ai/install/configuration/email) |

### Search & RAG (librechat.yaml)
| Feature | Configuration | Documentation |
|---------|--------------|--------------|
| Web Search | `webSearch` providers (Serper, Brave, Tavily, etc.) | [Search](https://docs.librechat.ai/install/configuration/search) |
| MeiliSearch | `search`, `meilisearch*` settings | [Search](https://docs.librechat.ai/install/configuration/search) |
| RAG API | `ragApiURL`, RAG configuration | [RAG](https://docs.librechat.ai/install/configuration/rag_api) |

### Advanced Features (librechat.yaml)
| Category | Settings | Documentation |
|----------|----------|--------------|
| Interface | `interface.*` UI toggles and customization | [Configuration](https://docs.librechat.ai/install/configuration/basic_config) |
| Rate Limiting | `rateLimits.*` comprehensive limits | [Configuration](https://docs.librechat.ai/install/configuration/basic_config) |
| File Config | `fileConfig.*` upload limits and processing | [File Handling](https://docs.librechat.ai/install/configuration/file_handling) |
| Registration | `registration.*` domain restrictions | [Authentication](https://docs.librechat.ai/install/configuration/authentication) |
| Caching | Cache headers and static file settings | [Configuration](https://docs.librechat.ai/install/configuration/basic_config) |
| MCP Servers | `mcpServers.*` Model Context Protocol | [MCP](https://docs.librechat.ai/features/mcp) |

**Missing something?** Please open a PR! This tool is community-driven and welcomes contributions as LibreChat evolves.

**📚 Documentation Reference:**
- [LibreChat Configuration Guide](https://docs.librechat.ai/install/configuration)
- [Quick Start](https://docs.librechat.ai/install/quickstart)
- [Authentication Setup](https://docs.librechat.ai/install/configuration/authentication)
- [RAG API](https://docs.librechat.ai/install/configuration/rag_api)

## For Developers

- **Frontend**: `/client` - React with TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: `/server` - Express.js with TypeScript
- **Shared**: `/shared` - Common types and schemas

Feel free to modify and improve! The codebase uses modern patterns and is designed to be easily extensible.

## License

MIT License - Feel free to use, modify, and share!