import { 
  users, 
  verificationCodes, 
  tutorials, 
  tutorialReleases,
  jobRoles,
  type User, 
  type InsertUser,
  type VerificationCode,
  type InsertVerificationCode,
  type Tutorial,
  type InsertTutorial,
  type JobRole,
  type InsertJobRole,
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
  
  // Admin user management
  getAllUsers(): Promise<(User & { creator?: User })[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  getUserStats(): Promise<any>;

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

  // Job Roles
  getAllJobRoles(): Promise<JobRole[]>;
  getJobRolesByType(type: 'department' | 'client_role'): Promise<JobRole[]>;
  createJobRole(role: InsertJobRole): Promise<JobRole>;
  updateJobRole(id: string, role: Partial<InsertJobRole>): Promise<void>;
  deleteJobRole(id: string): Promise<void>;
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

  async createTutorialRelease(data: InsertTutorialRelease): Promise<TutorialRelease> {
    // Não definir data de expiração na criação - apenas quando status for 'success'
    const [release] = await db
      .insert(tutorialReleases)
      .values(data)
      .returning();

    return release;
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
        expirationDate: tutorialReleases.expirationDate,
        createdAt: tutorialReleases.createdAt,
        user: users
      })
      .from(tutorialReleases)
      .leftJoin(users, eq(tutorialReleases.userId, users.id))
      .orderBy(desc(tutorialReleases.createdAt));

    return results.filter(result => result.user !== null) as (TutorialRelease & { user: User })[];
  }

  async updateTutorialReleaseStatus(id: string, status: string): Promise<void> {
    // Se o status for 'success', definir a data de expiração para 90 dias a partir de agora
    let updateData: Partial<InsertTutorialRelease> = { status };
    if (status === 'success') {
      const now = new Date();
      const saoPauloTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
      const expirationDate = new Date(saoPauloTime);
      expirationDate.setDate(expirationDate.getDate() + 90);
      updateData.expirationDate = expirationDate;
    } else {
      // Se o status não for 'success', remover a data de expiração se existir
      updateData.expirationDate = null;
    }

    await db
      .update(tutorialReleases)
      .set(updateData)
      .where(eq(tutorialReleases.id, id));
  }

  async getTutorialReleasesByStatus(status: string): Promise<TutorialRelease[]> {
    let query = db
      .select()
      .from(tutorialReleases)
      .where(eq(tutorialReleases.status, status))
      .orderBy(desc(tutorialReleases.createdAt));

    // Se o status for 'success', filtrar também pelas datas de expiração válidas
    if (status === 'success') {
      const now = new Date();
      const saoPauloTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
      query = query.where(
        and(
          eq(tutorialReleases.status, status),
          sql`${tutorialReleases.expirationDate} IS NOT NULL`,
          sql`${tutorialReleases.expirationDate} > ${saoPauloTime}`
        )
      );
    } else if (status === 'expired') {
      // Para status 'expired', verificar as datas de expiração que já passaram
      const now = new Date();
      const saoPauloTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
      query = query.where(
        and(
          eq(tutorialReleases.status, 'success'), // Originalmente eram 'success' e agora estão expirados
          sql`${tutorialReleases.expirationDate} IS NOT NULL`,
          sql`${tutorialReleases.expirationDate} <= ${saoPauloTime}`
        )
      );
    }

    return await query;
  }

  async getTutorialReleaseStats(): Promise<any> {
    const now = new Date();
    const saoPauloTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));

    const results = await db
      .select({
        status: tutorialReleases.status,
        count: tutorialReleases.id,
        expirationDate: tutorialReleases.expirationDate
      })
      .from(tutorialReleases);

    const total = results.length;
    const success = results.filter(r => r.status === 'success' && r.expirationDate && new Date(r.expirationDate) > saoPauloTime).length;
    const failed = results.filter(r => r.status === 'failed').length;
    const expired = results.filter(r => r.status === 'success' && r.expirationDate && new Date(r.expirationDate) <= saoPauloTime).length;
    const pending = results.filter(r => r.status === 'pending').length;

    const stats = {
      total: total,
      pending: pending,
      success: success,
      failed: failed,
      expired: expired
    };

    return {
      ...stats,
      success_rate: stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0
    };
  }

  async checkAndUpdateExpiredReleases(): Promise<void> {
    const now = new Date();
    const saoPauloTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));

    // Buscar releases com status 'success' e data de expiração vencida
    const expiredReleases = await db
      .select()
      .from(tutorialReleases)
      .where(
        and(
          eq(tutorialReleases.status, 'success'),
          sql`${tutorialReleases.expirationDate} IS NOT NULL`,
          sql`${tutorialReleases.expirationDate} <= ${saoPauloTime}`
        )
      );

    // Atualizar status para 'expired'
    if (expiredReleases.length > 0) {
      const expiredIds = expiredReleases.map(r => r.id);
      await db
        .update(tutorialReleases)
        .set({ status: 'expired', expirationDate: null }) // Remover data de expiração ao expirar
        .where(inArray(tutorialReleases.id, expiredIds));

      console.log(`✅ ${expiredReleases.length} tutoriais marcados como expirados`);
    }
  }

  async getTutorialReleasesForReport(filters?: any): Promise<(TutorialRelease & { user: User })[]> {
    let whereConditions = [];

    if (filters?.userId) {
      whereConditions.push(eq(tutorialReleases.userId, filters.userId));
    }

    if (filters?.status && filters.status !== 'all') {
      if (filters.status === 'success') {
        const now = new Date();
        const saoPauloTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
        // Para 'success', considerar apenas os que ainda não expiraram
        whereConditions.push(and(
          eq(tutorialReleases.status, filters.status),
          sql`${tutorialReleases.expirationDate} IS NOT NULL`,
          sql`${tutorialReleases.expirationDate} > ${saoPauloTime}`
        ));
      } else if (filters.status === 'expired') {
        // Para 'expired', considerar os que eram 'success' e já passaram da data de expiração
        const now = new Date();
        const saoPauloTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
        whereConditions.push(and(
          eq(tutorialReleases.status, 'success'), // Status original era 'success'
          sql`${tutorialReleases.expirationDate} IS NOT NULL`,
          sql`${tutorialReleases.expirationDate} <= ${saoPauloTime}`
        ));
      }
      else {
        whereConditions.push(eq(tutorialReleases.status, filters.status));
      }
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
        expirationDate: tutorialReleases.expirationDate,
        createdAt: tutorialReleases.createdAt,
        user: users
      })
      .from(tutorialReleases)
      .leftJoin(users, eq(tutorialReleases.userId, users.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(tutorialReleases.createdAt));

    return results.filter(result => result.user !== null) as (TutorialRelease & { user: User })[];
  }

  // Job Roles methods
  async getAllJobRoles(): Promise<JobRole[]> {
    return await db
      .select()
      .from(jobRoles)
      .where(eq(jobRoles.active, true))
      .orderBy(jobRoles.sortOrder, jobRoles.name);
  }

  async getJobRolesByType(type: 'department' | 'client_role'): Promise<JobRole[]> {
    return await db
      .select()
      .from(jobRoles)
      .where(and(eq(jobRoles.type, type), eq(jobRoles.active, true)))
      .orderBy(jobRoles.sortOrder, jobRoles.name);
  }

  async createJobRole(role: InsertJobRole): Promise<JobRole> {
    const [newRole] = await db
      .insert(jobRoles)
      .values(role)
      .returning();
    return newRole;
  }

  async updateJobRole(id: string, role: Partial<InsertJobRole>): Promise<void> {
    await db
      .update(jobRoles)
      .set(role)
      .where(eq(jobRoles.id, id));
  }

  async deleteJobRole(id: string): Promise<void> {
    await db
      .update(jobRoles)
      .set({ active: false })
      .where(eq(jobRoles.id, id));
  }

  // Admin user management methods
  async getAllUsers(): Promise<(User & { creator?: User })[]> {
    const result = await db
      .select({
        user: users,
        creator: {
          id: sql`creator.id`,
          name: sql`creator.name`,
          email: sql`creator.email`,
          department: sql`creator.department`,
          role: sql`creator.role`,
          isActive: sql`creator.is_active`,
          createdAt: sql`creator.created_at`,
          createdBy: sql`creator.created_by`,
        }
      })
      .from(users)
      .leftJoin(sql`users as creator`, sql`creator.id = users.created_by`)
      .orderBy(desc(users.createdAt));

    return result.map(row => ({
      ...row.user,
      creator: row.creator.id ? row.creator as User : undefined
    }));
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getUserStats(): Promise<any> {
    const totalUsersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.isActive, true));

    const totalAdminsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(eq(users.isActive, true), eq(users.role, 'admin')));

    const totalReleasesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(tutorialReleases);

    const thisMonthReleasesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(tutorialReleases)
      .where(sql`DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`);

    return {
      totalUsers: totalUsersResult[0]?.count || 0,
      totalAdmins: totalAdminsResult[0]?.count || 0,
      totalReleases: totalReleasesResult[0]?.count || 0,
      releasesThisMonth: thisMonthReleasesResult[0]?.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();