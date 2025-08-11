import type { Express, Request } from "express";
import type session from "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { sendPasswordResetCode } from "./services/emailService";
import bcrypt from "bcryptjs";
import { z } from "zod";

// API Key para autenticação dos endpoints de consulta
const API_KEY = "nxt_api_2025_b8f4c9e1a7d3f6h9j2k5m8p1q4r7s0t3v6w9z2a5c8e1f4g7h0i3j6k9l2m5n8o1p4r7s0t3u6v9w2x5y8z1";

// Middleware de autenticação por API Key
function requireApiKey(req: any, res: any, next: any) {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey || apiKey !== API_KEY) {
    console.log('❌ API Key inválida ou ausente:', apiKey ? 'key fornecida mas incorreta' : 'nenhuma key fornecida');
    return res.status(401).json({ 
      error: "API Key inválida ou ausente",
      message: "Forneça uma API Key válida no header 'x-api-key' ou 'Authorization: Bearer <key>'"
    });
  }
  
  console.log('✅ API Key válida - acesso autorizado');
  next();
}

const loginSchema = z.object({
  email: z.string().email().refine(email => email.endsWith('@nextest.com.br'), {
    message: 'Email deve ser do domínio @nextest.com.br'
  }),
  password: z.string().min(1, "Senha é obrigatória")
});

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6)
});

const forgotPasswordSchema = z.object({
  email: z.string().email().refine(email => email.endsWith('@nextest.com.br'), {
    message: 'Email deve ser do domínio @nextest.com.br'
  })
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"]
});

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().refine(email => email.endsWith('@nextest.com.br'), {
    message: 'Email deve ser do domínio @nextest.com.br'
  }),
  department: z.string().min(1),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"]
});

