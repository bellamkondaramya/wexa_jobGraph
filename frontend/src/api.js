const API_URL = import.meta.env.VITE_API_URL || "https://wexa-jobgraph-vuuh.onrender.com/api";

async function request(path) {
  const response = await fetch(`${API_URL}${path}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

export const api = {
  dashboard: () => request("/dashboard"),
  candidates: () => request("/candidates"),
  candidate: (id) => request(`/candidates/${id}`),
  recommendations: (id) => request(`/candidates/${id}/recommendations`),
  jobs: () => request("/jobs"),
  job: (id) => request(`/jobs/${id}`),
  companies: () => request("/companies"),
  skills: () => request("/skills"),
  graph: (id) => request(`/graph/${id}`)
};
