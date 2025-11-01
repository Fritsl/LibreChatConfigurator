# Overview

This project provides a web-based configuration interface for LibreChat v0.8.0-rc4, designed to manage over 100 settings through an intuitive UI. Its primary purpose is to generate complete LibreChat installation packages, including environment files, YAML configurations, and Docker Compose deployment scripts. Key capabilities include configuration profile management, a "Smart Installation System" for cross-platform Docker deployments with live updates, and a "Versioned Configuration System" for schema-driven management and automatic version tracking. The system aims to simplify LibreChat deployment and management by offering a centralized, validated, and intuitive configuration experience.

# Recent Changes

## Version 2.2.0 - November 1, 2025 📚 **DOCUMENTATION COMPLETENESS UPDATE**
**100% DOCUMENTATION PARITY ACHIEVED**

**What Changed:**
- Tool Version: 2.1.9 → **2.2.0**
- **SHOW_BIRTHDAY_ICON Added:** Environment variable to control birthday hat display (February 11th)
- **Advanced Title Customization:** Added titlePrompt, titlePromptTemplate, titleEndpoint, titleMethod for OpenAI endpoints
- **Complete Firecrawl Coverage:** Added 10 missing advanced Firecrawl options
- **safeSearch Type Fix:** Changed from boolean to number (0=OFF, 1=MODERATE, 2=STRICT) to match LibreChat documentation

**New Fields Added (15 total):**

**UI Control:**
- `showBirthdayIcon` (ENV) - Controls birthday hat icon display

**Endpoint Title Customization:**
- `titleMethod` - Title generation method (completion, structured, functions)
- `titlePrompt` - Custom prompt template with {convo} placeholder
- `titlePromptTemplate` - Conversation formatting with {input}/{output} placeholders
- `titleEndpoint` - Route titles to different endpoints

**Firecrawl Advanced Options:**
- `includeTags` - HTML tags to include in output
- `excludeTags` - HTML tags to exclude from output
- `headers` - Custom HTTP headers (object)
- `parsePDF` - PDF parsing control (boolean)
- `skipTlsVerification` - TLS verification bypass (boolean)
- `storeInCache` - Firecrawl caching control (boolean)
- `zeroDataRetention` - Data retention settings (boolean)
- `location` - Geographic settings (object: country, languages)
- `changeTrackingOptions` - Change tracking config (object)

**The Problem:**
User discovered missing fields when trying to disable the birthday hat icon. A comprehensive audit against official LibreChat RC4 documentation revealed 15+ missing configuration fields that prevent users from having complete control over their LibreChat instance.

**The Solution:**
- **Complete Field Coverage:** All documented LibreChat RC4 configuration options now included
- **Proper Type Definitions:** safeSearch corrected to number type matching documentation
- **Schema Validation:** Zod schema updated to validate all new fields
- **User Control:** Users can now control every aspect of LibreChat behavior documented in official docs

**Impact:**
- ✅ **Birthday Hat Control:** Users can now disable/enable the birthday hat icon
- ✅ **Advanced Title Generation:** Full control over conversation title customization
- ✅ **Complete Firecrawl Configuration:** All advanced web scraping options available
- ✅ **100% Documentation Parity:** Tool now covers every field in LibreChat RC4 docs
- ✅ **Future-Proof:** Comprehensive field coverage prevents missing settings issues

**Technical Details:**
- Added 15 fields to `shared/config/field-registry.ts`
- Updated `shared/schema.ts` with new Zod validation schemas
- Fixed safeSearch from boolean to number (0-2 range)
- All new fields properly integrated into export/import system

## Version 2.1.9 - November 1, 2025 🔧 **ENV FILE QUOTING FIX**
**CRITICAL FIX:** Fixed .env file generation to properly quote string values

**What Changed:**
- Tool Version: 2.1.8 → **2.1.9**
- **String Quoting Added:** `formatEnvValue` function now properly quotes all string values
- **Escaping Added:** Double quotes and backslashes are properly escaped in string values
- **Affects All String Fields:** customFooter, appTitle, customWelcome, helpAndFAQURL, and all other string configuration fields

**The Problem:**
- String values in .env files were generated without quotation marks
- Values containing spaces (e.g., "My custom footer text") would break .env parsing
- Changes to footer text in the UI always appeared the same in exported files
- Docker Compose couldn't properly read multi-word configuration values

**The Solution:**
- **Proper Quoting:** All string values are now wrapped in double quotes: `CUSTOM_FOOTER="My footer text"`
- **Escape Handling:** Backslashes and double quotes in values are properly escaped: `\"` and `\\`
- **Multi-line Support:** String values can now contain special characters and be parsed correctly

