import express, { Request, Response } from 'express';
import cors from 'cors';
import { FileStorage } from './file-storage';
import { SandboxManager, SandboxMode } from './sandbox-manager';
import { MetricsCollector } from './metrics';

const app = express();

// Configuration from environment
const PORT = parseInt(process.env.E2B_PROXY_PORT || '3001', 10);
const E2B_API_KEY = process.env.E2B_API_KEY;
const FILE_TTL_DAYS = parseInt(process.env.E2B_FILE_TTL_DAYS || '30', 10);
const MAX_FILE_SIZE_MB = parseInt(process.env.E2B_MAX_FILE_SIZE || '50', 10);
const SANDBOX_MODE: SandboxMode = process.env.E2B_PER_USER_SANDBOX === 'true' ? 'per-user' : 'per-request';
const LIBRECHAT_ORIGIN = process.env.DOMAIN_CLIENT || 'http://localhost:3080';

// Validate required config
if (!E2B_API_KEY) {
  console.error('ERROR: E2B_API_KEY environment variable is required');
  process.exit(1);
}

// Initialize services
const fileStorage = new FileStorage('/tmp/e2b-files', FILE_TTL_DAYS, MAX_FILE_SIZE_MB);
const sandboxManager = new SandboxManager(E2B_API_KEY, SANDBOX_MODE);
const metrics = new MetricsCollector();

