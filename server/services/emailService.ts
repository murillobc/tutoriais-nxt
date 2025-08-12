import nodemailer from "nodemailer";

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// 🚨 ÂNCORA: EMAIL - Configuração Resend (Baseada no Chatwoot Funcionando)
// Contexto: Configuração idêntica ao Chatwoot que está funcionando perfeitamente
// Cuidado: Usar SMTP_ADDRESS (não SMTP_HOST) e porta 587 como no Chatwoot
// Dependências: Variáveis SMTP_ADDRESS, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM

const port = parseInt(process.env.SMTP_PORT || "587");
const emailConfig: EmailConfig & { tls?: any } = {
  host: process.env.SMTP_ADDRESS || "smtp.resend.com", // Usar SMTP_ADDRESS como no Chatwoot
  port: port,
  secure: false, // Sempre false para porta 587 (como no Chatwoot)
  auth: {
    user: process.env.SMTP_USERNAME || "resend", // Usar SMTP_USERNAME como no Chatwoot
    pass: process.env.SMTP_PASSWORD || "", // Usar SMTP_PASSWORD como no Chatwoot
  },
  // Configuração TLS específica para Resend (igual ao Chatwoot)
  tls: {
    rejectUnauthorized: true,
  },
};

console.log("🔧 Configurando emailService (padrão Chatwoot) com:", {
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  user: emailConfig.auth.user,
  passConfigured: !!emailConfig.auth.pass,
  domain: process.env.SMTP_DOMAIN,
  from: process.env.SMTP_FROM || "Portal Nextest <no-reply@nextest.com.br>",
});

const transporter = nodemailer.createTransport(emailConfig);

// Test email connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.log("❌ Email connection error:", error);
    console.log("🔍 Verificar (configuração Chatwoot):");
    console.log("   - SMTP_ADDRESS:", process.env.SMTP_ADDRESS);
    console.log("   - SMTP_PORT:", process.env.SMTP_PORT);
    console.log("   - SMTP_USERNAME:", process.env.SMTP_USERNAME);
    console.log("   - SMTP_PASSWORD configurado:", !!process.env.SMTP_PASSWORD);
    console.log("   - SMTP_DOMAIN:", process.env.SMTP_DOMAIN);
    console.log("   - SMTP_FROM:", process.env.SMTP_FROM);
  } else {
    console.log("✅ Email server connection successful");
    console.log("📧 Configuração Resend ativa (padrão Chatwoot funcionando)!");
    console.log(
      "🌐 Domínio:",
      process.env.SMTP_DOMAIN || "educanextest.com.br",
    );
  }
});

// Função original - Envio de código de verificação
export async function sendVerificationCode(
  email: string,
  code: string,
): Promise<void> {
  console.log("📧 Enviando código de verificação para:", email);

  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || "Portal Nextest <no-reply@nextest.com.br>",
      to: email,
      subject: "Código de Verificação - Portal de Tutoriais Nextest",
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
      `,
      text: `Código de Verificação: ${code}\n\nUse este código para acessar o Portal de Tutoriais Nextest.\n\nEste código é válido por 10 minutos.`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email enviado com sucesso via Resend!");
    console.log("📧 Message ID:", info.messageId);
    console.log("📧 Response:", info.response);
  } catch (error) {
    console.error(
      "❌ Falha no envio de email via Resend:",
      error instanceof Error ? error.message : "Unknown error",
    );

    // Log detalhado para debug (padrão Chatwoot)
    if (error instanceof Error && error.message.includes("ETIMEDOUT")) {
      console.log("🔍 Erro de timeout - verificar (configuração Chatwoot):");
      console.log("   1. SMTP_ADDRESS=smtp.resend.com");
      console.log("   2. SMTP_PORT=587");
      console.log("   3. API Key válida no SMTP_PASSWORD");
      console.log("   4. Domínio educanextest.com.br verificado no Resend");
      console.log("   5. SMTP_FROM com domínio verificado");
    }

    throw new Error(
      `Falha ao enviar email: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    );
  }
}

