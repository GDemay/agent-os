import dotenv from 'dotenv';
import { createLogger, transports, format } from 'winston';

dotenv.config();

const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
  ],
});

async function main() {
  logger.info('AgentOS Kernel initializing...');

  if (
    !process.env.NVIDIA_NIM_API_KEY &&
    !process.env.NIM_API_KEY &&
    !process.env.DEEPSEEK_API_KEY &&
    !process.env.OPENCODE_API_KEY
  ) {
    logger.warn('No LLM API key is set in environment variables');
  } else {
    logger.info('LLM configuration detected');
  }

  logger.info('AgentOS Kernel is running');
}

main().catch((error) => {
  logger.error('Fatal error in main process', error);
  process.exit(1);
});
