#!/usr/bin/env node

import http from 'http';
import fs from 'fs';

const BASE_URL = 'http://localhost:5000';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runRoundTripTest() {
  console.log('🧪 Starting Round-Trip Parity Test...\n');

  // Step 1: Get baseline configuration
  console.log('📥 Fetching baseline configuration...');
  const baseline = await makeRequest('/api/configuration/default');
  console.log('✅ Baseline fetched\n');

  // Step 2: Generate package (which includes all export formats)
  console.log('📦 Generating export package...');
  const packageData = await makeRequest('/api/package/generate', 'POST', { 
    configuration: baseline,
    includeFiles: ["env", "yaml"]
  });
  console.log('✅ Package generated\n');

  // Step 3: Parse the exports from the package
  const yamlContent = packageData.files['librechat.yaml'];
  const envContent = packageData.files['.env'];
  const jsonContent = packageData.files['LibreChatConfigSettings.json'];
  const jsonExport = JSON.parse(jsonContent);

  // Step 4: Test each format
  const results = {
    json: null,
    yaml: null,
    env: null
  };

  // Test JSON round-trip
  console.log('🔄 Testing JSON round-trip...');
  const jsonImported = await makeRequest('/api/import/json', 'POST', { content: JSON.stringify(jsonExport) });
  results.json = compareConfigurations(baseline, jsonImported);
  
  // Test YAML round-trip
  console.log('🔄 Testing YAML round-trip...');
  const yamlImported = await makeRequest('/api/import/yaml', 'POST', { content: yamlContent });
  results.yaml = compareConfigurations(baseline, yamlImported);
  
  // Test ENV round-trip
  console.log('🔄 Testing ENV round-trip...');
  const envImported = await makeRequest('/api/import/env', 'POST', { content: envContent });
  results.env = compareConfigurations(baseline, envImported);

  // Print results
  console.log('\n' + '='.repeat(60));
  console.log('📊 ROUND-TRIP TEST RESULTS');
  console.log('='.repeat(60) + '\n');

  for (const [format, result] of Object.entries(results)) {
    const formatName = format.toUpperCase();
    const status = result.newFields.length === 0 && result.updatedFields.length === 0 ? '✅ PASS' : '❌ FAIL';
    
    console.log(`${formatName}: ${status}`);
    
    if (result.newFields.length > 0) {
      console.log(`  ⚠️  New fields: ${result.newFields.length}`);
      result.newFields.forEach(field => console.log(`    - ${field}`));
    }
    
    if (result.updatedFields.length > 0) {
      console.log(`  ⚠️  Updated fields: ${result.updatedFields.length}`);
      result.updatedFields.forEach(field => console.log(`    - ${field.path}: ${JSON.stringify(field.baseline)} → ${JSON.stringify(field.imported)}`));
    }
    
    console.log('');
  }

  const allPassed = Object.values(results).every(r => r.newFields.length === 0 && r.updatedFields.length === 0);
  
  // Write detailed results to file
  fs.writeFileSync('/tmp/roundtrip-details.json', JSON.stringify(results, null, 2));
  console.log('📄 Detailed results saved to /tmp/roundtrip-details.json\n');
  
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED! Perfect round-trip parity achieved.');
  } else {
    console.log('❌ TESTS FAILED. Round-trip parity not achieved.');
    process.exit(1);
  }
}

function compareConfigurations(baseline, imported) {
  const newFields = [];
  const updatedFields = [];
  
  function compare(basePath, baseVal, importedVal) {
    if (importedVal === undefined || importedVal === null || importedVal === '') {
      return;
    }
    
    if (baseVal === undefined || baseVal === null || baseVal === '') {
      newFields.push(basePath);
      return;
    }
    
    if (typeof importedVal === 'object' && !Array.isArray(importedVal)) {
      for (const key in importedVal) {
        compare(`${basePath}.${key}`, baseVal[key], importedVal[key]);
      }
    } else if (JSON.stringify(baseVal) !== JSON.stringify(importedVal)) {
      updatedFields.push({ path: basePath, baseline: baseVal, imported: importedVal });
    }
  }
  
  compare('root', baseline, imported);
  
  return { newFields, updatedFields };
}

runRoundTripTest().catch(console.error);
