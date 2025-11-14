const isDevelopment = import.meta.env.DEV;

export const logger = {
  warn: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(message, ...args);
    }
    // In production, could send to monitoring service
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(message, ...args);
    // Could send to error tracking service (Sentry, etc.)
  },
  info: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.info(message, ...args);
    }
  }
};