// Middleware
app.use(cors({
  origin: LIBRECHAT_ORIGIN,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// POST /execute - Execute code and return MCP-style content
app.post('/execute', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`[${new Date().toISOString()}] [REQUEST ${requestId}] POST /execute`);
  
  try {
    const { code, language = 'python', userId } = req.body;
    console.log(`[REQUEST ${requestId}] User: ${userId}, Language: ${language}`);
    console.log(`[REQUEST ${requestId}] Code length: ${code?.length || 0} bytes`);

    if (!code || typeof code !== 'string') {
      console.warn(`[REQUEST ${requestId}] Validation failed: Missing or invalid code`);
      return res.status(400).json({
        content: [
          { type: 'text', text: 'Error: Missing or invalid "code" field' }
        ]
      });
    }

    if (!userId || typeof userId !== 'string') {
      console.warn(`[REQUEST ${requestId}] Validation failed: Missing or invalid userId`);
      return res.status(400).json({
        content: [
          { type: 'text', text: 'Error: Missing or invalid "userId" field' }
        ]
      });
    }

    if (language !== 'python' && language !== 'javascript') {
      console.warn(`[REQUEST ${requestId}] Validation failed: Invalid language "${language}"`);
      return res.status(400).json({
        content: [
          { type: 'text', text: `Error: Language must be "python" or "javascript", got "${language}"` }
        ]
      });
    }

    console.log(`[REQUEST ${requestId}] Executing code in E2B sandbox...`);
    // Execute code in E2B sandbox
    const result = await sandboxManager.executeCode(userId, language, code);

    if (!result.success) {
      const duration = Date.now() - startTime;
      console.error(`[REQUEST ${requestId}] Execution failed after ${duration}ms`);
      console.error(`[REQUEST ${requestId}] Error: ${result.error}`);
      
      metrics.recordExecution(language, 'error', duration / 1000);
      metrics.recordError(result.error?.includes('E2B') ? 'E2B_ERROR' : 'EXECUTION_ERROR');
      
      console.log(`${'='.repeat(80)}\n`);
      return res.status(200).json({
        content: [
          { type: 'text', text: `Execution error: ${result.error}` }
        ]
      });
    }

    console.log(`[REQUEST ${requestId}] Code execution successful`);
    
    // Build MCP-style content array
    const content: Array<any> = [];
    
    // Add main text output (stdout/execution result)
    if (result.output && result.output.trim()) {
      content.push({
        type: 'text',
        text: result.output
      });
    }
    
    // Add execution logs as additional text items (stdout/stderr details)
    if (result.logs && result.logs.length > 0) {
      const logsText = result.logs.join('\n');
      if (logsText.trim()) {
        content.push({
          type: 'text',
          text: `Execution logs:\n${logsText}`
        });
      }
    }
    
    // If no output or logs, provide success message
    if (content.length === 0) {
      content.push({
        type: 'text',
        text: 'Code executed successfully'
      });
    }
    
    // Add images as MCP content items (base64, no data URL prefix)
    if (result.files && result.files.length > 0) {
      console.log(`[REQUEST ${requestId}] Converting ${result.files.length} output files to base64...`);
      
      for (const file of result.files) {
        try {
          // Convert buffer to base64 (no data URL prefix)
          const base64Data = file.content.toString('base64');
          
          content.push({
            type: 'image',
            mimeType: file.mimeType,
            data: base64Data,
            name: file.name
          });
          
          console.log(`[REQUEST ${requestId}] Added image: ${file.name} (${file.mimeType}, ${file.content.length} bytes)`);
          metrics.recordFileSize(file.content.length);
        } catch (err) {
          console.error(`[REQUEST ${requestId}] Failed to convert file ${file.name}:`, err);
          metrics.recordError('FILE_CONVERSION_ERROR');
        }
      }
    } else {
      console.log(`[REQUEST ${requestId}] No output files generated`);
    }

    // Update metrics
    const duration = Date.now() - startTime;
    metrics.recordExecution(language, 'success', duration / 1000);

    console.log(`[REQUEST ${requestId}] Response: ${content.length} content items (${content.filter(c => c.type === 'image').length} images)`);
    console.log(`[REQUEST ${requestId}] Total duration: ${duration}ms`);
    console.log(`${'='.repeat(80)}\n`);

    return res.json({ content });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[REQUEST ${requestId}] Proxy error after ${duration}ms:`, error);
    console.error(`[REQUEST ${requestId}] Stack trace:`, error instanceof Error ? error.stack : 'N/A');
    console.log(`${'='.repeat(80)}\n`);
    
    metrics.recordError('PROXY_ERROR');
    
    return res.status(500).json({
      content: [
        { type: 'text', text: `Server error: ${error instanceof Error ? error.message : 'Internal server error'}` }
      ]
    });
  }
});

// GET /files/:fileId - Serve file with security checks
app.get('/files/:fileId', async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const userId = req.query.userId as string;
  
  console.log(`[${new Date().toISOString()}] GET /files/${fileId} (user: ${userId || 'missing'})`);
  
  try {
    if (!userId) {
      console.warn(`File request rejected: Missing userId for file ${fileId}`);
      return res.status(400).json({
        error: 'CLIENT_ERROR',
        message: 'Missing userId query parameter'
      });
    }

    const file = await fileStorage.getFile(fileId, userId);
    
    if (!file) {
      console.warn(`File not found or expired: ${fileId} for user ${userId}`);
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'File not found or expired'
      });
    }

    const content = await fileStorage.readFileContent(fileId, userId);
    
    console.log(`Serving file: ${file.filename} (${file.mimeType}, ${content.length} bytes) to user ${userId}`);
    
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
    res.send(content);

  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return res.status(403).json({
        error: 'UNAUTHORIZED',
        message: 'You do not have access to this file'
      });
    }
    
    console.error('File serving error:', error);
    return res.status(500).json({
      error: 'PROXY_ERROR',
      message: 'Failed to serve file'
    });
  }
});

// GET /health - Docker healthcheck
app.get('/health', (req: Request, res: Response) => {
  const stats = fileStorage.getStats();
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    fileStorage: {
      totalFiles: stats.totalFiles,
      storageDir: stats.storageDir
    },
    sandboxMode: SANDBOX_MODE
  });
});

// GET /metrics - Prometheus metrics
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metricsData = await metrics.getMetrics();
    res.set('Content-Type', metrics.register.contentType);
    res.send(metricsData);
  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).send('Failed to collect metrics');
  }
});

// Initialize and start server
async function start() {
  try {
    await fileStorage.initialize();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log('='.repeat(60));
      console.log('E2B Code Execution Proxy Service');
      console.log('='.repeat(60));
      console.log(`Port: ${PORT}`);
      console.log(`Sandbox Mode: ${SANDBOX_MODE}`);
      console.log(`File TTL: ${FILE_TTL_DAYS} days`);
      console.log(`Max File Size: ${MAX_FILE_SIZE_MB}MB`);
      console.log(`CORS Origin: ${LIBRECHAT_ORIGIN}`);
      console.log('='.repeat(60));
      console.log('Endpoints:');
      console.log(`  POST   http://0.0.0.0:${PORT}/execute`);
      console.log(`  GET    http://0.0.0.0:${PORT}/files/:fileId`);
      console.log(`  GET    http://0.0.0.0:${PORT}/health`);
      console.log(`  GET    http://0.0.0.0:${PORT}/metrics`);
      console.log('='.repeat(60));
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await fileStorage.shutdown();
  await sandboxManager.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await fileStorage.shutdown();
  await sandboxManager.shutdown();
  process.exit(0);
});

start();
