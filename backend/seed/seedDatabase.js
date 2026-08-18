import "dotenv/config";
import { driver, closeDatabase } from "../config/database.js";

const candidates = [
  { id: "cand-001", name: "Ramya Bellamkonda", email: "ramya@example.com", location: "Hyderabad", experienceYears: 2 },
  { id: "cand-002", name: "Arjun Rao", email: "arjun@example.com", location: "Bengaluru", experienceYears: 3 },
  { id: "cand-003", name: "Priya Sharma", email: "priya@example.com", location: "Pune", experienceYears: 2 },
  { id: "cand-004", name: "Rahul Verma", email: "rahul@example.com", location: "Hyderabad", experienceYears: 4 },
  { id: "cand-005", name: "Ananya Iyer", email: "ananya@example.com", location: "Chennai", experienceYears: 3 }
];

const skills = [
  { id: "skill-js", name: "JavaScript", category: "Frontend" },
  { id: "skill-ts", name: "TypeScript", category: "Frontend" },
  { id: "skill-react", name: "React", category: "Frontend" },
  { id: "skill-next", name: "Next.js", category: "Frontend" },
  { id: "skill-node", name: "Node.js", category: "Backend" },
  { id: "skill-express", name: "Express.js", category: "Backend" },
  { id: "skill-mongo", name: "MongoDB", category: "Database" },
  { id: "skill-sql", name: "SQL", category: "Database" },
  { id: "skill-python", name: "Python", category: "Backend" },
  { id: "skill-aws", name: "AWS", category: "Cloud" },
  { id: "skill-docker", name: "Docker", category: "DevOps" },
  { id: "skill-git", name: "Git", category: "Tools" }
];

const companies = [
  { id: "company-nova", name: "TechNova", industry: "Software", location: "Hyderabad" },
  { id: "company-cloud", name: "CloudWorks", industry: "Cloud Technology", location: "Bengaluru" },
  { id: "company-data", name: "DataSphere", industry: "Data & Analytics", location: "Pune" },
  { id: "company-innovate", name: "InnovateLabs", industry: "Product Engineering", location: "Chennai" }
];

const jobs = [
  { id: "job-001", title: "MERN Stack Developer", description: "Build and maintain modern full-stack web applications.", location: "Hyderabad", workMode: "Hybrid", experienceMin: 1, companyId: "company-nova", skills: ["skill-js", "skill-react", "skill-node", "skill-mongo", "skill-git"] },
  { id: "job-002", title: "React Developer", description: "Develop accessible and responsive React interfaces.", location: "Bengaluru", workMode: "Remote", experienceMin: 1, companyId: "company-cloud", skills: ["skill-js", "skill-react", "skill-ts", "skill-git"] },
  { id: "job-003", title: "Full Stack Engineer", description: "Work across frontend, APIs, data and cloud infrastructure.", location: "Pune", workMode: "Hybrid", experienceMin: 2, companyId: "company-data", skills: ["skill-ts", "skill-react", "skill-node", "skill-sql", "skill-aws"] },
  { id: "job-004", title: "Backend Node.js Engineer", description: "Design REST APIs and backend services.", location: "Hyderabad", workMode: "On-site", experienceMin: 2, companyId: "company-nova", skills: ["skill-node", "skill-express", "skill-mongo", "skill-git"] },
  { id: "job-005", title: "Cloud Application Engineer", description: "Develop applications and deploy reliable cloud services.", location: "Bengaluru", workMode: "Remote", experienceMin: 3, companyId: "company-cloud", skills: ["skill-node", "skill-python", "skill-aws", "skill-docker"] },
  { id: "job-006", title: "Next.js Product Engineer", description: "Build production product experiences using React and Next.js.", location: "Chennai", workMode: "Hybrid", experienceMin: 2, companyId: "company-innovate", skills: ["skill-react", "skill-next", "skill-ts", "skill-node"] }
];

