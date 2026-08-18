import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  Database,
  GitBranch,
  LayoutDashboard,
  RefreshCw,
  Search,
  Sparkles,
  Users,
  X
} from "lucide-react";
import { api } from "./api.js";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "candidates", label: "Candidates", icon: Users },
  { id: "jobs", label: "Jobs", icon: BriefcaseBusiness },
  { id: "companies", label: "Companies", icon: Building2 },
  { id: "graph", label: "Graph Explorer", icon: GitBranch }
];

function App() {
  const [page, setPage] = useState("dashboard");
  const [dashboard, setDashboard] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidateDetail, setCandidateDetail] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobDetail, setJobDetail] = useState(null);
  const [graph, setGraph] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBaseData = async () => {
    setLoading(true);
    setError("");
    try {
      const [d, c, j, co] = await Promise.all([
        api.dashboard(),
        api.candidates(),
        api.jobs(),
        api.companies()
      ]);
      setDashboard(d);
      setCandidates(c);
      setJobs(j);
      setCompanies(co);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBaseData();
  }, []);

  const openCandidate = async (candidate) => {
    setSelectedCandidate(candidate);
    setCandidateDetail(null);
    setRecommendations(null);
    setPage("candidates");
    try {
      const [detail, recs] = await Promise.all([
        api.candidate(candidate.id),
        api.recommendations(candidate.id)
      ]);
      setCandidateDetail(detail);
      setRecommendations(recs);
    } catch (err) {
      setError(err.message);
    }
  };

  const openJob = async (job) => {
    setSelectedJob(job);
    setJobDetail(null);
    setPage("jobs");
    try {
      setJobDetail(await api.job(job.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const openGraph = async (candidate = selectedCandidate || candidates[0]) => {
    if (!candidate) return;
    setSelectedCandidate(candidate);
    setPage("graph");
    try {
      setGraph(await api.graph(candidate.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const pageTitle = useMemo(() => {
    const item = navItems.find((n) => n.id === page);
    return item?.label || "Dashboard";
  }, [page]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><GitBranch size={21} /></div>
          <div>
            <strong>JobGraph</strong>
            <span>Graph-powered discovery</span>
          </div>
        </div>

        <nav>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${page === id ? "active" : ""}`}
              onClick={() => setPage(id)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-card">
          <Database size={18} />
          <div>
            <strong>CognoDB</strong>
            <span>Graph database connected through the Neo4j driver.</span>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <div className="eyebrow">WEXA AI · Take-home</div>
            <h1>{pageTitle}</h1>
          </div>
          <button className="icon-button" onClick={loadBaseData} title="Refresh">
            <RefreshCw size={18} />
          </button>
        </header>

        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={() => setError("")}><X size={16} /></button>
          </div>
        )}

        {loading && !dashboard ? (
          <Loading />
        ) : (
          <>
            {page === "dashboard" && (
              <Dashboard
                dashboard={dashboard}
                candidates={candidates}
                jobs={jobs}
                companies={companies}
                onCandidate={openCandidate}
                onJob={openJob}
              />
            )}

            {page === "candidates" && (
              <Candidates
                candidates={candidates}
                selected={selectedCandidate}
                detail={candidateDetail}
                recommendations={recommendations}
                onSelect={openCandidate}
                onGraph={openGraph}
              />
            )}

            {page === "jobs" && (
              <Jobs jobs={jobs} selected={selectedJob} detail={jobDetail} onSelect={openJob} />
            )}

            {page === "companies" && <Companies companies={companies} />}

            {page === "graph" && (
              <GraphExplorer
                candidates={candidates}
                selected={selectedCandidate}
                graph={graph}
                onSelect={openGraph}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Dashboard({ dashboard, candidates, jobs, companies, onCandidate, onJob }) {
  return (
    <div className="content">
      <section className="hero">
        <div>
          <span className="pill"><Sparkles size={14} /> Relationship-first discovery</span>
          <h2>Explore talent, skills and opportunities as a connected graph.</h2>
          <p>
            JobGraph uses connected data to find direct and indirect relationships
            between candidates, skills, jobs and companies.
          </p>
        </div>
        <div className="hero-visual">
          <span>Candidate</span><i>→</i><span>Skill</span><i>→</i><span>Job</span>
        </div>
      </section>

      <div className="stats">
        <Stat label="Candidates" value={dashboard?.candidates ?? 0} icon={<Users />} />
        <Stat label="Open jobs" value={dashboard?.jobs ?? 0} icon={<BriefcaseBusiness />} />
        <Stat label="Skills" value={dashboard?.skills ?? 0} icon={<GitBranch />} />
        <Stat label="Companies" value={dashboard?.companies ?? 0} icon={<Building2 />} />
      </div>

      <section className="grid-two">
        <div className="panel">
          <PanelHeader title="Candidates" subtitle="Select a candidate to see graph-based recommendations." />
          <div className="list">
            {candidates.slice(0, 5).map((c) => (
              <button className="list-row" key={c.id} onClick={() => onCandidate(c)}>
                <div className="avatar">{initials(c.name)}</div>
                <div className="row-main">
                  <strong>{c.name}</strong>
                  <span>{c.location} · {c.experienceYears} yrs</span>
                </div>
                <ChevronRight size={17} />
              </button>
            ))}
          </div>
        </div>

        <div className="panel">
          <PanelHeader title="Featured jobs" subtitle="Open roles connected to the skill graph." />
          <div className="list">
            {jobs.slice(0, 5).map((j) => (
              <button className="list-row" key={j.id} onClick={() => onJob(j)}>
                <div className="square-icon"><BriefcaseBusiness size={17} /></div>
                <div className="row-main">
                  <strong>{j.title}</strong>
                  <span>{j.company} · {j.workMode}</span>
                </div>
                <ChevronRight size={17} />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <PanelHeader title="How the graph helps" subtitle="The same data can answer relationship-heavy questions directly." />
        <div className="relationship-strip">
          <Node label="Candidate" />
          <Arrow label="HAS_SKILL" />
          <Node label="Skill" />
          <Arrow label="REQUIRES" />
          <Node label="Job" />
          <Arrow label="POSTED_BY" />
          <Node label="Company" />
        </div>
      </section>
    </div>
  );
}

function Candidates({ candidates, selected, detail, recommendations, onSelect, onGraph }) {
  return (
    <div className="content">
      <div className="section-heading">
        <div>
          <h2>Candidate talent graph</h2>
          <p>Choose a candidate to discover jobs through connected skills.</p>
        </div>
      </div>

      <div className="candidate-layout">
        <div className="panel candidate-list">
          {candidates.map((c) => (
            <button className={`candidate-item ${selected?.id === c.id ? "selected" : ""}`} key={c.id} onClick={() => onSelect(c)}>
              <div className="avatar large">{initials(c.name)}</div>
              <div>
                <strong>{c.name}</strong>
                <span>{c.location} · {c.experienceYears} years</span>
              </div>
              <ChevronRight size={17} />
            </button>
          ))}
        </div>

        <div className="detail-area">
          {!selected ? (
            <Empty text="Select a candidate to explore the graph." />
          ) : !detail ? (
            <Loading />
          ) : (
            <>
              <section className="profile-card">
                <div>
                  <div className="avatar xl">{initials(detail.name)}</div>
                </div>
                <div className="profile-info">
                  <span className="eyebrow">Candidate</span>
                  <h2>{detail.name}</h2>
                  <p>{detail.email} · {detail.location} · {detail.experienceYears} years experience</p>
                </div>
                <button className="primary-button" onClick={() => onGraph(detail)}>
                  <GitBranch size={16} /> Explore graph
                </button>
              </section>

              <div className="grid-two">
                <section className="panel">
                  <PanelHeader title="Skills" subtitle="Direct HAS_SKILL relationships." />
                  <div className="chips">
                    {(detail.skills || []).filter(s => s.id).map((s) => <span className="chip" key={s.id}>{s.name}</span>)}
                  </div>
                </section>
                <section className="panel">
                  <PanelHeader title="Applications" subtitle="Jobs connected through APPLIED_TO." />
                  {(detail.applications || []).filter(j => j.id).map((j) => (
                    <div className="compact-row" key={j.id}><span>{j.title}</span><span className="mini-label">Applied</span></div>
                  ))}
                </section>
              </div>

              <section className="panel">
                <PanelHeader
                  title="Recommended jobs"
                  subtitle="Direct matches first, followed by related-skill matches."
                />
                <div className="recommendations">
                  {(recommendations?.direct || []).map((r) => (
                    <Recommendation key={`direct-${r.id}`} item={r} direct />
                  ))}
                  {(recommendations?.related || []).map((r) => (
                    <Recommendation key={`related-${r.id}`} item={r} />
                  ))}
                  {!recommendations?.direct?.length && !recommendations?.related?.length && (
                    <Empty text="No matching jobs found." />
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Recommendation({ item, direct }) {
  return (
    <div className="recommendation">
      <div className="square-icon"><BriefcaseBusiness size={17} /></div>
      <div className="row-main">
        <strong>{item.title}</strong>
        <span>{item.company} · {item.location} · {item.workMode}</span>
        <div className="chips small">
          {(direct ? item.matchingSkills : item.relatedSkills || []).map((s) => <span className="chip" key={s}>{s}</span>)}
        </div>
      </div>
      <div className="match">
        <strong>{direct ? item.matchCount : item.relatedMatchCount}</strong>
        <span>{direct ? "skill match" : "related"}</span>
      </div>
    </div>
  );
}

function Jobs({ jobs, selected, detail, onSelect }) {
  return (
    <div className="content">
      <div className="section-heading">
        <div>
          <h2>Job marketplace</h2>
          <p>Explore jobs and the skills connected to each role.</p>
        </div>
      </div>

      <div className="job-layout">
        <div className="panel">
          <div className="search-box"><Search size={17} /><input placeholder="Search jobs..." /></div>
          <div className="list">
            {jobs.map((j) => (
              <button className={`list-row ${selected?.id === j.id ? "selected-row" : ""}`} key={j.id} onClick={() => onSelect(j)}>
                <div className="square-icon"><BriefcaseBusiness size={17} /></div>
                <div className="row-main">
                  <strong>{j.title}</strong>
                  <span>{j.company} · {j.location}</span>
                </div>
                <ChevronRight size={17} />
              </button>
            ))}
          </div>
        </div>

        <div className="detail-area">
          {!selected ? <Empty text="Select a job to view its connected graph data." /> :
            !detail ? <Loading /> :
            <section className="panel job-detail">
              <span className="eyebrow">Open role</span>
              <h2>{detail.title}</h2>
              <p className="lead">{detail.description}</p>
              <div className="job-meta">
                <span>{detail.company}</span><span>{detail.location}</span><span>{detail.workMode}</span><span>{detail.experienceMin}+ years</span>
              </div>
              <hr />
              <PanelHeader title="Required skills" subtitle="Connected through REQUIRES relationships." />
              <div className="chips">{(detail.skills || []).filter(s => s.id).map(s => <span className="chip" key={s.id}>{s.name}</span>)}</div>
              <div className="applicants">
                <PanelHeader title="Applicants" subtitle="Candidates connected through APPLIED_TO." />
                {(detail.applicants || []).filter(c => c.id).map(c => <span className="applicant" key={c.id}>{c.name}</span>)}
              </div>
            </section>
          }
        </div>
      </div>
    </div>
  );
}

function Companies({ companies }) {
  return (
    <div className="content">
      <div className="section-heading">
        <div><h2>Companies</h2><p>Organizations connected to open jobs.</p></div>
      </div>
      <div className="company-grid">
        {companies.map((c) => (
          <div className="panel company-card" key={c.id}>
            <div className="square-icon"><Building2 size={19} /></div>
            <h3>{c.name}</h3>
            <p>{c.industry}</p>
            <div className="company-footer"><span>{c.location}</span><strong>{c.openJobs} open jobs</strong></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GraphExplorer({ candidates, selected, graph, onSelect }) {
  const [candidateId, setCandidateId] = useState(selected?.id || candidates[0]?.id || "");

  useEffect(() => {
    if (selected?.id) setCandidateId(selected.id);
  }, [selected]);

  useEffect(() => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (candidate) onSelect(candidate);
    // intentionally runs when selector changes
  }, [candidateId]);

  return (
    <div className="content">
      <div className="section-heading">
        <div>
          <h2>Graph Explorer</h2>
          <p>Visualize a candidate's connected data and relationship types.</p>
        </div>
        <select className="select" value={candidateId} onChange={(e) => setCandidateId(e.target.value)}>
          {candidates.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <section className="panel graph-panel">
        <div className="graph-summary">
          <span><b>{graph?.nodes?.length || 0}</b> nodes</span>
          <span><b>{graph?.edges?.length || 0}</b> relationships</span>
        </div>
        {!graph ? <Loading /> :
          <div className="graph-canvas">
            <div className="graph-column">
              <div className="graph-node candidate-node"><Users size={18} /><span>{selected?.name || "Candidate"}</span></div>
              <div className="graph-line"><span>HAS_SKILL</span></div>
              <div className="graph-node skill-node"><GitBranch size={18} /><span>Skills</span></div>
              <div className="graph-line"><span>REQUIRES</span></div>
              <div className="graph-node job-node"><BriefcaseBusiness size={18} /><span>Jobs</span></div>
              <div className="graph-line"><span>POSTED_BY</span></div>
              <div className="graph-node company-node"><Building2 size={18} /><span>Companies</span></div>
            </div>
            <div className="graph-data">
              <h3>Returned from CognoDB</h3>
              <p>The backend traverses the graph and converts the result into nodes and relationships for this explorer.</p>
              <div className="graph-list">
                {(graph.nodes || []).slice(0, 12).map(n => (
                  <div key={`${n.type}-${n.id}`}><span className={`type-dot ${n.type.toLowerCase()}`} />{n.label}<small>{n.type}</small></div>
                ))}
              </div>
            </div>
          </div>
        }
      </section>
    </div>
  );
}

function Stat({ label, value, icon }) {
  return <div className="stat"><div className="stat-icon">{icon}</div><span>{label}</span><strong>{value}</strong></div>;
}

function PanelHeader({ title, subtitle }) {
  return <div className="panel-header"><div><h3>{title}</h3><p>{subtitle}</p></div></div>;
}

function Node({ label }) { return <div className="node-pill">{label}</div>; }
function Arrow({ label }) { return <div className="arrow"><span>{label}</span>→</div>; }

function Loading() {
  return <div className="loading"><div className="spinner" />Loading graph data...</div>;
}

function Empty({ text }) {
  return <div className="empty"><GitBranch size={25} /><p>{text}</p></div>;
}

function initials(name = "") {
  return name.split(" ").map(part => part[0]).slice(0, 2).join("").toUpperCase();
}

export default App;