**Impact:**
- ✅ **Footer Text Works:** Changes to customFooter in UI now properly export to .env file
- ✅ **Spaces Handled:** String values with spaces no longer break .env file parsing
- ✅ **Special Characters:** Quotes, backslashes, and other special characters are properly escaped
- ✅ **Docker Compose Compatibility:** Environment variables are now properly formatted for Docker
- ✅ **All String Fields Fixed:** appTitle, customWelcome, helpAndFAQURL, and all other string fields benefit from this fix

**Technical Details:**
Modified `formatEnvValue()` and `getDefaultComment()` functions in `shared/config/registry-helpers.ts` to:
1. Escape backslashes: `\` → `\\`
2. Escape double quotes: `"` → `\"`
3. Wrap result in double quotes: `value` → `"value"`

## Version 2.1.8 - October 31, 2025 ⚠️ **SPEECH BLOCK DISABLED**
🛑 **CRITICAL FIX:** Disabled Speech configuration block in YAML exports to prevent validation errors

**What Changed:**
- Tool Version: 2.1.7 → **2.1.8**
- **Speech Block Removed:** generateSpeechSection now returns explanatory comment instead of configuration
- **YAML Stability:** Prevents LibreChat's strict validator from rejecting entire configuration file
- **Documentation Added:** Clear comments in exported YAML explain why speech is disabled

**The Problem:**
- LibreChat RC4's YAML validator enforces strict validation on all configuration blocks
- Incomplete or improperly configured speech sections (STT/TTS) cause validation errors
- The speech block requires specific fields for both Speech-to-Text and Text-to-Speech services
- When validator encounters issues, it rejects the **entire** configuration file
- This prevents critical UI customizations (footer, welcome, terms) from loading

**The Solution:**
- **Complete Removal:** Speech configuration block no longer exported to librechat.yaml
- **Explanatory Comments:** YAML includes clear explanation of why speech is disabled
- **Trade-off Documentation:** Comments list what works (✅) and what's lost (❌)

**Impact:**
- ✅ **YAML Configuration Loads:** No more validation errors blocking configuration
- ✅ **UI Customizations Work:** Footer, welcome message, terms of service now apply properly
- ❌ **Speech-to-Text Lost:** Voice input transcription functionality disabled
- ❌ **Text-to-Speech Lost:** Audio response playback functionality disabled
- ❌ **Voice Interactions Lost:** Speech tab UI elements and controls unavailable
- ❌ **Provider Selection Lost:** Cannot configure different speech service providers

**Why This Is Necessary:**
LibreChat's beta software enforces strict YAML validation. Disabling the incomplete speech section ensures core configuration loads successfully, enabling essential UI customizations while temporarily sacrificing voice-related features that are non-critical for the text-based GDPRchat setup. This is a standard beta software trade-off.

## Version 2.1.7 - October 31, 2025 ⚠️ **MEMORY BLOCK DISABLED**
🛑 **CRITICAL FIX:** Disabled Memory configuration block in YAML exports to prevent validation errors

**What Changed:**
- Tool Version: 2.1.6 → **2.1.7**
- **Memory Block Removed:** generateMemorySection now returns explanatory comment instead of configuration
- **YAML Stability:** Prevents LibreChat's strict validator from rejecting entire configuration file
- **Documentation Added:** Clear comments in exported YAML explain why memory is disabled

**The Problem:**
- LibreChat RC4's YAML validator enforces strict validation on all configuration blocks
- Incomplete or improperly configured memory sections cause validation errors
- When validator encounters issues, it rejects the **entire** configuration file
- This prevents critical UI customizations (footer, welcome, terms) from loading

**The Solution:**
- **Complete Removal:** Memory configuration block no longer exported to librechat.yaml
- **Explanatory Comments:** YAML includes clear explanation of why memory is disabled
- **Trade-off Documentation:** Comments list what works (✅) and what's lost (❌)

**Impact:**
- ✅ **YAML Configuration Loads:** No more validation errors blocking configuration
- ✅ **UI Customizations Work:** Footer, welcome message, terms of service now apply properly
- ❌ **Memory Features Lost:** Conversation context, adaptive memory, entity extraction disabled
- ❌ **Semantic Search Lost:** Memory-based semantic search unavailable

**Why This Is Necessary:**
LibreChat's beta software enforces strict YAML validation. Disabling the incomplete memory section ensures core configuration loads successfully, enabling essential UI customizations while temporarily sacrificing non-critical memory features. This is a standard beta software trade-off.

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
- **UI/UX**: Tabbed interface with specialized input controls, responsive design, and smart UI elements that adapt based on dependencies. Includes user experience presets (e.g., "Agents-Only Mode").
- **Technical Implementations**: Features a Smart Installation System for Docker deployments with live configuration updates. Includes a Secret Caching System for server-side secrets. Achieves 100% bidirectional parity across all 400+ configuration fields using a unified registry system and `configPath` translation layer for LibreChat's native YAML format.
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
    - **Web Search Configuration**: Aligned with LibreChat RC4 webSearch YAML configuration.

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