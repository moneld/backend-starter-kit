import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
  from: {
    name: process.env.EMAIL_FROM_NAME || 'MyApp',
    address: process.env.EMAIL_FROM_ADDRESS || 'noreply@myapp.com',
  },
  verificationUrl:
    process.env.EMAIL_VERIFICATION_URL ||
    'http://localhost:3000/auth/verify-email',
  passwordResetUrl:
    process.env.PASSWORD_RESET_URL ||
    'http://localhost:3000/auth/reset-password',
}));
