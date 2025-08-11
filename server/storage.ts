import { 
  users, 
  verificationCodes, 
  tutorials, 
  tutorialReleases,
  type User, 
  type InsertUser,
  type VerificationCode,
  type InsertVerificationCode,
  type Tutorial,
  type InsertTutorial,
  type TutorialRelease,
  type InsertTutorialRelease
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gt, desc, inArray, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(id: string, password: string): Promise<void>;
  
  // Verification codes
  createVerificationCode(code: InsertVerificationCode): Promise<VerificationCode>;
  getValidVerificationCode(email: string, code: string): Promise<VerificationCode | undefined>;
  markVerificationCodeAsUsed(id: string): Promise<void>;
  
  // Tutorials
  getAllTutorials(): Promise<Tutorial[]>;
  getTutorialsByIds(ids: string[]): Promise<Tutorial[]>;
  createTutorial(tutorial: InsertTutorial): Promise<Tutorial>;
  
  // Tutorial releases
  createTutorialRelease(release: InsertTutorialRelease): Promise<TutorialRelease>;
  getTutorialReleasesByUser(userId: string): Promise<TutorialRelease[]>;
  getAllTutorialReleases(): Promise<(TutorialRelease & { user: User })[]>;
  updateTutorialReleaseStatus(id: string, status: string): Promise<void>;
  getTutorialReleasesByStatus(status: string): Promise<TutorialRelease[]>;
  getTutorialReleaseStats(): Promise<any>;
  checkAndUpdateExpiredReleases(): Promise<void>;
  getTutorialReleasesForReport(filters?: any): Promise<(TutorialRelease & { user: User })[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserPassword(id: string, password: string): Promise<void> {
    await db
      .update(users)
      .set({ password })
      .where(eq(users.id, id));
  }

  async createVerificationCode(code: InsertVerificationCode): Promise<VerificationCode> {
    const [verificationCode] = await db
      .insert(verificationCodes)
      .values(code)
      .returning();
    return verificationCode;
  }

  async getValidVerificationCode(email: string, code: string): Promise<VerificationCode | undefined> {
    const [verificationCode] = await db
      .select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.email, email),
          eq(verificationCodes.code, code),
          eq(verificationCodes.used, false),
          gt(verificationCodes.expiresAt, new Date())
        )
      );
    return verificationCode || undefined;
  }

  async markVerificationCodeAsUsed(id: string): Promise<void> {
    await db
      .update(verificationCodes)
      .set({ used: true })
      .where(eq(verificationCodes.id, id));
  }

  async getAllTutorials(): Promise<Tutorial[]> {
    return await db.select().from(tutorials);
  }

  async getTutorialsByIds(ids: string[]): Promise<Tutorial[]> {
    if (ids.length === 0) return [];
    return await db.select().from(tutorials).where(inArray(tutorials.id, ids));
  }

  async createTutorial(tutorial: InsertTutorial): Promise<Tutorial> {
    const [newTutorial] = await db
      .insert(tutorials)
      .values(tutorial)
      .returning();
    return newTutorial;
  }

  async createTutorialRelease(release: InsertTutorialRelease): Promise<TutorialRelease> {
    const [tutorialRelease] = await db
      .insert(tutorialReleases)
      .values({
        userId: release.userId,
        clientName: release.clientName,
        clientCpf: release.clientCpf,
        clientEmail: release.clientEmail,
        clientPhone: release.clientPhone,
        companyName: release.companyName,
        companyDocument: release.companyDocument,
        companyRole: release.companyRole,
        tutorialIds: release.tutorialIds,
        status: release.status || 'pending'
      })
      .returning();
    return tutorialRelease;
  }

  async getTutorialReleasesByUser(userId: string): Promise<TutorialRelease[]> {
    return await db
      .select()
      .from(tutorialReleases)
      .where(eq(tutorialReleases.userId, userId))
      .orderBy(desc(tutorialReleases.createdAt));
  }

  async getAllTutorialReleases(): Promise<(TutorialRelease & { user: User })[]> {
    // Verificar e atualizar releases expirados antes de buscar dados
    try {
      await this.checkAndUpdateExpiredReleases();
    } catch (error) {
      console.log('Aviso: Verificação de expiração falhou (coluna pode não existir ainda):', error);
    }
    
    const results = await db
      .select({
        id: tutorialReleases.id,
        userId: tutorialReleases.userId,
        clientName: tutorialReleases.clientName,
        clientCpf: tutorialReleases.clientCpf,
        clientEmail: tutorialReleases.clientEmail,
        clientPhone: tutorialReleases.clientPhone,
        companyName: tutorialReleases.companyName,
        companyDocument: tutorialReleases.companyDocument,
        companyRole: tutorialReleases.companyRole,
        tutorialIds: tutorialReleases.tutorialIds,
        status: tutorialReleases.status,
        createdAt: tutorialReleases.createdAt,
        user: users
      })
      .from(tutorialReleases)
      .leftJoin(users, eq(tutorialReleases.userId, users.id))
      .orderBy(desc(tutorialReleases.createdAt));
    
    return results.filter(result => result.user !== null) as (TutorialRelease & { user: User })[];
  }

  async updateTutorialReleaseStatus(id: string, status: string): Promise<void> {
    const updateData: any = { status };
    
    // Se o status for "success", definir data de expiração para 90 dias
    if (status === 'success') {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 90);
      updateData.expirationDate = expirationDate;
    }
    
    await db
      .update(tutorialReleases)
      .set(updateData)
      .where(eq(tutorialReleases.id, id));
  }

  async getTutorialReleasesByStatus(status: string): Promise<TutorialRelease[]> {
    return await db
      .select()
      .from(tutorialReleases)
      .where(eq(tutorialReleases.status, status))
      .orderBy(desc(tutorialReleases.createdAt));
  }

  async getTutorialReleaseStats(): Promise<any> {
    const results = await db
      .select({
        status: tutorialReleases.status,
        count: tutorialReleases.id
      })
      .from(tutorialReleases);
    
    const stats = {
      total: results.length,
      pending: results.filter(r => r.status === 'pending').length,
      success: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length,
      expired: results.filter(r => r.status === 'expired').length
    };

    return {
      ...stats,
      success_rate: stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0
    };
  }

  async checkAndUpdateExpiredReleases(): Promise<void> {
    const now = new Date();
    
    // Buscar releases com status 'success' e data de expiração vencida
    const expiredReleases = await db
      .select()
      .from(tutorialReleases)
      .where(
        and(
          eq(tutorialReleases.status, 'success'),
          sql`${tutorialReleases.expirationDate} IS NOT NULL`,
          sql`${tutorialReleases.expirationDate} <= ${now}`
        )
      );

    // Atualizar status para 'expired'
    if (expiredReleases.length > 0) {
      const expiredIds = expiredReleases.map(r => r.id);
      await db
        .update(tutorialReleases)
        .set({ status: 'expired' })
        .where(inArray(tutorialReleases.id, expiredIds));
      
      console.log(`✅ ${expiredReleases.length} tutoriais marcados como expirados`);
    }
  }

  async getTutorialReleasesForReport(filters?: any): Promise<(TutorialRelease & { user: User })[]> {
    const baseQuery = db
      .select({
        id: tutorialReleases.id,
        userId: tutorialReleases.userId,
        clientName: tutorialReleases.clientName,
        clientCpf: tutorialReleases.clientCpf,
        clientEmail: tutorialReleases.clientEmail,
        clientPhone: tutorialReleases.clientPhone,
        companyName: tutorialReleases.companyName,
        companyDocument: tutorialReleases.companyDocument,
        companyRole: tutorialReleases.companyRole,
        tutorialIds: tutorialReleases.tutorialIds,
        status: tutorialReleases.status,
        createdAt: tutorialReleases.createdAt,
        user: users
      })
      .from(tutorialReleases)
      .leftJoin(users, eq(tutorialReleases.userId, users.id));

    // Aplicar filtros se fornecidos
    let results;
    if (filters?.status && filters.status !== 'all') {
      results = await baseQuery
        .where(eq(tutorialReleases.status, filters.status))
        .orderBy(desc(tutorialReleases.createdAt));
    } else {
      results = await baseQuery
        .orderBy(desc(tutorialReleases.createdAt));
    }
    
    return results.filter(result => result.user !== null) as (TutorialRelease & { user: User })[];
  }
}

export const storage = new DatabaseStorage();
