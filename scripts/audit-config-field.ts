#!/usr/bin/env tsx

/**
 * Configuration Field Audit Utility
 * 
 * This tool audits whether a configuration field is properly implemented
 * across all touchpoints in the LibreChat Configuration Tool.
 * 
 * Usage:
 *   tsx scripts/audit-config-field.ts <fieldName> [--type=env|yaml|both]
 * 
 * Examples:
 *   tsx scripts/audit-config-field.ts SEARCH --type=env
 *   tsx scripts/audit-config-field.ts searchProvider --type=yaml
 *   tsx scripts/audit-config-field.ts webSearch.serperApiKey
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface AuditResult {
  field: string;
  type: 'env' | 'yaml' | 'nested';
  touchpoints: {
    defaultConfiguration: boolean;
    envValidationWhitelist: boolean;
    envImportMapper: boolean;
    envExportGenerator: boolean;
    yamlValidation: boolean;
    yamlImportMapper: boolean;
    yamlExportGenerator: boolean;
    uiComponent: boolean | string; // true, false, or component path
  };
  issues: string[];
  recommendations: string[];
}

class ConfigFieldAuditor {
  private projectRoot: string;
  
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
  }
  
  /**
   * Read a file and return its content
   */
  private readFile(relativePath: string): string {
    const fullPath = path.join(this.projectRoot, relativePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`);
    }
    return fs.readFileSync(fullPath, 'utf-8');
  }
  
  /**
   * Check if a pattern exists in a file
   */
  private fileContains(relativePath: string, pattern: string | RegExp): boolean {
    try {
      const content = this.readFile(relativePath);
      if (typeof pattern === 'string') {
        return content.includes(pattern);
      }
      return pattern.test(content);
    } catch {
      return false;
    }
  }
  
  /**
   * Find all occurrences of a pattern in a file with line numbers
   */
  private findInFile(relativePath: string, pattern: RegExp): Array<{line: number, text: string}> {
    try {
      const content = this.readFile(relativePath);
      const lines = content.split('\n');
      const matches: Array<{line: number, text: string}> = [];
      
      lines.forEach((line, index) => {
        if (pattern.test(line)) {
          matches.push({ line: index + 1, text: line.trim() });
        }
      });
      
      return matches;
    } catch {
      return [];
    }
  }
  
  /**
   * Audit an environment variable
   */
  private auditEnvField(fieldName: string): AuditResult {
    const result: AuditResult = {
      field: fieldName,
      type: 'env',
      touchpoints: {
        defaultConfiguration: false,
        envValidationWhitelist: false,
        envImportMapper: false,
        envExportGenerator: false,
        yamlValidation: false,
        yamlImportMapper: false,
        yamlExportGenerator: false,
        uiComponent: false
      },
      issues: [],
      recommendations: []
    };
    
    // Check .env validation whitelist
    result.touchpoints.envValidationWhitelist = this.fileContains(
      'client/src/pages/home.tsx',
      `'${fieldName}'`
    );
    
    // Check .env import mapper
    const envImportPattern = new RegExp(`envVars\\.${fieldName}|if \\(envVars\\.${fieldName}\\)`);
    result.touchpoints.envImportMapper = this.fileContains(
      'client/src/pages/home.tsx',
      envImportPattern
    );
    
    // Check .env export generator
    // Use word boundaries to avoid matching substrings (e.g., "SEARCH" shouldn't match "GOOGLE_SEARCH_API_KEY")
    const envExportPattern = new RegExp(`\\b${fieldName}=|\\b${fieldName}\\s*:`);
    result.touchpoints.envExportGenerator = this.fileContains(
      'server/routes.ts',
      envExportPattern
    );
    
    // Analyze issues
    if (result.touchpoints.envExportGenerator && !result.touchpoints.envValidationWhitelist) {
      result.issues.push('❌ Field is EXPORTED but NOT in validation whitelist - imports will be rejected');
      result.recommendations.push(`Add '${fieldName}' to supportedEnvVars Set in client/src/pages/home.tsx`);
    }
    
    if (result.touchpoints.envExportGenerator && !result.touchpoints.envImportMapper) {
      result.issues.push('❌ Field is EXPORTED but NOT in import mapper - data will be lost on import');
      result.recommendations.push(`Add mapping in mapEnvToConfiguration() in client/src/pages/home.tsx`);
    }
    
    if (result.touchpoints.envImportMapper && !result.touchpoints.envExportGenerator) {
      result.issues.push('⚠️  Field can be IMPORTED but is NOT exported - one-way flow only');
    }
    
    if (result.touchpoints.envValidationWhitelist && !result.touchpoints.envImportMapper) {
      result.issues.push('❌ Field is in VALIDATION but NOT mapped - validation is useless');
      result.recommendations.push(`Add mapping in mapEnvToConfiguration() in client/src/pages/home.tsx`);
    }
    
    return result;
  }
  
  /**
   * Audit a YAML field
   */
  private auditYamlField(fieldPath: string): AuditResult {
    const parts = fieldPath.split('.');
    const topLevel = parts[0];
    const nested = parts.slice(1).join('.');
    
    const result: AuditResult = {
      field: fieldPath,
      type: parts.length > 1 ? 'nested' : 'yaml',
      touchpoints: {
        defaultConfiguration: false,
        envValidationWhitelist: false,
        envImportMapper: false,
        envExportGenerator: false,
        yamlValidation: false,
        yamlImportMapper: false,
        yamlExportGenerator: false,
        uiComponent: false
      },
      issues: [],
      recommendations: []
    };
    
    // Check YAML validation
    if (parts.length === 1) {
      result.touchpoints.yamlValidation = this.fileContains(
        'client/src/pages/home.tsx',
        `'${topLevel}'`
      );
    } else {
      const nestedPattern = new RegExp(`'${nested}'`);
      result.touchpoints.yamlValidation = this.fileContains(
        'client/src/pages/home.tsx',
        nestedPattern
      );
    }
    
    // Check YAML import mapper
    const yamlImportPattern = new RegExp(
      parts.length === 1 
        ? `yamlData\\.${topLevel}` 
        : `yamlData\\.${topLevel}\\.${nested}`
    );
    result.touchpoints.yamlImportMapper = this.fileContains(
      'client/src/pages/home.tsx',
      yamlImportPattern
    );
    
    // Check YAML export generator
    const yamlExportPattern = new RegExp(
      parts.length === 1
        ? `${topLevel}:`
        : `${nested}:`
    );
    result.touchpoints.yamlExportGenerator = this.fileContains(
      'server/index.ts',
      yamlExportPattern
    );
    
    // Check defaultConfiguration
    const configPattern = new RegExp(
      parts.length === 1
        ? `^\\s*${topLevel}:`
        : `^\\s*${nested}:`
    );
    result.touchpoints.defaultConfiguration = this.fileContains(
      'client/src/lib/configuration-defaults.ts',
      configPattern
    );
    
    return result;
  }
  
  /**
   * Main audit function
   */
  audit(field: string, type?: 'env' | 'yaml' | 'both'): AuditResult {
    // Auto-detect type if not specified
    if (!type) {
      if (field.toUpperCase() === field && !field.includes('.')) {
        type = 'env';
      } else {
        type = 'yaml';
      }
    }
    
    if (type === 'env') {
      return this.auditEnvField(field);
    } else {
      return this.auditYamlField(field);
    }
  }
  
  /**
   * Print audit results in a readable format
   */
  printResults(result: AuditResult): void {
    console.log('\n' + '='.repeat(80));
    console.log(`Configuration Field Audit: ${result.field}`);
    console.log('='.repeat(80));
    console.log(`Type: ${result.type.toUpperCase()}`);
    console.log('\nTouchpoint Coverage:');
    console.log('─'.repeat(80));
    
    Object.entries(result.touchpoints).forEach(([key, value]) => {
      const icon = value ? '✅' : '❌';
      const status = value === true ? 'YES' : value === false ? 'NO' : value;
      console.log(`${icon} ${key.padEnd(25)}: ${status}`);
    });
    
    if (result.issues.length > 0) {
      console.log('\n⚠️  Issues Found:');
      console.log('─'.repeat(80));
      result.issues.forEach(issue => console.log(issue));
    }
    
    if (result.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      console.log('─'.repeat(80));
      result.recommendations.forEach(rec => console.log(rec));
    }
    
    if (result.issues.length === 0) {
      console.log('\n✨ No issues found - field is properly implemented!');
    }
    
    console.log('='.repeat(80) + '\n');
  }
}

// CLI Interface
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
Configuration Field Audit Utility

Usage:
  tsx scripts/audit-config-field.ts <fieldName> [--type=env|yaml]

Examples:
  tsx scripts/audit-config-field.ts SEARCH --type=env
  tsx scripts/audit-config-field.ts searchProvider --type=yaml
  tsx scripts/audit-config-field.ts webSearch.serperApiKey

Options:
  --type=env|yaml    Specify field type (auto-detected if omitted)
  --help, -h         Show this help message
`);
  process.exit(0);
}

const fieldName = args[0];
const typeArg = args.find(arg => arg.startsWith('--type='));
const type = typeArg ? typeArg.split('=')[1] as 'env' | 'yaml' : undefined;

const auditor = new ConfigFieldAuditor();
const result = auditor.audit(fieldName, type);
auditor.printResults(result);

// Exit with error code if issues found
process.exit(result.issues.length > 0 ? 1 : 0);

export { ConfigFieldAuditor, AuditResult };
