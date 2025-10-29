#!/usr/bin/env tsx

/**
 * Batch Configuration Field Audit
 * 
 * Processes all fields from the field manifest and generates
 * a comprehensive coverage report.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { ConfigFieldAuditor, AuditResult } from './audit-config-field.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

interface BatchResults {
  timestamp: string;
  totalFields: number;
  envVarsAudited: number;
  yamlFieldsAudited: number;
  fieldsWithIssues: number;
  fieldsPerfect: number;
  criticalIssues: AuditResult[];
  warningIssues: AuditResult[];
  perfectFields: string[];
  summary: {
    exportedButNotValidated: number;
    exportedButNotImported: number;
    importedButNotExported: number;
    validatedButNotMapped: number;
  };
}

/**
 * Categorize issue severity
 */
function getIssueSeverity(result: AuditResult): 'critical' | 'warning' | 'none' {
  const hasCritical = result.issues.some(issue => 
    issue.includes('EXPORTED but NOT in validation') ||
    issue.includes('EXPORTED but NOT in import mapper') ||
    issue.includes('VALIDATION but NOT mapped')
  );
  
  if (hasCritical) return 'critical';
  if (result.issues.length > 0) return 'warning';
  return 'none';
}

/**
 * Run batch audit on all fields
 */
function runBatchAudit(manifestPath: string): BatchResults {
  // Load manifest
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const auditor = new ConfigFieldAuditor();
  
  const results: BatchResults = {
    timestamp: new Date().toISOString(),
    totalFields: 0,
    envVarsAudited: 0,
    yamlFieldsAudited: 0,
    fieldsWithIssues: 0,
    fieldsPerfect: 0,
    criticalIssues: [],
    warningIssues: [],
    perfectFields: [],
    summary: {
      exportedButNotValidated: 0,
      exportedButNotImported: 0,
      importedButNotExported: 0,
      validatedButNotMapped: 0
    }
  };
  
  console.log('🔍 Starting batch audit...\n');
  
  // Audit environment variables
  console.log(`📝 Auditing ${manifest.envVars.length} environment variables...`);
  let processedEnv = 0;
  for (const envVar of manifest.envVars) {
    const result = auditor.audit(envVar, 'env');
    results.envVarsAudited++;
    results.totalFields++;
    processedEnv++;
    
    if (processedEnv % 25 === 0) {
      console.log(`   Processed ${processedEnv}/${manifest.envVars.length} env vars...`);
    }
    
    const severity = getIssueSeverity(result);
    if (severity === 'critical') {
      results.criticalIssues.push(result);
      results.fieldsWithIssues++;
      
      // Track specific issue types
      result.issues.forEach(issue => {
        if (issue.includes('EXPORTED but NOT in validation')) {
          results.summary.exportedButNotValidated++;
        }
        if (issue.includes('EXPORTED but NOT in import mapper')) {
          results.summary.exportedButNotImported++;
        }
        if (issue.includes('IMPORTED but is NOT exported')) {
          results.summary.importedButNotExported++;
        }
        if (issue.includes('VALIDATION but NOT mapped')) {
          results.summary.validatedButNotMapped++;
        }
      });
    } else if (severity === 'warning') {
      results.warningIssues.push(result);
      results.fieldsWithIssues++;
    } else {
      results.perfectFields.push(result.field);
      results.fieldsPerfect++;
    }
  }
  console.log(`   ✅ Completed ${manifest.envVars.length} env vars\n`);
  
  // Audit YAML fields (limited to non-wildcard fields)
  const yamlFieldsToAudit = manifest.yamlFields.filter((f: string) => !f.includes('*'));
  console.log(`📝 Auditing ${yamlFieldsToAudit.length} YAML fields (excluding wildcards)...`);
  let processedYaml = 0;
  for (const yamlField of yamlFieldsToAudit) {
    const result = auditor.audit(yamlField, 'yaml');
    results.yamlFieldsAudited++;
    results.totalFields++;
    processedYaml++;
    
    if (processedYaml % 25 === 0) {
      console.log(`   Processed ${processedYaml}/${yamlFieldsToAudit.length} YAML fields...`);
    }
    
    const severity = getIssueSeverity(result);
    if (severity === 'critical') {
      results.criticalIssues.push(result);
      results.fieldsWithIssues++;
    } else if (severity === 'warning') {
      results.warningIssues.push(result);
      results.fieldsWithIssues++;
    } else {
      results.perfectFields.push(result.field);
      results.fieldsPerfect++;
    }
  }
  console.log(`   ✅ Completed ${yamlFieldsToAudit.length} YAML fields\n`);
  
  return results;
}

