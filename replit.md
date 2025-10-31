# Overview

This project provides a web-based configuration interface for LibreChat v0.8.0-rc4, enabling users to manage over 100 settings through an intuitive UI. Its primary purpose is to generate complete LibreChat installation packages, including environment files, YAML configurations, and Docker Compose deployment scripts with accurate environment variable passthrough. Key capabilities include configuration profile management, a "Smart Installation System" for cross-platform Docker deployments with live updates, and a "Versioned Configuration System" for schema-driven management and automatic version tracking. The system aims to simplify LibreChat deployment and management by offering a centralized, validated, and intuitive configuration experience.

# Recent Changes

## Version 2.1.6 - October 31, 2025 🔧 **LIBRECHAT BUG HANDLING SYSTEM**
🛠️ **NEW FEATURE:** Intelligent workaround system for known LibreChat bugs

**What Changed:**
- Tool Version: 2.1.5 → **2.1.6**
- **Bug Metadata System:** Added `librechatBug` property to field registry for documenting known LibreChat issues
- **Smart Export Logic:** Fields with documented bugs export to .env instead of YAML as workaround
- **Enhanced Validation:** Import validation accepts bug-affected fields in .env without false-positive errors
- **User Warnings:** UI tooltips show detailed bug explanations and workaround instructions

**The Problem:**
- LibreChat v0.8.0-rc4 has bug where `customFooter` cannot be set in librechat.yaml
- Backend loads it correctly from YAML, but frontend TypeScript interface missing the field definition
- Frontend filters out customFooter before displaying it to users
- Standard YAML-first policy would block users from using valid .env workaround

**The Solution:**
- **librechatBug Field:** New metadata property documents bug description, workaround, and affected versions
- **Exception Handling:** Export logic detects librechatBug and routes field to .env instead of YAML
- **Validation Updates:** Import validation allows CUSTOM_FOOTER in .env without YAML-only errors
- **UI Warnings:** Field tooltip shows: "⚠️ LIBRECHAT BUG: customFooter cannot be set in YAML... WORKAROUND: Use CUSTOM_FOOTER in .env"
- **Future-Proof:** System can easily document and handle other LibreChat bugs as discovered

**Impact:**
- **Works Around LibreChat Bugs:** Users can configure affected fields using .env workaround
- **Clear Guidance:** UI explains the bug and workaround so users understand why
- **No False Errors:** Import validation recognizes valid workarounds
- **Extensible System:** Easy to add workarounds for future LibreChat bugs
- **Documentation Built-In:** Bug metadata serves as both code documentation and user help text

## Version 2.1.5 - October 31, 2025 📦 **FIELD COVERAGE EXPANSION**
🎯 **BUG FIX:** Added 19 missing LibreChat RC4 fields to fix import rejections

**What Changed:**
- Tool Version: 2.1.4 → **2.1.5**
- **Added 4 fileConfig.endpoints.agents fields:** fileLimit, fileSizeLimit, totalSizeLimit, supportedMimeTypes
- **Added 4 memory.agent.model_parameters fields:** temperature, max_tokens, top_p, frequency_penalty
- **Added 11 speech.speechTab fields:** advancedMode, engineSTT, languageSTT, autoTranscribeAudio, decibelValue, autoSendText, engineTTS, languageTTS, automaticPlayback, playbackRate, cacheTTS

**The Problem:**
- Users importing valid LibreChat YAML files received "19 unsupported fields" error
- These were legitimate LibreChat RC4 fields that existed in documentation but not in the field registry
- Import was completely blocked, preventing users from loading their configurations

**The Solution:**
- **Complete Field Coverage:** Added all 19 missing fields to the field registry with proper types and defaults
- **Agents File Config:** Now supports per-endpoint file upload limits for Agents endpoint (matching OpenAI structure)
- **Memory Agent Parameters:** Full support for memory agent LLM configuration (temperature, tokens, etc.)
- **Speech Tab Advanced Features:** Complete coverage of speech tab configuration including browser engines, auto-transcription, playback settings

**Impact:**
- **No More Import Rejections:** Users can now import complete LibreChat RC4 configurations
- **Better Coverage:** Field registry now supports more LibreChat features
- **Future-Proof:** Alignment with latest LibreChat RC4 capabilities

## Version 2.1.4 - October 31, 2025 ✨ **AUTO-MIGRATE FEATURE**
🚀 **NEW FEATURE:** One-click automatic migration for YAML-only fields in .env files

