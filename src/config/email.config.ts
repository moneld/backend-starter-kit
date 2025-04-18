import { registerAs } from '@nestjs/config';

export const emailConfig = registerAs('email', () => ({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  user: process.env.SMTP_USER,
  password: process.env.SMTP_PASSWORD,
  fromEmail: process.env.SMTP_FROM_EMAIL,
  fromName: process.env.SMTP_FROM_NAME,
}));