const tutorialReleaseSchema = z.object({
  clientName: z.string().min(1),
  clientCpf: z.string().min(11),
  clientEmail: z.string().email(),
  clientPhone: z.string().optional(),
  companyName: z.string().min(1),
  companyDocument: z.string().min(14, "CNPJ é obrigatório"),
  companyRole: z.string().min(1),
  tutorialIds: z.array(z.string()).min(1)
});

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado. Crie uma conta primeiro." });
      }

      if (!user.password) {
        return res.status(400).json({ message: "Usuário não possui senha cadastrada." });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Senha incorreta" });
      }

      // Set session for login
      req.session = req.session || {};
      (req.session as any).userId = user.id;
      
      res.json({ user, message: "Login realizado com sucesso" });
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Erro no login" });
    }
  });



  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Usuário já existe" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const user = await storage.createUser({
        name: userData.name,
        email: userData.email,
        department: userData.department,
        password: hashedPassword
      });
      res.json({ user });
    } catch (error) {
      console.error('Register error:', error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Erro no cadastro" });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      
      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await storage.createVerificationCode({
        email,
        code,
        expiresAt
      });

      try {
        await sendPasswordResetCode(email, code);
        res.json({ message: "Código de redefinição de senha enviado" });
      } catch (emailError) {
        console.error('Email sending failed, but code created:', emailError);
        res.json({ 
          message: "Código de redefinição gerado. Verifique o console para o código (email não enviado)",
          debugCode: code // For debugging only - remove in production
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao solicitar redefinição de senha" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, code, newPassword } = resetPasswordSchema.parse(req.body);
      
      const verificationCode = await storage.getValidVerificationCode(email, code);
      if (!verificationCode) {
        return res.status(400).json({ message: "Código inválido ou expirado" });
      }

      await storage.markVerificationCodeAsUsed(verificationCode.id);
      
      // Update user password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      await storage.updateUserPassword(user.id, hashedPassword);

      res.json({ message: "Senha redefinida com sucesso" });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao redefinir senha" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
        }
      });
    }
    res.json({ message: "Logout realizado com sucesso" });
  });

  // Job Roles routes
  app.get("/api/job-roles", async (req, res) => {
    try {
      const { type } = req.query;
      
      if (type && (type === 'department' || type === 'client_role')) {
        const roles = await storage.getJobRolesByType(type as 'department' | 'client_role');
        res.json(roles);
      } else {
        const roles = await storage.getAllJobRoles();
        res.json(roles);
      }
    } catch (error) {
      console.error('Error getting job roles:', error);
      res.status(500).json({ message: "Erro ao buscar cargos" });
    }
  });

  app.post("/api/job-roles", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ message: "Não autorizado" });
      }
      
      const roleData = req.body;
      const role = await storage.createJobRole(roleData);
      res.status(201).json(role);
    } catch (error) {
      console.error('Error creating job role:', error);
      res.status(500).json({ message: "Erro ao criar cargo" });
    }
  });

  app.put("/api/job-roles/:id", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ message: "Não autorizado" });
      }
      
      const { id } = req.params;
      const roleData = req.body;
      await storage.updateJobRole(id, roleData);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating job role:', error);
      res.status(500).json({ message: "Erro ao atualizar cargo" });
    }
  });

  app.delete("/api/job-roles/:id", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ message: "Não autorizado" });
      }
      
      const { id } = req.params;
      await storage.deleteJobRole(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting job role:', error);
      res.status(500).json({ message: "Erro ao excluir cargo" });
    }
  });

  // Tutorials routes
  app.get("/api/tutorials", async (req, res) => {
    try {
      const tutorials = await storage.getAllTutorials();
      res.json(tutorials);
    } catch (error) {
      console.error('Get tutorials error:', error);
      res.status(500).json({ message: "Erro ao buscar tutoriais" });
    }
  });

  // Tutorial releases routes
  app.post("/api/tutorial-releases", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ message: "Não autorizado" });
      }

      const releaseData = tutorialReleaseSchema.parse(req.body);
      const release = await storage.createTutorialRelease({
        ...releaseData,
        userId: (req.session as any).userId
      });

      // Send webhook after successful creation
      try {
        await sendTutorialReleaseWebhook(release, releaseData);
      } catch (webhookError) {
        console.error('Webhook sending failed:', webhookError);
        // Continue execution even if webhook fails
      }

      res.json(release);
    } catch (error) {
      console.error('Create release error:', error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao criar liberação" });
    }
  });

  app.get("/api/tutorial-releases", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ message: "Não autorizado" });
      }

      const releases = await storage.getAllTutorialReleases();
      res.json(releases);
    } catch (error) {
      console.error('Get releases error:', error);
      res.status(500).json({ message: "Erro ao buscar liberações" });
    }
  });

  // Webhook for external integrations (maintaining original endpoint)
  app.post("/webhook/cadastro", async (req, res) => {
    try {
      // This endpoint can be used by external systems
      const releaseData = tutorialReleaseSchema.parse(req.body);
      
      // For webhook, we'll need to identify the user somehow
      // You might want to add API key validation here
      
      res.json({ message: "Webhook recebido com sucesso", data: releaseData });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Erro no webhook" });
    }
  });

  // Get current user
  // Status tracking API for external confirmations (requer API Key)
  app.post("/api/tutorial-releases/:id/status", requireApiKey, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, message } = req.body;
      
      if (!['pending', 'success', 'failed'].includes(status)) {
        return res.status(400).json({ message: "Status inválido. Use: pending, success, failed" });
      }

      await storage.updateTutorialReleaseStatus(id, status);
      
      console.log(`Tutorial release ${id} status updated to: ${status}`, message ? `- ${message}` : '');
      
      res.json({ message: "Status atualizado com sucesso", releaseId: id, status });
    } catch (error) {
      console.error('Update status error:', error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Erro ao atualizar status" });
    }
  });

  // API: Consultar tutorial releases por status (requer API Key)
  app.get("/api/tutorial-releases/status/:status", requireApiKey, async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      
      const { status } = req.params;
      
      if (!['pending', 'success', 'failed'].includes(status)) {
        return res.status(400).json({ message: "Status inválido. Use: pending, success, failed" });
      }

      const releases = await storage.getTutorialReleasesByStatus(status);
      
      console.log(`API consulta tutorial releases com status: ${status} - encontrados: ${releases.length}`);
      
      res.json({ 
        status: status,
        count: releases.length,
        releases: releases 
      });
    } catch (error) {
      console.error('Get releases by status error:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Erro ao buscar tutorial releases" });
    }
  });

  // API: Consultar apenas tutoriais pendentes (endpoint específico para n8n - requer API Key)
  app.get("/api/tutorial-releases/pending", requireApiKey, async (req, res) => {
    try {
      // Forçar content-type JSON
      res.setHeader('Content-Type', 'application/json');
      
      const releases = await storage.getTutorialReleasesByStatus('pending');
      
      console.log(`API consulta tutoriais pendentes - encontrados: ${releases.length}`);
      
      res.json({ 
        count: releases.length,
        pending_releases: releases.map(release => ({
          id: release.id,
          client_name: release.clientName,
          client_email: release.clientEmail,
          client_company: release.companyName,
          created_at: release.createdAt,
          status: release.status
        }))
      });
    } catch (error) {
      console.error('Get pending releases error:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Erro ao buscar tutoriais pendentes" });
    }
  });

  // API alternativa sem /api no path (para compatibilidade com diferentes ferramentas)
  // NOTA: Esta rota pode conflitar com o Vite middleware em desenvolvimento
  // Use preferencialmente a rota com /api
  app.get("/tutorial-releases/pending", requireApiKey, async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      
      const releases = await storage.getTutorialReleasesByStatus('pending');
      
      console.log(`🔄 API alternativa consulta tutoriais pendentes - encontrados: ${releases.length}`);
      
      res.json({ 
        count: releases.length,
        pending_releases: releases.map(release => ({
          id: release.id,
          client_name: release.clientName,
          client_email: release.clientEmail,
          client_company: release.companyName,
          created_at: release.createdAt,
          status: release.status
        }))
      });
    } catch (error) {
      console.error('Get pending releases error (alt):', error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Erro ao buscar tutoriais pendentes" });
    }
  });

  // API: Estatísticas de status (requer API Key)
  app.get("/api/tutorial-releases/stats", requireApiKey, async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      
      const stats = await storage.getTutorialReleaseStats();
      
      console.log('API consulta estatísticas de tutorial releases');
      
      res.json(stats);
    } catch (error) {
      console.error('Get release stats error:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Erro ao buscar estatísticas" });
    }
  });

  // Endpoint para gerar relatórios
  app.get("/api/reports/tutorial-releases", async (req, res) => {
    try {
      if (!(req.session as any)?.userId) {
        return res.status(401).json({ message: "Não autorizado" });
      }

      const { status, format = 'json' } = req.query;
      
      const filters = status ? { status } : {};
      const releases = await storage.getTutorialReleasesForReport(filters);
      
      if (format === 'json') {
        res.json(releases);
      } else {
        // Para outros formatos, retornar dados para processamento no frontend
        res.json({ data: releases, format });
      }
    } catch (error) {
      console.error('Report generation error:', error);
      res.status(500).json({ message: "Erro ao gerar relatório" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Não autorizado" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      res.json({ user });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: "Erro ao buscar usuário" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Webhook function to send tutorial release data
async function sendTutorialReleaseWebhook(release: any, releaseData: any) {
  const webhookUrl = "https://wfapi.automai.com.br/webhook/cadastro/cademi";
  
  // Get tutorial details for the selected tutorials
  const tutorials = await storage.getTutorialsByIds(releaseData.tutorialIds);
  
  // Prepare webhook payload - this is a generic structure, please provide the exact format
  const webhookPayload = {
    id: release.id,
    client: {
      name: releaseData.clientName,
      cpf: releaseData.clientCpf,
      email: releaseData.clientEmail,
      phone: releaseData.clientPhone || null,
      company: {
        name: releaseData.companyName,
        document: releaseData.companyDocument,
        role: releaseData.companyRole
      }
    },
    tutorials: tutorials.map((tutorial: any) => ({
      id: tutorial.id,
      name: tutorial.name,
      description: tutorial.description,
      tag: tutorial.tag,
      idCademi: tutorial.idCademi
    })),
    createdAt: release.createdAt,
    status: "pending"
  };

  console.log('Sending webhook payload:', JSON.stringify(webhookPayload, null, 2));
  
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(webhookPayload)
  });

  if (!response.ok) {
    throw new Error(`Webhook failed with status: ${response.status}`);
  }

  const responseData = await response.text();
  console.log('Webhook response:', responseData);
  
  return responseData;
}
