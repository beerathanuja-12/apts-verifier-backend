import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import Database from "better-sqlite3";

dotenv.config();

// Initialize Database
const db = new Database("history.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS verification_history (
    id TEXT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    document_type TEXT,
    verdict TEXT,
    confidence REAL,
    reasons TEXT,
    grammar_issues TEXT,
    masked_sensitive_data TEXT,
    extracted_text TEXT,
    audioData TEXT
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/save-history", async (req, res) => {
    try {
      const { id, document_type, verdict, confidence, reasons, grammar_issues, masked_sensitive_data, extracted_text, audioData } = req.body;
      
      const stmt = db.prepare(`
        INSERT INTO verification_history (id, document_type, verdict, confidence, reasons, grammar_issues, masked_sensitive_data, extracted_text, audioData)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        id,
        document_type,
        verdict,
        confidence,
        JSON.stringify(reasons),
        JSON.stringify(grammar_issues),
        JSON.stringify(masked_sensitive_data),
        JSON.stringify(extracted_text),
        audioData
      );

      res.json({ success: true });
    } catch (error) {
      console.error("History saving error:", error);
      res.status(500).json({ error: "Failed to save history" });
    }
  });

  app.get("/api/history", (req, res) => {
    const history = db.prepare("SELECT * FROM verification_history ORDER BY timestamp DESC").all();
    res.json(history.map((item: any) => ({
      ...item,
      reasons: JSON.parse(item.reasons || '[]'),
      grammar_issues: JSON.parse(item.grammar_issues || '[]'),
      masked_sensitive_data: JSON.parse(item.masked_sensitive_data || '[]'),
      extracted_text: JSON.parse(item.extracted_text || '[]')
    })));
  });

  app.delete("/api/history/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM verification_history WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.delete("/api/history", (req, res) => {
    db.prepare("DELETE FROM verification_history").run();
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
