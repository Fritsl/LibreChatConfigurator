import { Registry, Counter, Histogram, Gauge } from 'prom-client';

export class MetricsCollector {
  public register: Registry;
  
  private executionCounter: Counter;
  private executionDuration: Histogram;
  private executionErrors: Counter;
  private activeFiles: Gauge;
  private fileSizeBytes: Histogram;

  constructor() {
    this.register = new Registry();

    this.executionCounter = new Counter({
      name: 'e2b_executions_total',
      help: 'Total number of code executions',
      labelNames: ['language', 'status'],
      registers: [this.register]
    });

    this.executionDuration = new Histogram({
      name: 'e2b_execution_duration_seconds',
      help: 'Code execution duration in seconds',
      labelNames: ['language'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
      registers: [this.register]
    });

    this.executionErrors = new Counter({
      name: 'e2b_execution_errors_total',
      help: 'Total number of execution errors',
      labelNames: ['error_type'],
      registers: [this.register]
    });

    this.activeFiles = new Gauge({
      name: 'e2b_active_files',
      help: 'Number of files currently stored',
      registers: [this.register]
    });

    this.fileSizeBytes = new Histogram({
      name: 'e2b_file_size_bytes',
      help: 'File size distribution',
      buckets: [1024, 10240, 102400, 1048576, 10485760, 52428800], // 1KB to 50MB
      registers: [this.register]
    });
  }

  recordExecution(language: string, status: 'success' | 'error', duration: number) {
    this.executionCounter.inc({ language, status });
    this.executionDuration.observe({ language }, duration);
  }

  recordError(errorType: string) {
    this.executionErrors.inc({ error_type: errorType });
  }

  updateFileCount(count: number) {
    this.activeFiles.set(count);
  }

  recordFileSize(bytes: number) {
    this.fileSizeBytes.observe(bytes);
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }
}
