

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  level: LogLevel;
  component: string;
  message: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const currentLevel: LogLevel = (process.env.AEGIS_LOG_LEVEL?.toUpperCase() as LogLevel) || 'INFO';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatEntry(entry: LogEntry): string {
  return JSON.stringify(entry);
}

function log(level: LogLevel, component: string, message: string, data?: Record<string, unknown>): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    level,
    component,
    message,
    timestamp: new Date().toISOString(),
    ...(data && { data }),
  };

  const formatted = formatEntry(entry);

  switch (level) {
    case 'ERROR':
      console.error(formatted);
      break;
    case 'WARN':
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }
}

export function createLogger(component: string) {
  return {
    debug: (message: string, data?: Record<string, unknown>) => log('DEBUG', component, message, data),
    info: (message: string, data?: Record<string, unknown>) => log('INFO', component, message, data),
    warn: (message: string, data?: Record<string, unknown>) => log('WARN', component, message, data),
    error: (message: string, data?: Record<string, unknown>) => log('ERROR', component, message, data),
  };
}

export type Logger = ReturnType<typeof createLogger>;
