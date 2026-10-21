import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { buildLoggerOptions } from './logging.options.js';

/**
 * Wires nestjs-pino as the application logger. It replaces Nest's default
 * console logger (see main.ts `useLogger`), so every existing `Logger` call in
 * the services now emits structured JSON through pino.
 *
 * `genReqId` gives each HTTP request a correlation id — reused from an inbound
 * `x-request-id` if a proxy set one, otherwise freshly generated — and echoes
 * it back on the response, so all log lines of one request share an id and a
 * client can be told which request to quote when reporting a problem.
 */
@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        ...buildLoggerOptions(process.env.NODE_ENV),
        genReqId: (req, res) => {
          const header = req.headers['x-request-id'];
          const id = (Array.isArray(header) ? header[0] : header) ?? randomUUID();
          res.setHeader('x-request-id', id);
          return id;
        },
      },
    }),
  ],
})
export class AppLoggerModule {}
