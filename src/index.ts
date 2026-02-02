import dotenv from 'dotenv';
import { createLogger, transports, format } from 'winston';

dotenv.config();

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ]
});

async function main() {
  logger.info('AgentOS Kernel initializing...');
  
  if (!process.env.DEEPSEEK_API_KEY) {
    logger.warn('DEEPSEEK_API_KEY is not set in environment variables');
  } else {
    logger.info('DeepSeek configuration detected');
  }

  logger.info('AgentOS Kernel is running');
}

main().catch((error) => {
  logger.error('Fatal error in main process', error);
  process.exit(1);
});