// Função para enviar email de boas-vindas para novos usuários criados pelo admin
export async function sendWelcomeEmail(email: string, name: string, temporaryPassword: string): Promise<boolean> {
  console.log("🎉 Enviando email de boas-vindas para:", email);
  
  try {
    const resetLink = `https://educanextest.com.br/forgot-password`;
    
    const mailOptions = {
      from: process.env.SMTP_FROM || "Portal Nextest <no-reply@educanextest.com.br>",
      to: email,
      subject: "Bem-vindo ao Portal Nextest - Sua conta foi criada!",
      html: `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #0075C5 0%, #1AA3F7 100%); color: white; padding: 30px; text-align: center; }
              .content { padding: 30px; }
              .button { display: inline-block; background: linear-gradient(135deg, #0075C5 0%, #1AA3F7 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }
              .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
              .credentials { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0075C5; }
              .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0; color: #856404; }
              .password-box { background-color: #e8f4fd; border: 2px solid #0075C5; border-radius: 8px; padding: 15px; margin: 15px 0; text-align: center; }
              .password-text { font-family: monospace; font-size: 18px; font-weight: bold; color: #0075C5; letter-spacing: 2px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🎓 Bem-vindo ao Portal Nextest!</h1>
                  <p>Sua conta foi criada com sucesso</p>
              </div>
              
              <div class="content">
                  <h2>Olá, ${name}!</h2>
                  
                  <p>Sua conta no Portal Nextest foi criada por um administrador. Você agora tem acesso ao nosso sistema de gerenciamento de tutoriais.</p>
                  
                  <div class="credentials">
                      <h3>📧 Suas credenciais de acesso:</h3>
                      <p><strong>Email:</strong> ${email}</p>
                      <p><strong>Senha temporária:</strong></p>
                      <div class="password-box">
                          <div class="password-text">${temporaryPassword}</div>
                      </div>
                  </div>
                  
                  <div class="warning">
                      <h4>⚠️ Importante - Segurança da Conta</h4>
                      <p>Por motivos de segurança, <strong>recomendamos fortemente</strong> que você altere sua senha temporária imediatamente após o primeiro login.</p>
                  </div>
                  
                  <h3>🚀 Próximos passos:</h3>
                  <ol>
                      <li>Acesse o portal em: <a href="https://educanextest.com.br" style="color: #0075C5;">educanextest.com.br</a></li>
                      <li>Faça login com suas credenciais acima</li>
                      <li><strong>Altere sua senha temporária</strong> nas configurações da conta</li>
                      <li>Explore o sistema de tutoriais disponível</li>
                  </ol>
                  
                  <div style="text-align: center; margin: 30px 0;">
                      <a href="https://educanextest.com.br" class="button">🚪 Acessar Portal Nextest</a>
                  </div>
                  
                  <p style="color: #666; font-size: 14px;">
                      <strong>Dica:</strong> Se preferir, você também pode usar a opção "Esqueci minha senha" na tela de login para definir uma nova senha.
                  </p>
              </div>
              
              <div class="footer">
                  <p>Este email foi enviado automaticamente pelo Portal Nextest</p>
                  <p>Se você não solicitou esta conta, entre em contato com o administrador</p>
                  <p>&copy; 2025 Nextest - Portal de Tutoriais</p>
              </div>
          </div>
      </body>
      </html>
      `,
      text: `
Bem-vindo ao Portal Nextest!

Olá, ${name}!

Sua conta no Portal Nextest foi criada por um administrador.

Credenciais de acesso:
- Email: ${email}
- Senha temporária: ${temporaryPassword}

IMPORTANTE: Por segurança, altere sua senha temporária após o primeiro login.

Próximos passos:
1. Acesse: https://educanextest.com.br
2. Faça login com suas credenciais
3. Altere sua senha temporária
4. Explore o sistema de tutoriais

Portal Nextest - Sistema de Tutoriais
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email de boas-vindas enviado com sucesso!");
    console.log("📧 Message ID:", info.messageId);
    console.log("📧 Response:", info.response);
    return true;
  } catch (error) {
    console.error(
      "❌ Falha no envio de email de boas-vindas:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return false;
  }
}

// Função nova - Envio de código de redefinição de senha (SUA MELHORIA V2)
export async function sendPasswordResetCode(
  email: string,
  code: string,
): Promise<void> {
  console.log("🔑 Enviando código de redefinição de senha para:", email);

  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || "Portal Nextest <no-reply@nextest.com.br>",
      to: email,
      subject: "Redefinição de Senha - Portal de Tutoriais Nextest",
      html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0075C5 0%, #01283E 100%);">
        <div style="background: rgba(255, 255, 255, 0.95); border-radius: 20px; padding: 40px; text-align: center;">
          <img src="https://educanextest.com.br/wp-content/uploads/2024/04/Group-13Logo-Horizontal-Educa-SVG-Fix.svg" alt="Educa Nextest Logo" style="max-width: 200px; margin-bottom: 30px;">

          <h1 style="color: #01283E; font-size: 28px; margin-bottom: 20px;">🔑 Redefinição de Senha</h1>

          <p style="color: #666; font-size: 16px; margin-bottom: 30px;">
            Use o código abaixo para redefinir sua senha no Portal de Tutoriais Nextest:
          </p>

          <div style="background: #f8f9fa; border: 2px solid #e1e5e9; border-radius: 12px; padding: 20px; margin: 30px 0;">
            <div style="font-family: monospace; font-size: 32px; font-weight: bold; color: #0075C5; letter-spacing: 8px;">
              ${code}
            </div>
          </div>

          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            Este código é válido por 10 minutos.<br>
            Se você não solicitou a redefinição de senha, ignore este email.
          </p>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e1e5e9;">
            <p style="color: #666; font-size: 12px;">
              © 2025 Nextest. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
      `,
      text: `Código de Redefinição de Senha: ${code}\n\nUse este código para redefinir sua senha no Portal de Tutoriais Nextest.\n\nEste código é válido por 10 minutos.`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email de redefinição enviado com sucesso via Resend!");
    console.log("📧 Message ID:", info.messageId);
    console.log("📧 Response:", info.response);
  } catch (error) {
    console.error(
      "❌ Falha no envio de email de redefinição via Resend:",
      error instanceof Error ? error.message : "Unknown error",
    );

    // Log detalhado para debug (padrão Chatwoot)
    if (error instanceof Error && error.message.includes("ETIMEDOUT")) {
      console.log("🔍 Erro de timeout - verificar (configuração Chatwoot):");
      console.log("   1. SMTP_ADDRESS=smtp.resend.com");
      console.log("   2. SMTP_PORT=587");
      console.log("   3. API Key válida no SMTP_PASSWORD");
      console.log("   4. Domínio educanextest.com.br verificado no Resend");
      console.log("   5. SMTP_FROM com domínio verificado");
    }

    throw new Error(
      `Falha ao enviar email de redefinição: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    );
  }
}
