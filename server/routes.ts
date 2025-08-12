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

// Middleware para verificar se o usuário é administrador
const requireAdmin = async (req: any, res: any, next: any) => {
  const userId = (req.session as any)?.userId;
  
  if (!userId) {
    return res.status(401).json({ message: "Não autorizado" });
  }

  const user = await storage.getUser(userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: "Acesso negado - Privilégios de administrador necessários" });
  }

  req.user = user; // Adicionar usuário ao request para uso posterior
  next();
};

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
  confirmPassword: z.string(),
  role: z.enum(['user', 'admin']).optional()
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

// Middleware de autenticação de sessão
function requireAuth(req: Request, res: Response, next: any) {
  if ((req.session as any)?.userId) {
    next();
  } else {
    res.status(401).json({ message: "Não autorizado. Faça login primeiro." });
  }
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
          message: "Código de redefinição de senha enviado. Verifique seu email.",
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
  app.post("/api/tutorial-releases", requireAuth, async (req, res) => {
    try {
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

  app.get("/api/tutorial-releases", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const releases = await storage.getTutorialReleasesByUser(userId);
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

  // Endpoint para cadastro em lote de liberações de tutorial
  app.post("/api/tutorial-releases/bulk", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { releases } = req.body;

      if (!Array.isArray(releases) || releases.length === 0) {
        return res.status(400).json({ message: "Lista de liberações é obrigatória" });
      }

      const results = [];
      const errors = [];

      for (let i = 0; i < releases.length; i++) {
        try {
          const releaseData = tutorialReleaseSchema.parse(releases[i]);
          const release = await storage.createTutorialRelease({
            ...releaseData,
            userId
          });

          results.push({
            index: i,
            id: release.id,
            clientName: releaseData.clientName,
            status: 'success'
          });

          // Enviar webhook para cada liberação criada
          try {
            await sendTutorialReleaseWebhook(release, releaseData);
          } catch (webhookError) {
            console.error(`Webhook failed for release ${release.id}:`, webhookError);
            // Continua mesmo se o webhook falhar
          }

        } catch (error) {
          errors.push({
            index: i,
            error: error instanceof Error ? error.message : "Erro desconhecido",
            data: releases[i]
          });
        }
      }

      res.json({
        message: `Processamento concluído: ${results.length} sucessos, ${errors.length} erros`,
        successful: results,
        failed: errors,
        total: releases.length
      });

    } catch (error) {
      console.error('Bulk release creation error:', error);
      res.status(500).json({ message: "Erro no processamento em lote" });
    }
  });

  // Endpoint para gerar relatórios
  app.get("/api/reports/tutorial-releases", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      const { status, format = 'json' } = req.query;

      const filters = { ...(status && { status }), ...(userId && { userId }) };
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

  // Public APIs integration - Company search by CNPJ with fallback system
  app.get("/api/companies/search", requireAuth, async (req, res) => {
    try {
      const { cnpj } = req.query;
      
      if (!cnpj || typeof cnpj !== 'string') {
        return res.status(400).json({ error: "CNPJ é obrigatório" });
      }

      // Remove formatação do CNPJ (deixa só números)
      const cleanCnpj = cnpj.replace(/\D/g, '');
      
      // Validar CNPJ
      if (!isValidCNPJ(cleanCnpj)) {
        return res.status(400).json({ error: "CNPJ inválido" });
      }

      console.log(`🔍 Buscando empresa com CNPJ: ${cleanCnpj}`);

      const result = await consultarCNPJComFallback(cleanCnpj);
      
      if (result.found && result.company) {
        res.json({
          found: true,
          company: {
            name: result.company.nome,
            document: result.company.cnpj,
            email: result.company.email || '',
            phone: result.company.telefone || '',
            situacao: result.company.situacao,
            atividade_principal: result.company.atividade_principal,
            endereco_completo: result.company.endereco_completo,
            data_abertura: result.company.data_abertura,
            porte: result.company.porte
          },
          source: result.source
        });
      } else {
        res.json({ 
          found: false, 
          message: "Empresa não encontrada nas bases de dados públicas",
          attempts: result.attempts 
        });
      }

    } catch (error: any) {
      console.error("Erro na busca de empresa:", error);
      res.status(500).json({ 
        error: "Erro interno do servidor",
        message: error?.message || "Erro desconhecido"
      });
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

  // ROTAS ADMINISTRATIVAS
  
  // Buscar todos os usuários (admin)
  app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Admin get users error:', error);
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });

  // Criar novo usuário (admin)
  app.post("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const adminUserId = (req.session as any).userId;
      const userData = registerSchema.parse(req.body);
      
      // Verificar se email já existe
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email já cadastrado" });
      }

      // Hash da senha
      const passwordHash = await bcrypt.hash(userData.password, 10);

      // Criar usuário
      const user = await storage.createUser({
        name: userData.name,
        email: userData.email,
        department: userData.department,
        password: passwordHash,
        role: userData.role || 'user',
        isActive: true,
        createdBy: adminUserId,
      });

      res.status(201).json({
        message: "Usuário criado com sucesso",
        user: { ...user, password: undefined }
      });
    } catch (error) {
      console.error('Admin create user error:', error);
      res.status(500).json({ message: "Erro ao criar usuário" });
    }
  });

  // Atualizar usuário (admin)
  app.patch("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Não permitir atualização de campos sensíveis
      const allowedFields = ['name', 'email', 'department', 'role', 'isActive'];
      const filteredUpdates = Object.keys(updates)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key];
          return obj;
        }, {} as any);

      const user = await storage.updateUser(id, filteredUpdates);
      res.json({ message: "Usuário atualizado com sucesso", user });
    } catch (error) {
      console.error('Admin update user error:', error);
      res.status(500).json({ message: "Erro ao atualizar usuário" });
    }
  });

  // Deletar usuário (admin)
  app.delete("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const adminUserId = (req.session as any).userId;

      // Não permitir que admin delete a si mesmo
      if (id === adminUserId) {
        return res.status(400).json({ message: "Você não pode deletar sua própria conta" });
      }

      await storage.deleteUser(id);
      res.json({ message: "Usuário removido com sucesso" });
    } catch (error) {
      console.error('Admin delete user error:', error);
      res.status(500).json({ message: "Erro ao remover usuário" });
    }
  });

  // Estatísticas administrativas
  app.get("/api/admin/stats", requireAuth, requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getUserStats();
      res.json(stats);
    } catch (error) {
      console.error('Admin stats error:', error);
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  // Todas as liberações de tutoriais (admin)
  app.get("/api/admin/tutorial-releases", requireAuth, requireAdmin, async (req, res) => {
    try {
      const releases = await storage.getAllTutorialReleases();
      res.json(releases);
    } catch (error) {
      console.error('Admin get all releases error:', error);
      res.status(500).json({ message: "Erro ao buscar liberações" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Validação de CNPJ com algoritmo oficial
function isValidCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/\D/g, '');
  
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false; // Todos os dígitos iguais
  
  // Validação dos dígitos verificadores
  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado != parseInt(digitos.charAt(0))) return false;
  
  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado != parseInt(digitos.charAt(1))) return false;
  
  return true;
}

// Sistema de consulta CNPJ com fallback automático
async function consultarCNPJComFallback(cnpj: string): Promise<any> {
  const apis = [
    {
      name: 'BrasilAPI',
      url: `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`,
      direct: true,
      parser: (data: any) => ({
        nome: data.razao_social || data.nome_fantasia || data.legal_nature,
        cnpj: data.cnpj,
        situacao: data.registration_status || data.descricao_situacao_cadastral,
        atividade_principal: data.main_activity?.text || data.cnae_fiscal_descricao,
        endereco_completo: `${data.street || data.logradouro || ''} ${data.number || data.numero || ''}, ${data.district || data.bairro || ''}, ${data.city || data.municipio || ''} - ${data.state || data.uf || ''}`,
        telefone: data.phone || data.telefone || data.ddd_telefone_1 || '',
        email: data.email || '',
        data_abertura: data.opening_date || data.data_inicio_atividade,
        natureza_juridica: data.legal_nature || data.natureza_juridica,
        porte: data.company_size || data.porte,
        capital_social: data.capital_social || 0
      })
    },
    {
      name: 'ReceitaWS',
      url: `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`)}`,
      direct: false,
      parser: (response: any) => {
        const data = JSON.parse(response.contents);
        return {
          nome: data.nome || data.fantasia,
          cnpj: data.cnpj,
          situacao: data.situacao,
          atividade_principal: data.atividade_principal?.[0]?.text || '',
          endereco_completo: `${data.logradouro || ''} ${data.numero || ''}, ${data.bairro || ''}, ${data.municipio || ''} - ${data.uf || ''}`,
          telefone: data.telefone || '',
          email: data.email || '',
          data_abertura: data.abertura,
          natureza_juridica: data.natureza_juridica,
          porte: data.porte,
          capital_social: parseFloat(data.capital_social?.replace(/[^\d,]/g, '')?.replace(',', '.') || '0')
        };
      }
    },
    {
      name: 'AwesomeAPI',
      url: `https://cep.awesomeapi.com.br/json/${cnpj}`,
      direct: true,
      parser: (data: any) => ({
        nome: data.company?.name || data.name,
        cnpj: data.cnpj || cnpj,
        situacao: data.status || 'Ativa',
        atividade_principal: data.activity || '',
        endereco_completo: `${data.address?.street || ''} ${data.address?.number || ''}, ${data.address?.district || ''}, ${data.address?.city || ''} - ${data.address?.state || ''}`,
        telefone: data.phone || '',
        email: data.email || '',
        data_abertura: data.founded || '',
        natureza_juridica: data.type || '',
        porte: data.size || '',
        capital_social: 0
      })
    },
    {
      name: 'CNPJá',
      url: `https://api.allorigins.win/get?url=${encodeURIComponent(`https://open.cnpja.com/office/${cnpj}`)}`,
      direct: false,
      parser: (response: any) => {
        const data = JSON.parse(response.contents);
        return {
          nome: data.company?.name || data.name,
          cnpj: data.taxId || cnpj,
          situacao: data.registration?.status || 'Ativa',
          atividade_principal: data.mainActivity?.text || '',
          endereco_completo: `${data.address?.street || ''} ${data.address?.number || ''}, ${data.address?.district || ''}, ${data.address?.city || ''} - ${data.address?.state || ''}`,
          telefone: data.phones?.[0]?.number || '',
          email: data.emails?.[0]?.address || '',
          data_abertura: data.registration?.published || '',
          natureza_juridica: data.company?.nature?.text || '',
          porte: data.company?.size?.text || '',
          capital_social: data.company?.equity || 0
        };
      }
    }
  ];
  
  const attempts = [];
  
  for (const api of apis) {
    try {
      console.log(`📡 Tentando ${api.name}...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(api.url, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CNPJ-Lookup/1.0)',
          'Accept': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const parsedData = api.parser(data);
      
      // Verificar se temos dados válidos
      if (parsedData.nome && parsedData.nome.trim()) {
        console.log(`✅ ${api.name} retornou dados válidos`);
        attempts.push({ api: api.name, status: 'success' });
        return {
          found: true,
          company: parsedData,
          source: api.name,
          attempts
        };
      } else {
        throw new Error('Dados inválidos ou empresa não encontrada');
      }
      
    } catch (error: any) {
      console.log(`❌ ${api.name} falhou:`, error?.message || "Erro desconhecido");
      attempts.push({ 
        api: api.name, 
        status: 'failed', 
        error: error?.message || "Erro desconhecido"
      });
      continue;
    }
  }
  
  return {
    found: false,
    message: 'Nenhuma API retornou dados válidos',
    attempts
  };
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