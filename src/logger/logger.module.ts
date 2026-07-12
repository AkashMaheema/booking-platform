import { Global, Module } from '@nestjs/common';
import { WinstonModule, utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';

@Global()
@Module({
  imports: [
    WinstonModule.forRootAsync({
      useFactory: () => {
        const isProduction = process.env['NODE_ENV'] === 'production';
        const defaultLogLevel = isProduction ? 'info' : 'debug';
        const logLevel = process.env['LOG_LEVEL']?.toLowerCase() ?? defaultLogLevel;

        return {
          level: logLevel,
          transports: [
            new winston.transports.Console({
              format: isProduction
                ? winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.ms(),
                    winston.format.json(),
                  )
                : winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.ms(),
                    nestWinstonModuleUtilities.format.nestLike('BookingPlatform', {
                      colors: true,
                      prettyPrint: true,
                    }),
                  ),
            }),
          ],
        };
      },
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}
