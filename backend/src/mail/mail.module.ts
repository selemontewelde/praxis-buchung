import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service.js';

/** SMTP email sending, available app-wide. */
@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
