/**
 * CENTRAL VERSION MANAGEMENT - SINGLE SOURCE OF TRUTH
 * 
 * ⚠️ IMPORTANT: When making ANY changes to the application, increment TOOL_VERSION:
 * - Major features: increment first number (1.0.0 -> 2.0.0)
 * - Minor features/updates: increment second number (1.0.0 -> 1.1.0)  
 * - Bug fixes/small changes: increment third number (1.0.0 -> 1.0.1)
 * 
 * DO NOT change LIBRECHAT_TARGET_VERSION unless supporting a new LibreChat version
 * 
 * This version is automatically used in:
 * - Top header display (client/src/pages/home.tsx)
 * - JSON configuration exports (client/src/pages/home.tsx - handleSaveProfile)
 * - Any other places that need version information
 * 
 * REMINDER LOCATIONS TO UPDATE TOOL_VERSION:
 * - After adding new features
 * - After bug fixes
 * - After UI/UX improvements
 * - After schema changes
 * - After integration updates
 */

// This Configuration Tool's Version (independent of LibreChat)
export const TOOL_VERSION = "1.10.0";

// LibreChat Version This Tool Supports
export const LIBRECHAT_TARGET_VERSION = "0.8.0-rc4";

export const VERSION_INFO = {
  toolVersion: TOOL_VERSION,
  librechatTarget: LIBRECHAT_TARGET_VERSION,
  lastUpdated: "2025-10-08",
  changelog: "CRITICAL FIXES for LibreChat RC4 web search: Fixed SEARXNG_SECRET/SEARXNG_INSTANCE_URL concatenation bug in .env. Added default URLs for FIRECRAWL_API_URL and JINA_RERANKER_URL to prevent plugin auth errors. All web search configuration now properly generated across .env, docker-compose.yml, and librechat.yaml files."
} as const;

// Helper function to get the tool's version string
export const getToolVersion = () => TOOL_VERSION;

// Helper function to get LibreChat target version string  
export const getLibreChatVersion = () => LIBRECHAT_TARGET_VERSION;

// Helper function to get full version info
export const getVersionInfo = () => VERSION_INFO;

// Legacy helper for backward compatibility (returns tool version)
export const getVersion = () => TOOL_VERSION;