const candidateSkills = {
  "cand-001": ["skill-js", "skill-ts", "skill-react", "skill-node", "skill-mongo", "skill-git"],
  "cand-002": ["skill-js", "skill-react", "skill-node", "skill-express", "skill-aws", "skill-docker"],
  "cand-003": ["skill-js", "skill-ts", "skill-react", "skill-next", "skill-git"],
  "cand-004": ["skill-node", "skill-express", "skill-python", "skill-sql", "skill-aws", "skill-docker"],
  "cand-005": ["skill-js", "skill-ts", "skill-react", "skill-node", "skill-aws"]
};

const applications = [
  ["cand-001", "job-001"],
  ["cand-001", "job-006"],
  ["cand-002", "job-005"],
  ["cand-003", "job-002"],
  ["cand-004", "job-005"],
  ["cand-005", "job-003"]
];

const relatedSkills = [
  ["skill-js", "skill-ts"],
  ["skill-react", "skill-next"],
  ["skill-node", "skill-express"],
  ["skill-node", "skill-python"],
  ["skill-aws", "skill-docker"],
  ["skill-mongo", "skill-node"],
  ["skill-sql", "skill-python"]
];

const session = driver.session();

try {
  await session.run(`
    CREATE CONSTRAINT candidate_id IF NOT EXISTS
    FOR (n:Candidate) REQUIRE n.id IS UNIQUE
  `);
  await session.run(`
    CREATE CONSTRAINT skill_id IF NOT EXISTS
    FOR (n:Skill) REQUIRE n.id IS UNIQUE
  `);
  await session.run(`
    CREATE CONSTRAINT job_id IF NOT EXISTS
    FOR (n:Job) REQUIRE n.id IS UNIQUE
  `);
  await session.run(`
    CREATE CONSTRAINT company_id IF NOT EXISTS
    FOR (n:Company) REQUIRE n.id IS UNIQUE
  `);

  await session.run(`
    MATCH (n)
    DETACH DELETE n
  `);

  await session.run(`
    UNWIND $candidates AS item
    CREATE (:Candidate {
      id: item.id, name: item.name, email: item.email,
      location: item.location, experienceYears: item.experienceYears
    })
  `, { candidates });

  await session.run(`
    UNWIND $skills AS item
    CREATE (:Skill {id: item.id, name: item.name, category: item.category})
  `, { skills });

  await session.run(`
    UNWIND $companies AS item
    CREATE (:Company {
      id: item.id, name: item.name, industry: item.industry, location: item.location
    })
  `, { companies });

  await session.run(`
    UNWIND $jobs AS item
    MATCH (company:Company {id: item.companyId})
    CREATE (j:Job {
      id: item.id, title: item.title, description: item.description,
      location: item.location, workMode: item.workMode, experienceMin: item.experienceMin
    })
    CREATE (j)-[:POSTED_BY]->(company)
    WITH j, item
    UNWIND item.skills AS skillId
    MATCH (s:Skill {id: skillId})
    CREATE (j)-[:REQUIRES]->(s)
  `, { jobs });

  await session.run(`
    UNWIND $pairs AS pair
    MATCH (c:Candidate {id: pair[0]}), (s:Skill {id: pair[1]})
    CREATE (c)-[:HAS_SKILL]->(s)
  `, { pairs: Object.entries(candidateSkills).flatMap(([candidateId, skillIds]) =>
    skillIds.map(skillId => [candidateId, skillId])
  )});

  await session.run(`
    UNWIND $applications AS pair
    MATCH (c:Candidate {id: pair[0]}), (j:Job {id: pair[1]})
    CREATE (c)-[:APPLIED_TO]->(j)
  `, { applications });

  await session.run(`
    UNWIND $pairs AS pair
    MATCH (a:Skill {id: pair[0]}), (b:Skill {id: pair[1]})
    CREATE (a)-[:RELATED_TO]->(b)
    CREATE (b)-[:RELATED_TO]->(a)
  `, { pairs: relatedSkills });

  console.log("CognoDB seed completed successfully.");
} finally {
  await session.close();
  await closeDatabase();
}