**What Changed:**
- Tool Version: 2.1.3 → **2.1.4**
- **Auto-Migrate Button:** Added intelligent migration button that transfers values automatically
- **Enhanced State:** yamlOnlyFieldsData now includes field values for seamless migration
- **Improved UX:** Updated validation dialog with blue color scheme and clear "Option 1: Auto-Migrate (Recommended)" guidance

**The Problem:**
- Users importing .env files with YAML-only fields saw error dialog
- Manual fix required copying 7+ field values to correct YAML paths
- Error-prone and time-consuming for users

**The Solution:**
- **"Auto-Migrate to YAML" Button:** One-click solution that:
  - Reads all YAML-only field values from the rejected .env import
  - Automatically applies them to correct librechat.yaml paths (e.g., CUSTOM_WELCOME → interface.customWelcome)
  - Shows success toast with migration count
  - Closes dialog automatically
- **Smart Path Handling:** Correctly builds nested object structure from dot notation paths
- **Zero Manual Work:** Eliminates manual copying and reduces user errors

**Impact:**
- **Instant Migration:** 7 fields migrated in 1 click vs manual editing
- **Better UX:** Clear recommended path with highlighted auto-migrate option
- **Error Prevention:** Automated transfer prevents typos and incorrect path mapping
- **User Delight:** Transforms frustrating error into helpful feature

## Version 2.1.3 - October 31, 2025 ✅ **UI METADATA FIX**
🐛 **BUG FIX:** Corrected UI technical metadata display for YAML-only fields

**What Changed:**
- Tool Version: 2.1.2 → **2.1.3**
- **Fixed Field Lookup:** Enhanced getFieldInfo() to handle both prefixed and unprefixed field names
- **UI Accuracy:** All 196 YAML-only fields now correctly display "librechat.yaml" in technical info tooltips

**The Problem:**
- Some fields used prefixed names (e.g., "interface.customFooter") while registry used unprefixed IDs (e.g., "customFooter")
- Registry lookup was failing for prefixed field names
- Result: Fields like "Custom Footer" incorrectly showed "Sets CUSTOM_FOOTER in .env" instead of "librechat.yaml"

**The Fix:**
- Enhanced registry lookup to try exact match first, then strip prefix and retry
- Example: "interface.customFooter" → tries "interface.customFooter" → then "customFooter" → finds match
- All technical info tooltips now accurately reflect YAML-first policy

**Impact:**
- **Accurate UI Metadata:** Every field now shows the correct configuration file location
- **User Clarity:** No confusion about where to set YAML-only fields
- **Policy Consistency:** UI metadata aligns perfectly with export/import enforcement

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
- **Schema Definition**: Zod schemas for all LibreChat settings
- **Category Organization**: 18 logical categories
- **Profile System**: Save and load configuration profiles with versioning
- **Real-time Validation**: Client and server-side validation
- **Auto-Persistence**: Configuration saved to browser localStorage
- **Versioned Configuration System**: JSON exports include metadata (`toolVersion`, `librechatVersion`, `schemaVersion`, `exportDate`, `configurationName`). Features dynamic schema defaults and import compatibility checking to prevent data loss and ensure forward-compatibility.
- **Strict Import Validation System**: Comprehensive pre-import validation for YAML and .env files, rejecting imports with unmapped fields to prevent data loss and provide detailed user feedback.
- **YAML-First Policy**: All fields with a `yamlPath` are strictly exported to `librechat.yaml` and not `.env`. Imports containing YAML-only fields in `.env` are rejected with detailed user guidance.
- **LibreChat Bug Handling System**: Intelligent workaround system for known LibreChat bugs. Fields with documented bugs (e.g., customFooter) export to .env instead of YAML, with UI warnings explaining the issue and workaround. Import validation recognizes these exceptions to avoid false-positive errors.

## System Design Choices
- **UI/UX**: Tabbed interface with specialized input controls, responsive design, and smart UI elements that adapt based on dependencies (e.g., disabling `interface.modelSelect` when `modelSpecs.addedEndpoints` is populated). Includes user experience presets for common LibreChat configurations (e.g., "Agents-Only Mode").
- **Technical Implementations**: Features a Smart Installation System for Docker deployments allowing live configuration updates. Includes a Secret Caching System for server-side secrets to improve preview modal performance. Addresses specific LibreChat RC4 bugs, like disabling `modelSpecs.addedEndpoints` by default to prevent UI issues and providing granular control over "Enabled Endpoints." Achieves 100% bidirectional parity across all 400+ configuration fields using a unified registry system and `configPath` translation layer for LibreChat's native YAML format.
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
    - **Web Search Configuration**: Aligned with LibreChat RC4 webSearch YAML configuration, removing deprecated `.env` variables and supporting new ones.

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