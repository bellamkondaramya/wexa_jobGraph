export const queries = {
dashboard: `
  OPTIONAL MATCH (c:Candidate)
  WITH count(c) AS candidates
  OPTIONAL MATCH (j:Job)
  WITH candidates, count(j) AS jobs
  OPTIONAL MATCH (s:Skill)
  WITH candidates, jobs, count(s) AS skills
  OPTIONAL MATCH (co:Company)
  RETURN candidates, jobs, skills, count(co) AS companies
`,

  candidates: `
    MATCH (c:Candidate)
    OPTIONAL MATCH (c)-[:HAS_SKILL]->(s:Skill)
    WITH c, collect(s.name) AS skills
    RETURN c.id AS id, c.name AS name, c.email AS email,
           c.location AS location, c.experienceYears AS experienceYears,
           skills
    ORDER BY c.name
  `,

  candidate: `
    MATCH (c:Candidate {id: $candidateId})
    OPTIONAL MATCH (c)-[:HAS_SKILL]->(s:Skill)
    WITH c, collect(DISTINCT {
      id: s.id, name: s.name, category: s.category
    }) AS skills
    OPTIONAL MATCH (c)-[:APPLIED_TO]->(applied:Job)
    WITH c, skills, collect(DISTINCT {
      id: applied.id, title: applied.title
    }) AS applications
    RETURN c {.*, skills: skills, applications: applications} AS candidate
  `,

  directRecommendations: `
    MATCH (c:Candidate {id: $candidateId})-[:HAS_SKILL]->(s:Skill)<-[:REQUIRES]-(j:Job)
    WITH j, collect(DISTINCT s.name) AS matchingSkills
    MATCH (j)-[:POSTED_BY]->(co:Company)
    RETURN j.id AS id, j.title AS title, j.description AS description,
           j.location AS location, j.workMode AS workMode,
           j.experienceMin AS experienceMin,
           co.name AS company,
           matchingSkills,
           size(matchingSkills) AS matchCount
    ORDER BY matchCount DESC, title
  `,

  relatedRecommendations: `
    MATCH (c:Candidate {id: $candidateId})
          -[:HAS_SKILL]->(s:Skill)
          -[:RELATED_TO]->(related:Skill)
          <-[:REQUIRES]-(j:Job)
    WHERE NOT (c)-[:HAS_SKILL]->(related)
    WITH j, collect(DISTINCT related.name) AS relatedSkills
    MATCH (j)-[:POSTED_BY]->(co:Company)
    RETURN j.id AS id, j.title AS title, j.description AS description,
           j.location AS location, j.workMode AS workMode,
           j.experienceMin AS experienceMin,
           co.name AS company,
           relatedSkills,
           size(relatedSkills) AS relatedMatchCount
    ORDER BY relatedMatchCount DESC, title
  `,

  jobs: `
    MATCH (j:Job)-[:POSTED_BY]->(c:Company)
    OPTIONAL MATCH (j)-[:REQUIRES]->(s:Skill)
    WITH j, c, collect(s.name) AS skills
    RETURN j.id AS id, j.title AS title, j.description AS description,
           j.location AS location, j.workMode AS workMode,
           j.experienceMin AS experienceMin,
           c.name AS company, skills
    ORDER BY j.title
  `,

  job: `
    MATCH (j:Job {id: $jobId})-[:POSTED_BY]->(c:Company)
    OPTIONAL MATCH (j)-[:REQUIRES]->(s:Skill)
    WITH j, c, collect(DISTINCT {
      id: s.id, name: s.name, category: s.category
    }) AS skills
    OPTIONAL MATCH (candidate:Candidate)-[:APPLIED_TO]->(j)
    WITH j, c, skills, collect(DISTINCT {
      id: candidate.id, name: candidate.name
    }) AS applicants
    RETURN j {.*, company: c.name, skills: skills, applicants: applicants} AS job
  `,

  companies: `
    MATCH (c:Company)
    OPTIONAL MATCH (j:Job)-[:POSTED_BY]->(c)
    WITH c, collect(DISTINCT j.id) AS jobIds
    RETURN c.id AS id, c.name AS name, c.industry AS industry,
           c.location AS location, size(jobIds) AS openJobs
    ORDER BY c.name
  `,

  skills: `
    MATCH (s:Skill)
    OPTIONAL MATCH (s)-[:RELATED_TO]->(related:Skill)
    RETURN s.id AS id, s.name AS name, s.category AS category,
           collect(related.name) AS relatedSkills
    ORDER BY s.name
  `,

  graph: `
    MATCH (c:Candidate {id: $candidateId})
    OPTIONAL MATCH (c)-[:HAS_SKILL]->(s:Skill)
    OPTIONAL MATCH (c)-[:APPLIED_TO]->(j:Job)
    OPTIONAL MATCH (j)-[:POSTED_BY]->(co:Company)
    OPTIONAL MATCH (j)-[:REQUIRES]->(js:Skill)
    WITH c, collect(DISTINCT s) AS skills,
         collect(DISTINCT j) AS jobs,
         collect(DISTINCT co) AS companies,
         collect(DISTINCT js) AS jobSkills
    RETURN c, skills, jobs, companies, jobSkills
  `
};
