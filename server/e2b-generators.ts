import { promises as fs } from 'fs';
import path from 'path';

// =============================================================================
// E2B Proxy Service File Generators
// =============================================================================

export function generateE2BOpenAPISchema(config: any): string {
  const proxyUrl = config.e2bProxyPort ? `http://e2b-proxy:${config.e2bProxyPort}` : 'http://e2b-proxy:3001';
  
  return `openapi: 3.0.0
info:
  title: E2B Code Execution
  description: Execute Python/JavaScript code in isolated sandboxes. Generated files are saved and accessible via HTTP URLs.
  version: 1.0.0
servers:
  - url: ${proxyUrl}
    description: E2B Proxy Service
paths:
  /execute:
    post:
      operationId: e2b_execute_code
      summary: Execute Python or JavaScript code
      description: |
        Executes code in an isolated E2B sandbox and returns text output with URLs to any generated files.
        Files saved to /outputs directory in the sandbox are automatically stored and made accessible via HTTP.
        
        IMPORTANT: To generate images/files, save them to /outputs directory:
        - Python: plt.savefig('/outputs/chart.png')
        - JavaScript: fs.writeFileSync('/outputs/data.json', content)
        
        The response will include HTTP URLs to access the generated files.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - code
                - userId
              properties:
                code:
                  type: string
                  description: Python or JavaScript code to execute. Save files to /outputs to include them in the response.
                  example: |
                    import matplotlib.pyplot as plt
                    import numpy as np
                    
                    x = np.linspace(0, 10, 100)
                    y = np.sin(x)
                    
                    plt.figure(figsize=(10, 6))
                    plt.plot(x, y)
                    plt.title('Sine Wave')
                    plt.xlabel('X')
                    plt.ylabel('sin(X)')
                    plt.grid(True)
                    plt.savefig('/outputs/sine_wave.png')
                language:
                  type: string
                  enum: [python, javascript]
                  default: python
                  description: Programming language
                userId:
                  type: string
                  description: User ID for sandbox isolation and file access control
      responses:
        '200':
          description: Code executed successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    description: Whether execution succeeded
                  output:
                    type: string
                    description: Text output including stdout, logs, and markdown-formatted image links
                    example: |
                      Chart created successfully!
                      
                      ![sine_wave.png](http://e2b-proxy:3001/files/abc123?userId=user-id)
                  error:
                    type: string
                    description: Error message if execution failed
        '400':
          description: Invalid request
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  error:
                    type: string
        '500':
          description: Server error
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  error:
                    type: string
`;
}

export async function generateE2BProxyPackageJson(): Promise<string> {
  try {
    return await fs.readFile(path.join(process.cwd(), 'proxy-service/package.json'), 'utf8');
  } catch {
    return JSON.stringify({
      name: "e2b-proxy-service",
      version: "1.0.0",
      description: "E2B Code Execution Proxy for LibreChat",
      main: "dist/index.js",
      scripts: {
        dev: "tsx watch src/index.ts",
        build: "tsc",
        start: "node dist/index.js"
      },
      dependencies: {
        "@e2b/code-interpreter": "^2.0.0",
        express: "^4.19.2",
        cors: "^2.8.5",
        nanoid: "^5.0.7",
        "prom-client": "^15.1.3"
      },
      devDependencies: {
        "@types/express": "^4.17.21",
        "@types/cors": "^2.8.17",
        "@types/node": "^20.12.12",
        tsx: "^4.11.0",
        typescript: "^5.4.5"
      }
    }, null, 2);
  }
}

export async function generateE2BProxyTsConfig(): Promise<string> {
  try {
    return await fs.readFile(path.join(process.cwd(), 'proxy-service/tsconfig.json'), 'utf8');
  } catch {
    return JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "commonjs",
        lib: ["ES2022"],
        outDir: "./dist",
        rootDir: "./src",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        moduleResolution: "node"
      },
      include: ["src/**/*"],
      exclude: ["node_modules", "dist"]
    }, null, 2);
  }
}

export async function generateE2BProxyDockerfile(): Promise<string> {
  try {
    return await fs.readFile(path.join(process.cwd(), 'proxy-service/Dockerfile'), 'utf8');
  } catch {
    return `# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm install

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Create storage directory
RUN mkdir -p /tmp/e2b-files

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Run the service
CMD ["node", "dist/index.js"]
`;
  }
}

export function generateE2BProxyDockerIgnore(): string {
  return `node_modules
dist
*.log
.env
.DS_Store
`;
}

export async function generateE2BProxyReadme(config: any): Promise<string> {
  try {
    return await fs.readFile(path.join(process.cwd(), 'proxy-service/README.md'), 'utf8');
  } catch {
    return `# E2B Code Execution Proxy Service

See main README.md for setup instructions.

Generated with TTL: ${config.e2bFileTTLDays || 30} days, Max file size: ${config.e2bMaxFileSize || 50}MB
`;
  }
}

export async function generateE2BProxyIndex(): Promise<string> {
  return await fs.readFile(path.join(process.cwd(), 'proxy-service/src/index.ts'), 'utf8');
}

export async function generateE2BProxyFileStorage(): Promise<string> {
  return await fs.readFile(path.join(process.cwd(), 'proxy-service/src/file-storage.ts'), 'utf8');
}

export async function generateE2BProxySandboxManager(): Promise<string> {
  return await fs.readFile(path.join(process.cwd(), 'proxy-service/src/sandbox-manager.ts'), 'utf8');
}

export async function generateE2BProxyMetrics(): Promise<string> {
  return await fs.readFile(path.join(process.cwd(), 'proxy-service/src/metrics.ts'), 'utf8');
}
