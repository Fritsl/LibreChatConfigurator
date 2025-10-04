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
    let sandbox: Sandbox | null = null;
    let shouldClose = true;

    try {
      if (this.mode === 'per-user') {
        sandbox = await this.getUserSandbox(userId);
        shouldClose = false; // Keep user sandboxes alive
      } else {
        sandbox = await Sandbox.create({ apiKey: this.apiKey });
      }

      const execution = await sandbox.runCode(code);
      
      const logs = execution.logs || [];
      
      // Check for errors
      if (execution.error) {
        return {
          success: false,
          error: execution.error,
          logs
        };
      }

      // Retrieve files from /outputs directory
      const files: Array<{ name: string; content: Buffer; mimeType: string }> = [];
      
      try {
        const outputFiles = await sandbox.files.list('/outputs');
        
        for (const fileInfo of outputFiles) {
          try {
            const fileContent = await sandbox.files.read(fileInfo.path);
            const buffer = Buffer.from(fileContent);
            
            files.push({
              name: fileInfo.name,
              content: buffer,
              mimeType: this.getMimeType(fileInfo.name)
            });
          } catch (err) {
            console.error(`Failed to read file ${fileInfo.path}:`, err);
          }
        }
      } catch (err) {
        // /outputs directory might not exist, that's fine
        console.log('No output files found');
      }

      return {
        success: true,
        output: execution.text || '',
        logs,
        files
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        logs: []
      };
    } finally {
      if (shouldClose && sandbox) {
        await sandbox.close().catch((err: unknown) => 
          console.error('Failed to close sandbox:', err)
        );
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
        await sandbox.close();
        console.log(`Closed sandbox for user ${userId}`);
      } catch (err) {
        console.error(`Failed to close sandbox for user ${userId}:`, err);
      }
    }
    
    this.userSandboxes.clear();
  }
}
