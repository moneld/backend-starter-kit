import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import {
  IEmailService,
  EmailData,
} from '@domain/services/email.service.interface';

@Injectable()
export class EmailService implements IEmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private templates: Map<string, handlebars.TemplateDelegate> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('email.smtp.host'),
      port: this.configService.get<number>('email.smtp.port'),
      secure: this.configService.get<boolean>('email.smtp.secure'),
      auth: {
        user: this.configService.get<string>('email.smtp.auth.user'),
        pass: this.configService.get<string>('email.smtp.auth.pass'),
      },
    });

    this.initializeTemplates();
  }

  async sendVerificationEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    const verificationUrl = `${this.configService.get<string>('email.verificationUrl')}?token=${token}`;

    await this.sendEmail({
      to,
      subject: 'Verify your email address',
      template: 'verification',
      context: {
        name,
        verificationUrl,
      },
    });
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Welcome to our platform!',
      template: 'welcome',
      context: {
        name,
        appUrl:
          this.configService.get<string>('email.appUrl') ||
          'http://localhost:3000',
      },
    });
  }

  async sendPasswordResetEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    const resetUrl = `${this.configService.get<string>('email.passwordResetUrl')}?token=${token}`;

    await this.sendEmail({
      to,
      subject: 'Reset your password',
      template: 'password-reset',
      context: {
        name,
        resetUrl,
      },
    });
  }

  private async sendEmail(data: EmailData): Promise<void> {
    try {
      const template = this.templates.get(data.template);
      if (!template) {
        throw new Error(`Template ${data.template} not found`);
      }

      const html = template(data.context);

      await this.transporter.sendMail({
        from: {
          name: this.configService.get<string>('email.from.name') || 'MyApp',
          address:
            this.configService.get<string>('email.from.address') ||
            'noreply@myapp.com',
        },
        to: data.to,
        subject: data.subject,
        html,
      });

      this.logger.log(`Email sent successfully to ${data.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${data.to}`, error);
      throw error;
    }
  }

  private initializeTemplates(): void {
    // Base template wrapper
    const baseTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            margin: 20px auto;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding-bottom: 30px;
            border-bottom: 1px solid #e0e0e0;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
        }
        .content {
            padding: 30px 0;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #2563eb;
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 500;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #1d4ed8;
        }
        .footer {
            text-align: center;
            padding-top: 30px;
            border-top: 1px solid #e0e0e0;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        {{{content}}}
    </div>
</body>
</html>
    `;

    // Verification email template
    const verificationTemplate = `
<div class="header">
    <div class="logo">MyApp</div>
</div>

<div class="content">
    <h1>Verify your email address</h1>
    <p>Hi {{name}},</p>
    <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
    
    <div style="text-align: center;">
        <a href="{{verificationUrl}}" class="button">Verify Email</a>
    </div>
    
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; background-color: #f4f4f4; padding: 10px; border-radius: 4px;">
        {{verificationUrl}}
    </p>
    
    <p>This link will expire in 24 hours.</p>
    
    <p>If you didn't create an account with us, please ignore this email.</p>
</div>

<div class="footer">
    <p>© 2025 MyApp. All rights reserved.</p>
    <p>This is an automated message, please do not reply to this email.</p>
</div>
    `;

    // Welcome email template
    const welcomeTemplate = `
<div class="header">
    <div class="logo">MyApp</div>
</div>

<div class="content">
    <h1>Welcome to MyApp! 🎉</h1>
    <p>Hi {{name}},</p>
    <p>Your email has been verified successfully! We're excited to have you on board.</p>
    
    <h2>What's next?</h2>
    <ul>
        <li>Complete your profile</li>
        <li>Explore our features</li>
        <li>Connect with other users</li>
    </ul>
    
    <div style="text-align: center;">
        <a href="{{appUrl}}/dashboard" class="button">Go to Dashboard</a>
    </div>
    
    <p>If you have any questions, feel free to reach out to our support team.</p>
</div>

<div class="footer">
    <p>© 2025 MyApp. All rights reserved.</p>
    <p>Need help? Contact us at support@myapp.com</p>
</div>
    `;

    // Password reset template
    const passwordResetTemplate = `
<div class="header">
    <div class="logo">MyApp</div>
</div>

<div class="content">
    <h1>Reset your password</h1>
    <p>Hi {{name}},</p>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    
    <div style="text-align: center;">
        <a href="{{resetUrl}}" class="button">Reset Password</a>
    </div>
    
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; background-color: #f4f4f4; padding: 10px; border-radius: 4px;">
        {{resetUrl}}
    </p>
    
    <p>This link will expire in 1 hour.</p>
    
    <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
</div>

<div class="footer">
    <p>© 2025 MyApp. All rights reserved.</p>
    <p>This is an automated message, please do not reply to this email.</p>
</div>
    `;

    // Compile base template
    const baseCompiled = handlebars.compile(baseTemplate);

    // Compile and register templates
    this.templates.set(
      'verification',
      handlebars.compile(baseCompiled({ content: verificationTemplate })),
    );

    this.templates.set(
      'welcome',
      handlebars.compile(baseCompiled({ content: welcomeTemplate })),
    );

    this.templates.set(
      'password-reset',
      handlebars.compile(baseCompiled({ content: passwordResetTemplate })),
    );

    this.logger.log('Email templates initialized successfully');
  }
}
