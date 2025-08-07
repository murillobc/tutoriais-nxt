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
const emailConfig: EmailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: port,
  secure: port === 465, // Use secure connection for port 465 (SMTPS)
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};

// Debug logging to identify the issue
console.log('Email Configuration Debug:');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_SECURE:', port === 465);
console.log('SMTP_USER:', process.env.SMTP_USER ? 'SET' : 'NOT SET');
console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'SET' : 'NOT SET');
console.log('SMTP_FROM:', process.env.SMTP_FROM);

const transporter = nodemailer.createTransport(emailConfig);

export async function sendVerificationCode(email: string, code: string): Promise<void> {
  try {
    console.log(`Attempting to send verification code to: ${email}`);
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'Portal Nextest <noreply@nextest.com.br>',
      to: email,
      subject: 'Código de Verificação - Portal de Tutoriais Nextest',
      html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0075C5 0%, #01283E 100%);">
        <div style="background: rgba(255, 255, 255, 0.95); border-radius: 20px; padding: 40px; text-align: center;">
          <img src="https://educanextest.com.br/wp-content/uploads/2024/04/Group-13Logo-Horizontal-Educa-SVG-Fix.svg" alt="Educa Nextest Logo" style="max-width: 200px; margin-bottom: 30px;">
          
          <h1 style="color: #01283E; font-size: 28px; margin-bottom: 20px;">Código de Verificação</h1>
          
          <p style="color: #666; font-size: 16px; margin-bottom: 30px;">
            Use o código abaixo para acessar o Portal de Tutoriais Nextest:
          </p>
          
          <div style="background: #f8f9fa; border: 2px solid #e1e5e9; border-radius: 12px; padding: 20px; margin: 30px 0;">
            <div style="font-family: monospace; font-size: 32px; font-weight: bold; color: #0075C5; letter-spacing: 8px;">
              ${code}
            </div>
          </div>
          
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            Este código é válido por 10 minutos.<br>
            Se você não solicitou este código, ignore este email.
          </p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e1e5e9;">
            <p style="color: #666; font-size: 12px;">
              © 2025 Nextest. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification code sent successfully to: ${email}`);
    
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error(`Falha ao enviar email: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}
