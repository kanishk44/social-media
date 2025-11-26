import pino from 'pino';
import { env } from './env';

const isDevelopment = env.NODE_ENV === 'development';

// Only use pino-pretty transport in development when it's available
const transport = isDevelopment
  ? (() => {
      try {
        // Check if pino-pretty is available
        require.resolve('pino-pretty');
        return {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        };
      } catch {
        // pino-pretty not available, return undefined
        return undefined;
      }
    })()
  : undefined;

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport,
});
