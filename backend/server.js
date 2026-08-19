import "dotenv/config";
import express from "express";
import cors from "cors";
import { driver, verifyDatabase, closeDatabase } from "./config/database.js";
import { queries } from "./queries.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

async function runQuery(query, params = {}) {
  const session = driver.session();
  try {
    const result = await session.run(query, params);
    return result.records;
  } finally {
    await session.close();
  }
}

function value(v) {
  if (v && typeof v.toNumber === "function") return v.toNumber();
  if (v && typeof v.properties === "object") return v.properties;
  return v;
}

function recordObject(record) {
  const obj = {};
  for (const key of record.keys) obj[key] = value(record.get(key));
  return obj;
}

app.get("/api/health", async (_req, res) => {
  try {
    await verifyDatabase();
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    res.status(503).json({ status: "error", database: "unreachable" });
  }
});

app.get("/api/dashboard", async (_req, res) => {
  try {
    const [record] = await runQuery(queries.dashboard);

    if (!record) {
      return res.status(500).json({ message: "Dashboard query returned no record." });
    }

    res.json(recordObject(record));
  } catch (error) {
    res.status(503).json({
      message: error.message || "Unable to load dashboard data."
    });
  }
});

app.get("/api/candidates", async (_req, res) => {
  try {
    const records = await runQuery(queries.candidates);
    res.json(records.map(recordObject));
  } catch (error) {
    res.status(503).json({ message: "Unable to load candidates." });
  }
});

app.get("/api/candidates/:id", async (req, res) => {
  try {
    const [record] = await runQuery(queries.candidate, { candidateId: req.params.id });
    if (!record) return res.status(404).json({ message: "Candidate not found." });
    res.json(recordObject(record).candidate);
  } catch (error) {
    res.status(503).json({ message: "Unable to load candidate." });
  }
});

app.get("/api/candidates/:id/recommendations", async (req, res) => {
  try {
    const direct = await runQuery(queries.directRecommendations, {
      candidateId: req.params.id
    });
    const related = await runQuery(queries.relatedRecommendations, {
      candidateId: req.params.id
    });

    res.json({
      direct: direct.map(recordObject),
      related: related.map(recordObject)
    });
  } catch (error) {
    res.status(503).json({ message: "Unable to calculate recommendations." });
  }
});

app.get("/api/jobs", async (_req, res) => {
  try {
    const records = await runQuery(queries.jobs);
    res.json(records.map(recordObject));
  } catch (error) {
    res.status(503).json({ message: "Unable to load jobs." });
  }
});

app.get("/api/jobs/:id", async (req, res) => {
  try {
    const [record] = await runQuery(queries.job, { jobId: req.params.id });
    if (!record) return res.status(404).json({ message: "Job not found." });
    res.json(recordObject(record).job);
  } catch (error) {
    res.status(503).json({ message: "Unable to load job." });
  }
});

app.get("/api/companies", async (_req, res) => {
  try {
    const records = await runQuery(queries.companies);
    res.json(records.map(recordObject));
  } catch (error) {
    res.status(503).json({ message: "Unable to load companies." });
  }
});

app.get("/api/skills", async (_req, res) => {
  try {
    const records = await runQuery(queries.skills);
    res.json(records.map(recordObject));
  } catch (error) {
    res.status(503).json({ message: "Unable to load skills." });
  }
});

app.get("/api/graph/:candidateId", async (req, res) => {
  try {
    const [record] = await runQuery(queries.graph, {
      candidateId: req.params.candidateId
    });

    if (!record) return res.status(404).json({ message: "Candidate not found." });

    const data = recordObject(record);
    const nodes = [];
    const edges = [];
    const seen = new Set();

    const addNode = (id, label, type) => {
      if (!id || seen.has(id)) return;
      seen.add(id);
      nodes.push({ id, label, type });
    };

    const addEdge = (source, target, relationship) => {
      edges.push({ source, target, relationship });
    };

    const candidate = value(data.c);
    addNode(candidate.id, candidate.name, "Candidate");

    for (const skillNode of data.skills || []) {
      const s = value(skillNode);
      addNode(s.id, s.name, "Skill");
      addEdge(candidate.id, s.id, "HAS_SKILL");
    }

    for (const jobNode of data.jobs || []) {
      const j = value(jobNode);
      addNode(j.id, j.title, "Job");
      addEdge(candidate.id, j.id, "APPLIED_TO");
    }

    for (const companyNode of data.companies || []) {
      const co = value(companyNode);
      addNode(co.id, co.name, "Company");
    }

    for (const skillNode of data.jobSkills || []) {
      const s = value(skillNode);
      addNode(s.id, s.name, "Skill");
    }

    res.json({ nodes, edges });
  } catch (error) {
    res.status(503).json({ message: "Unable to load graph data." });
  }
});

const server = app.listen(PORT, "0.0.0.0", async () => {
  try {
    await verifyDatabase();
    console.log(`JobGraph API running on port ${PORT}`);
    console.log("CognoDB connection verified.");
  } catch (error) {
    console.warn("API started, but CognoDB is currently unreachable.");
  }
});

process.on("SIGTERM", async () => {
  server.close(async () => {
    await closeDatabase();
    process.exit(0);
  });
});
