import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

const port = parseInt(process.env.SMTP_PORT || '587');
const emailConfig = {
  host: process.env.SMTP_ADDRESS || 'smtp.resend.com',
  port: port,
  secure: port === 465, // Use secure connection for port 465 (SMTPS)
  auth: {
    user: process.env.SMTP_USERNAME || 'resend',
    pass: process.env.SMTP_PASSWORD || '',
  },
  // Resend SMTP configuration
  tls: {
    rejectUnauthorized: true,
  }
} as any;

// Email service is configured

const transporter = nodemailer.createTransport(emailConfig);

// Test email connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Email connection error:', error);
  } else {
    console.log('✅ Email server connection successful');
  }
});

export async function sendVerificationCode(email: string, code: string, type: 'verification' | 'reset' = 'verification'): Promise<void> {
  console.log('📧 Tentando enviar email para:', email);
  console.log('🔧 Config SMTP:', {
    host: process.env.SMTP_ADDRESS || 'smtp.resend.com',
    port: process.env.SMTP_PORT || '587',
    user: process.env.SMTP_USERNAME || 'resend',
    from: process.env.SMTP_FROM || 'Portal Nextest <no-reply@nextest.com.br>'
  });
  
  try {
    const isResetPassword = type === 'reset';
    const subject = isResetPassword 
      ? 'Redefinição de Senha - Portal de Tutoriais Nextest'
      : 'Código de Verificação - Portal de Tutoriais Nextest';
    
    const title = isResetPassword ? 'Redefinir Senha' : 'Código de Verificação';
    const description = isResetPassword
      ? 'Use o código abaixo para redefinir sua senha no Portal de Tutoriais Nextest:'
      : 'Use o código abaixo para acessar o Portal de Tutoriais Nextest:';
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'Portal Nextest <no-reply@nextest.com.br>',
      to: email,
      subject,
      html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0075C5 0%, #01283E 100%);">
        <div style="background: rgba(255, 255, 255, 0.95); border-radius: 20px; padding: 40px; text-align: center;">
          <img src="https://educanextest.com.br/wp-content/uploads/2024/04/Group-13Logo-Horizontal-Educa-SVG-Fix.svg" alt="Educa Nextest Logo" style="max-width: 200px; margin-bottom: 30px;">
          
          <h1 style="color: #01283E; font-size: 28px; margin-bottom: 20px;">${title}</h1>
          
          <p style="color: #666; font-size: 16px; margin-bottom: 30px;">
            ${description}
          </p>
          
          <div style="background: #f8f9fa; border: 2px solid #e1e5e9; border-radius: 12px; padding: 20px; margin: 30px 0;">
            <div style="font-family: monospace; font-size: 32px; font-weight: bold; color: #0075C5; letter-spacing: 8px;">
              ${code}
            </div>
          </div>
          
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            Este código é válido por 10 minutos.<br>
            Se você não solicitou este ${isResetPassword ? 'reset de senha' : 'código'}, ignore este email.
          </p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e1e5e9;">
            <p style="color: #666; font-size: 12px;">
              © 2025 Nextest. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
      `,
      text: `${title}: ${code}\n\n${description}\n\nEste código é válido por 10 minutos.`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado com sucesso!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📧 Response:', info.response);
    
  } catch (error) {
    console.error('Email sending failed:', error instanceof Error ? error.message : 'Unknown error');
    throw new Error(`Falha ao enviar email: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}
