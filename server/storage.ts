import { eq } from "drizzle-orm";
import { db } from "./db";
import {
  profiles,
  vaultPositions,
  strategies,
  strategySubscriptions,
  predictionMarkets,
  nodeMemberships,
  systemConfig,
  type Profile,
  type InsertProfile,
  type VaultPosition,
  type InsertVaultPosition,
  type Strategy,
  type InsertStrategy,
  type StrategySubscription,
  type InsertStrategySubscription,
  type PredictionMarket,
  type InsertPredictionMarket,
  type NodeMembership,
} from "@shared/schema";

export interface IStorage {
  getProfileByWallet(walletAddress: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  getProfile(id: string): Promise<Profile | undefined>;
  getVaultPositions(userId: string): Promise<VaultPosition[]>;
  createVaultPosition(position: InsertVaultPosition): Promise<VaultPosition>;
  getStrategies(): Promise<Strategy[]>;
  createStrategy(strategy: InsertStrategy): Promise<Strategy>;
  getStrategySubscriptions(userId: string): Promise<StrategySubscription[]>;
  createStrategySubscription(sub: InsertStrategySubscription): Promise<StrategySubscription>;
  getPredictionMarkets(): Promise<PredictionMarket[]>;
  createPredictionMarket(market: InsertPredictionMarket): Promise<PredictionMarket>;
  getNodeMembership(userId: string): Promise<NodeMembership | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getProfileByWallet(walletAddress: string): Promise<Profile | undefined> {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.walletAddress, walletAddress.toLowerCase()));
    return profile;
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const [created] = await db
      .insert(profiles)
      .values({ ...profile, walletAddress: profile.walletAddress.toLowerCase() })
      .returning();
    return created;
  }

  async getProfile(id: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
    return profile;
  }

  async getVaultPositions(userId: string): Promise<VaultPosition[]> {
    return db.select().from(vaultPositions).where(eq(vaultPositions.userId, userId));
  }

  async createVaultPosition(position: InsertVaultPosition): Promise<VaultPosition> {
    const [created] = await db.insert(vaultPositions).values(position).returning();
    return created;
  }

  async getStrategies(): Promise<Strategy[]> {
    return db.select().from(strategies);
  }

  async createStrategy(strategy: InsertStrategy): Promise<Strategy> {
    const [created] = await db.insert(strategies).values(strategy).returning();
    return created;
  }

  async getStrategySubscriptions(userId: string): Promise<StrategySubscription[]> {
    return db.select().from(strategySubscriptions).where(eq(strategySubscriptions.userId, userId));
  }

  async createStrategySubscription(sub: InsertStrategySubscription): Promise<StrategySubscription> {
    const [created] = await db.insert(strategySubscriptions).values(sub).returning();
    return created;
  }

  async getPredictionMarkets(): Promise<PredictionMarket[]> {
    return db.select().from(predictionMarkets);
  }

  async createPredictionMarket(market: InsertPredictionMarket): Promise<PredictionMarket> {
    const [created] = await db.insert(predictionMarkets).values(market).returning();
    return created;
  }

  async getNodeMembership(userId: string): Promise<NodeMembership | undefined> {
    const [membership] = await db
      .select()
      .from(nodeMemberships)
      .where(eq(nodeMemberships.userId, userId));
    return membership;
  }
}

export const storage = new DatabaseStorage();