/**
 * Generate coverage report
 */
function generateReport(results: BatchResults): void {
  console.log('\n' + '='.repeat(80));
  console.log('COMPREHENSIVE CONFIGURATION FIELD COVERAGE REPORT');
  console.log('='.repeat(80));
  console.log(`Generated: ${new Date(results.timestamp).toLocaleString()}`);
  console.log('\n📊 AUDIT SUMMARY');
  console.log('─'.repeat(80));
  console.log(`Total Fields Audited:      ${results.totalFields}`);
  console.log(`  ├─ Environment Variables: ${results.envVarsAudited}`);
  console.log(`  └─ YAML Fields:          ${results.yamlFieldsAudited}`);
  console.log();
  console.log(`Fields with Perfect Coverage: ${results.fieldsPerfect} (${((results.fieldsPerfect / results.totalFields) * 100).toFixed(1)}%)`);
  console.log(`Fields with Issues:           ${results.fieldsWithIssues} (${((results.fieldsWithIssues / results.totalFields) * 100).toFixed(1)}%)`);
  console.log(`  ├─ Critical Issues:          ${results.criticalIssues.length}`);
  console.log(`  └─ Warning Issues:           ${results.warningIssues.length}`);
  
  console.log('\n🚨 ISSUE BREAKDOWN');
  console.log('─'.repeat(80));
  console.log(`Exported but NOT Validated:  ${results.summary.exportedButNotValidated} fields`);
  console.log(`Exported but NOT Imported:   ${results.summary.exportedButNotImported} fields`);
  console.log(`Imported but NOT Exported:   ${results.summary.importedButNotExported} fields`);
  console.log(`Validated but NOT Mapped:    ${results.summary.validatedButNotMapped} fields`);
  
  // Show top 20 critical issues
  if (results.criticalIssues.length > 0) {
    console.log('\n🔥 TOP CRITICAL ISSUES (showing first 20)');
    console.log('─'.repeat(80));
    results.criticalIssues.slice(0, 20).forEach((result, idx) => {
      console.log(`\n${idx + 1}. ${result.field} (${result.type.toUpperCase()})`);
      result.issues.forEach(issue => {
        console.log(`   ${issue}`);
      });
    });
    
    if (results.criticalIssues.length > 20) {
      console.log(`\n... and ${results.criticalIssues.length - 20} more critical issues`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`COVERAGE SCORE: ${((results.fieldsPerfect / results.totalFields) * 100).toFixed(1)}%`);
  console.log('='.repeat(80) + '\n');
}

/**
 * Save detailed results to JSON
 */
function saveResults(results: BatchResults, outputPath: string): void {
  // Create a detailed report
  const detailedReport = {
    ...results,
    criticalIssues: results.criticalIssues.map(r => ({
      field: r.field,
      type: r.type,
      issues: r.issues,
      recommendations: r.recommendations
    })),
    warningIssues: results.warningIssues.map(r => ({
      field: r.field,
      type: r.type,
      issues: r.issues
    }))
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(detailedReport, null, 2));
  console.log(`💾 Detailed results saved to: ${outputPath}\n`);
}

/**
 * Main execution
 */
function main() {
  const manifestPath = path.join(projectRoot, 'scripts/field-manifest.json');
  
  if (!fs.existsSync(manifestPath)) {
    console.error('❌ Field manifest not found. Please run generate-field-manifest.ts first.');
    process.exit(1);
  }
  
  console.log('================================================================================');
  console.log('BATCH CONFIGURATION FIELD AUDIT');
  console.log('================================================================================\n');
  
  const results = runBatchAudit(manifestPath);
  generateReport(results);
  
  const outputPath = path.join(projectRoot, 'scripts/audit-results.json');
  saveResults(results, outputPath);
  
  // Exit with error if critical issues found
  process.exit(results.criticalIssues.length > 0 ? 1 : 0);
}

main();
