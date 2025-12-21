/**
 * Structured Logger
 *
 * Provides consistent, structured logging throughout the application.
 * In production, outputs JSON for log aggregation (Datadog, CloudWatch, etc.)
 * In development, outputs human-readable format.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: LogContext
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const MIN_LOG_LEVEL = (process.env.LOG_LEVEL as LogLevel) || 'debug'
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

/**
 * Format log entry for output
 */
function formatLog(entry: LogEntry): string {
  if (IS_PRODUCTION) {
    // JSON format for log aggregation
    return JSON.stringify(entry)
  }

  // Human-readable format for development
  const timestamp = new Date(entry.timestamp).toLocaleTimeString()
  const level = entry.level.toUpperCase().padEnd(5)
  const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : ''

  return `[${timestamp}] ${level} ${entry.message}${contextStr}`
}

/**
 * Write log entry to appropriate output
 */
function writeLog(entry: LogEntry): void {
  if (LOG_LEVELS[entry.level] < LOG_LEVELS[MIN_LOG_LEVEL]) {
    return
  }

  const output = formatLog(entry)

  switch (entry.level) {
    case 'error':
      console.error(output)
      break
    case 'warn':
      console.warn(output)
      break
    default:
      console.log(output)
  }
}

/**
 * Create a log entry
 */
function createLogEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  }
}

/**
 * Logger interface
 */
export const logger = {
  debug(message: string, context?: LogContext): void {
    writeLog(createLogEntry('debug', message, context))
  },

  info(message: string, context?: LogContext): void {
    writeLog(createLogEntry('info', message, context))
  },

  warn(message: string, context?: LogContext): void {
    writeLog(createLogEntry('warn', message, context))
  },

  error(message: string, context?: LogContext): void {
    writeLog(createLogEntry('error', message, context))
  },

  /**
   * Create a child logger with preset context
   */
  child(baseContext: LogContext) {
    return {
      debug: (message: string, context?: LogContext) => logger.debug(message, { ...baseContext, ...context }),
      info: (message: string, context?: LogContext) => logger.info(message, { ...baseContext, ...context }),
      warn: (message: string, context?: LogContext) => logger.warn(message, { ...baseContext, ...context }),
      error: (message: string, context?: LogContext) => logger.error(message, { ...baseContext, ...context }),
    }
  },

  /**
   * Log and measure async operation duration
   */
  async time<T>(name: string, fn: () => Promise<T>, context?: LogContext): Promise<T> {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = Math.round(performance.now() - start)
      logger.info(`${name} completed`, { ...context, durationMs: duration })
      return result
    } catch (error) {
      const duration = Math.round(performance.now() - start)
      logger.error(`${name} failed`, {
        ...context,
        durationMs: duration,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  },
}

export type Logger = typeof logger
