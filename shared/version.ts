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
export const TOOL_VERSION = "2.1.0";

// LibreChat Version This Tool Supports
export const LIBRECHAT_TARGET_VERSION = "0.8.0-rc4";

// Configuration Schema Version (for migration tracking)
export const SCHEMA_VERSION = "2.0.0";

export const VERSION_INFO = {
  toolVersion: TOOL_VERSION,
  librechatTarget: LIBRECHAT_TARGET_VERSION,
  schemaVersion: SCHEMA_VERSION,
  lastUpdated: "2025-10-31",
  changelog: "FEATURE COMPLETE: Achieved 100% ENV coverage of LibreChat RC4 - all 176 environment variables now supported. Added 90+ missing fields including SAML (13), OpenID (15), Azure AI Search (7), MongoDB (7), rate limiting (11), and more. Field registry expanded to 480+ fields with complete bidirectional parity."
} as const;

// Helper function to get the tool's version string
export const getToolVersion = () => TOOL_VERSION;

// Helper function to get LibreChat target version string  
export const getLibreChatVersion = () => LIBRECHAT_TARGET_VERSION;

// Helper function to get full version info
export const getVersionInfo = () => VERSION_INFO;

// Legacy helper for backward compatibility (returns tool version)
export const getVersion = () => TOOL_VERSION;

/**
 * VERSIONED CONFIGURATION SYSTEM
 * Export/Import metadata and migration infrastructure
 */

/**
 * Export metadata contract - included in every JSON export
 */
export interface ExportMetadata {
  toolVersion: string;          // Version of the configurator that created this export
  librechatVersion: string;     // Target LibreChat version
  schemaVersion: string;        // Configuration schema version
  exportDate: string;           // ISO timestamp of export
  configurationName?: string;   // Optional configuration name
}

/**
 * Import result with conflict detection
 */
export interface ImportResult {
  success: boolean;
  configuration?: any;
  metadata?: ExportMetadata;
  conflicts?: ImportConflict[];
  warnings?: string[];
}

/**
 * Types of conflicts that can occur during import
 */
export type ConflictType = 
  | "missing_field"      // New field in current schema not in import
  | "removed_field"      // Field in import not in current schema
  | "renamed_field"      // Field was renamed between versions
  | "type_mismatch"      // Field type changed between versions
  | "invalid_value"      // Value doesn't pass validation
  | "version_mismatch";  // Major version incompatibility

/**
 * Conflict details for user resolution
 */
export interface ImportConflict {
  type: ConflictType;
  field: string;
  message: string;
  oldValue?: any;
  newValue?: any;
  resolution?: "auto" | "manual" | "skip";
  severity: "error" | "warning" | "info";
}

/**
 * Migration definition for schema version upgrades
 */
export interface SchemaMigration {
  fromVersion: string;
  toVersion: string;
  description: string;
  migrate: (config: any) => { config: any; conflicts: ImportConflict[] };
}

/**
 * Create export metadata for current version
 */
export function createExportMetadata(configurationName?: string): ExportMetadata {
  return {
    toolVersion: TOOL_VERSION,
    librechatVersion: LIBRECHAT_TARGET_VERSION,
    schemaVersion: SCHEMA_VERSION,
    exportDate: new Date().toISOString(),
    configurationName,
  };
}

/**
 * Check if import is compatible with current version
 */
export function checkVersionCompatibility(metadata: ExportMetadata): {
  compatible: boolean;
  warnings: string[];
  requiresMigration: boolean;
} {
  const warnings: string[] = [];
  let requiresMigration = false;

  // Check schema version
  if (metadata.schemaVersion !== SCHEMA_VERSION) {
    requiresMigration = true;
    warnings.push(
      `Configuration was exported with schema v${metadata.schemaVersion}, current is v${SCHEMA_VERSION}. Migration may be required.`
    );
  }

  // Check tool version
  if (metadata.toolVersion !== TOOL_VERSION) {
    warnings.push(
      `Configuration was created with configurator v${metadata.toolVersion}, current is v${TOOL_VERSION}.`
    );
  }

  // Check LibreChat version
  if (metadata.librechatVersion !== LIBRECHAT_TARGET_VERSION) {
    warnings.push(
      `Configuration targets LibreChat ${metadata.librechatVersion}, current target is ${LIBRECHAT_TARGET_VERSION}.`
    );
  }

  // For now, all versions are compatible (we'll add breaking change detection later)
  return {
    compatible: true,
    warnings,
    requiresMigration,
  };
}