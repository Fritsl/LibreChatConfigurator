const express = require('express');
const { Sandbox } = require('@e2b/code-interpreter');

const app = express();
app.use(express.json());

const E2B_API_KEY = process.env.E2B_API_KEY;

const displayMessage = "Code executed successfully. Results are shown below.";
const  errorDisplayMessage = "Code execution failed. Error details are shown below.";

if (!E2B_API_KEY) {
  console.error('❌ E2B_API_KEY environment variable is required');
  process.exit(1);
}

app.post('/execute', async (req, res) => {
  const { code, language = 'python' } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  if (language !== 'python') {
    return res.status(400).json({ error: 'Only Python is currently supported' });
  }

  let sandbox;
  
  try {
    console.log('🚀 Creating E2B sandbox...');
    sandbox = await Sandbox.create({ apiKey: E2B_API_KEY });
    
    console.log('▶️  Executing code...');
    const execution = await sandbox.runCode(code);
    
    const content = [];
    
    // Add text output (stdout/stderr, results)
    let textContent = '';
    
    if (execution.logs.stdout.length > 0) {
      textContent += '**Console Output:**\n```\n' + execution.logs.stdout.join('\n') + '\n```\n\n';
    }
    
    if (execution.logs.stderr.length > 0) {
      textContent += '**Errors:**\n```\n' + execution.logs.stderr.join('\n') + '\n```\n\n';
    }
    
    if (execution.results.length > 0) {
      const textResults = execution.results.filter(r => typeof r === 'string' || typeof r === 'number');
      if (textResults.length > 0) {
        textContent += '**Results:**\n```\n' + textResults.join('\n') + '\n```\n\n';
      }
    }
    
    // Add executed code
    textContent += '**Executed Code:**\n```python\n' + code + '\n```';
    
    // Add text content to response
    if (textContent) {
      content.push({
        type: 'text',
        text: textContent
      });
    }
    
    // Add images to content array
    if (execution.results.length > 0) {
      for (const result of execution.results) {
        if (result && typeof result === 'object' && result.png) {
          // E2B returns base64 PNG data
          content.push({
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${result.png}`
            }
          });
        } else if (result && typeof result === 'object' && result.jpeg) {
          content.push({
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${result.jpeg}`
            }
          });
        } else if (result && typeof result === 'object' && result.svg) {
          // For SVG, we need to base64 encode it first
          const svgBase64 = Buffer.from(result.svg).toString('base64');
          content.push({
            type: 'image_url',
            image_url: {
              url: `data:image/svg+xml;base64,${svgBase64}`
            }
          });
        }
      }
    }
    
    console.log('✅ Code executed successfully');
    
    // LibreChat expects: [response_array, {content: content_array}]
    // This is how DALL-E and other built-in tools return data
    const response = content.filter(item => item.type === 'text');
    const imageContent = content.filter(item => item.type === 'image_url');
    
    // Return in LibreChat's expected format
    const result = [
      response.length > 0 ? response : [{ type: 'text', text: displayMessage }],
      { content: imageContent.length > 0 ? imageContent : [] }
    ];
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Execution error:', error.message);
    
    // Return error in LibreChat's expected format
    const errorResponse = [
      {
        type: 'text',
        text: `**Execution Error:**\n\`\`\`\n${error.message}\n\`\`\`\n\n**Failed Code:**\n\`\`\`python\n${code}\n\`\`\``
      }
    ];
    
    res.status(500).json([errorResponse, { content: [] }]);
    
  } finally {
    if (sandbox) {
      await sandbox.close().catch(err => {
        console.error('Warning: Failed to close sandbox:', err.message);
      });
    }
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'e2b-code-interpreter',
    apiKeyConfigured: !!E2B_API_KEY
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎯 E2B Code Interpreter Proxy running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
});
