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
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;

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
        success: false,
        error: 'Missing or invalid "code" field'
      });
    }

    if (!userId || typeof userId !== 'string') {
      console.warn(`[REQUEST ${requestId}] Validation failed: Missing or invalid userId`);
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid "userId" field'
      });
    }

    if (language !== 'python' && language !== 'javascript') {
      console.warn(`[REQUEST ${requestId}] Validation failed: Invalid language "${language}"`);
      return res.status(400).json({
        success: false,
        error: `Language must be "python" or "javascript", got "${language}"`
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
        success: false,
        error: result.error || 'Code execution failed'
      });
    }

    console.log(`[REQUEST ${requestId}] Code execution successful`);
    
    // Build response text with output and file URLs
    let responseText = '';
    
    // Add main text output (stdout/execution result)
    if (result.output && result.output.trim()) {
      responseText += result.output;
    }
    
    // Add execution logs if present
    if (result.logs && result.logs.length > 0) {
      const logsText = result.logs.join('\n');
      if (logsText.trim()) {
        if (responseText) responseText += '\n\n';
        responseText += `Execution logs:\n${logsText}`;
      }
    }
    
    // If no output or logs, provide success message
    if (!responseText) {
      responseText = 'Code executed successfully';
    }
    
    // Save files and generate URLs
    if (result.files && result.files.length > 0) {
      console.log(`[REQUEST ${requestId}] Saving ${result.files.length} output files...`);
      
      const fileUrls: string[] = [];
      
      for (const file of result.files) {
        try {
          // Save file to storage
          const storedFile = await fileStorage.storeFile(
            userId,
            file.name,
            file.content,
            file.mimeType
          );
          
          // Generate accessible URL (includes userId for security)
          const fileUrl = `${PUBLIC_BASE_URL}/files/${storedFile.id}?userId=${userId}`;
          fileUrls.push(fileUrl);
          
          console.log(`[REQUEST ${requestId}] Saved file: ${file.name} -> ${fileUrl}`);
          metrics.recordFileSize(file.content.length);
        } catch (err) {
          console.error(`[REQUEST ${requestId}] Failed to save file ${file.name}:`, err);
          metrics.recordError('FILE_STORAGE_ERROR');
        }
      }
      
      // Add file URLs as markdown images to response text
      if (fileUrls.length > 0 && result.files) {
        responseText += '\n\n';
        fileUrls.forEach((url, index) => {
          const fileName = result.files![index]?.name || `file-${index + 1}`;
          responseText += `![${fileName}](${url})\n`;
        });
      }
    } else {
      console.log(`[REQUEST ${requestId}] No output files generated`);
    }

    // Update metrics
    const duration = Date.now() - startTime;
    metrics.recordExecution(language, 'success', duration / 1000);

    console.log(`[REQUEST ${requestId}] Response text length: ${responseText.length} bytes`);
    console.log(`[REQUEST ${requestId}] Total duration: ${duration}ms`);
    console.log(`${'='.repeat(80)}\n`);

    return res.json({ 
      success: true,
      output: responseText
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[REQUEST ${requestId}] Proxy error after ${duration}ms:`, error);
    console.error(`[REQUEST ${requestId}] Stack trace:`, error instanceof Error ? error.stack : 'N/A');
    console.log(`${'='.repeat(80)}\n`);
    
    metrics.recordError('PROXY_ERROR');
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
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
    res.end(content);

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
