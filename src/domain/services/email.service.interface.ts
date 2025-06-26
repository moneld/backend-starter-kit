export interface EmailData {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

export interface IEmailService {
  sendVerificationEmail(to: string, name: string, token: string): Promise<void>;

  sendWelcomeEmail(to: string, name: string): Promise<void>;

  sendPasswordResetEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<void>;
}
