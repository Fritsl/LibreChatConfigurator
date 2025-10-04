import { Sandbox } from '@e2b/code-interpreter';

export type SandboxMode = 'per-request' | 'per-user';

export interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  logs?: string[];
  files?: Array<{
    name: string;
    content: Buffer;
    mimeType: string;
  }>;
}

export class SandboxManager {
  private userSandboxes: Map<string, Sandbox> = new Map();
  private mode: SandboxMode;
  private apiKey: string;

  constructor(apiKey: string, mode: SandboxMode = 'per-request') {
    this.apiKey = apiKey;
    this.mode = mode;
    console.log(`SandboxManager initialized in ${mode} mode`);
  }

  async executeCode(userId: string, language: 'python' | 'javascript', code: string): Promise<ExecutionResult> {
    const startTime = Date.now();
    const codePreview = code.length > 100 ? code.substring(0, 100) + '...' : code;
    console.log(`[${new Date().toISOString()}] Executing ${language} code for user ${userId}`);
    console.log(`Code preview: ${codePreview}`);
    
    let sandbox: Sandbox | null = null;
    let shouldClose = true;

    try {
      if (this.mode === 'per-user') {
        console.log(`Using persistent sandbox for user ${userId}`);
        sandbox = await this.getUserSandbox(userId);
        shouldClose = false; // Keep user sandboxes alive
      } else {
        console.log('Creating new per-request sandbox...');
        const createStart = Date.now();
        sandbox = await Sandbox.create({ apiKey: this.apiKey });
        console.log(`Sandbox created in ${Date.now() - createStart}ms`);
      }

      console.log('Running code in sandbox...');
      const execStart = Date.now();
      const execution = await sandbox.runCode(code);
      console.log(`Code execution completed in ${Date.now() - execStart}ms`);
      
      // Combine stdout and stderr logs
      const logs = [
        ...(execution.logs?.stdout || []),
        ...(execution.logs?.stderr || [])
      ];
      
      // Check for errors
      if (execution.error) {
        const errorMsg = execution.error.traceback 
          ? `${execution.error.name}: ${execution.error.value}\n${execution.error.traceback}`
          : `${execution.error.name}: ${execution.error.value}`;
        
        console.error(`[${new Date().toISOString()}] Code execution failed for user ${userId}:`, errorMsg);
        console.log(`Total execution time: ${Date.now() - startTime}ms`);
        
        return {
          success: false,
          error: errorMsg,
          logs
        };
      }

      // Retrieve files from /outputs directory
      const files: Array<{ name: string; content: Buffer; mimeType: string }> = [];
      
      console.log('Checking for output files in /outputs directory...');
      try {
        const outputFiles = await sandbox.files.list('/outputs');
        console.log(`Found ${outputFiles.length} files in /outputs`);
        
        for (const fileInfo of outputFiles) {
          try {
            const fileContent = await sandbox.files.readBytes(fileInfo.path);
            const buffer = Buffer.isBuffer(fileContent) 
              ? fileContent 
              : Buffer.from(fileContent.buffer, fileContent.byteOffset, fileContent.byteLength);
            
            files.push({
              name: fileInfo.name,
              content: buffer,
              mimeType: this.getMimeType(fileInfo.name)
            });
            console.log(`Retrieved file: ${fileInfo.name} (${buffer.length} bytes, ${this.getMimeType(fileInfo.name)})`);
          } catch (err) {
            console.error(`Failed to read file ${fileInfo.path}:`, err);
          }
        }
      } catch (err) {
        // /outputs directory might not exist, that's fine
        console.log('No /outputs directory found (this is normal if no files were created)');
      }

      const totalTime = Date.now() - startTime;
      console.log(`[${new Date().toISOString()}] Code execution successful for user ${userId}`);
      console.log(`Output length: ${execution.text?.length || 0} chars, Logs: ${logs.length} lines, Files: ${files.length}`);
      console.log(`Total execution time: ${totalTime}ms`);

      return {
        success: true,
        output: execution.text || '',
        logs,
        files
      };

    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`[${new Date().toISOString()}] Sandbox execution error for user ${userId}:`, error);
      console.log(`Failed after ${totalTime}ms`);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        logs: []
      };
    } finally {
      if (shouldClose && sandbox) {
        console.log('Cleaning up sandbox...');
        await sandbox.kill().catch((err: unknown) => 
          console.error(`[${new Date().toISOString()}] Failed to kill sandbox:`, err)
        );
        console.log('Sandbox cleanup complete');
      }
    }
  }

  private async getUserSandbox(userId: string): Promise<Sandbox> {
    let sandbox = this.userSandboxes.get(userId);
    
    if (!sandbox) {
      sandbox = await Sandbox.create({ apiKey: this.apiKey });
      this.userSandboxes.set(userId, sandbox);
      console.log(`Created persistent sandbox for user ${userId}`);
    }
    
    return sandbox;
  }

  private getMimeType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes: Record<string, string> = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'pdf': 'application/pdf',
      'json': 'application/json',
      'csv': 'text/csv',
      'txt': 'text/plain',
      'html': 'text/html',
      'xml': 'application/xml'
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }

  async shutdown(): Promise<void> {
    console.log(`Closing ${this.userSandboxes.size} user sandboxes`);
    
    for (const [userId, sandbox] of this.userSandboxes.entries()) {
      try {
        await sandbox.kill();
        console.log(`Killed sandbox for user ${userId}`);
      } catch (err) {
        console.error(`Failed to kill sandbox for user ${userId}:`, err);
      }
    }
    
    this.userSandboxes.clear();
  }
}
