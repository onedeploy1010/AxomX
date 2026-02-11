import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  app.get("/api/config", (_req, res) => {
    res.json({
      thirdwebClientId: process.env.THIRDWEB_CLIENT_ID || "",
    });
  });

  app.post("/api/auth/wallet", async (req, res) => {
    try {
      const { walletAddress } = req.body;
      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address required" });
      }

      let profile = await storage.getProfileByWallet(walletAddress);
      if (!profile) {
        profile = await storage.createProfile({ walletAddress });
      }

      res.json(profile);
    } catch (error: any) {
      console.error("Auth error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/profile/:walletAddress", async (req, res) => {
    try {
      const profile = await storage.getProfileByWallet(req.params.walletAddress);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/strategies", async (_req, res) => {
    try {
      const list = await storage.getStrategies();
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/predictions", async (_req, res) => {
    try {
      const list = await storage.getPredictionMarkets();
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/vault/:userId", async (req, res) => {
    try {
      const positions = await storage.getVaultPositions(req.params.userId);
      res.json(positions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/vault", async (req, res) => {
    try {
      const position = await storage.createVaultPosition(req.body);
      res.json(position);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/strategies", async (req, res) => {
    try {
      const strategy = await storage.createStrategy(req.body);
      res.json(strategy);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/subscriptions/:userId", async (req, res) => {
    try {
      const subs = await storage.getStrategySubscriptions(req.params.userId);
      res.json(subs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/subscriptions", async (req, res) => {
    try {
      const sub = await storage.createStrategySubscription(req.body);
      res.json(sub);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/node/:userId", async (req, res) => {
    try {
      const membership = await storage.getNodeMembership(req.params.userId);
      res.json(membership || null);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
