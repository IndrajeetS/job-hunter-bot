import fetch from "node-fetch";

export async function fetchRemoteOK() {
  const res = await fetch("https://remoteok.com/api");
  const data = await res.json();
  // Filter out the legal notice (first element) and map jobs
  return data.slice(1).map((job) => ({
    id: `remoteok-${job.id}`,
    title: job.position,
    company: job.company,
    url: job.url,
    description: job.description,
    source: "RemoteOK",
    created_at: new Date(job.date).toISOString(),
  }));
}

export async function fetchRemotive() {
  const res = await fetch("https://remotive.com/api/remote-jobs");
  const data = await res.json();
  return data.jobs.map((job) => ({
    id: `remotive-${job.id}`,
    title: job.title,
    company: job.company_name,
    url: job.url,
    description: job.description,
    source: "Remotive",
    created_at: new Date(job.publication_date).toISOString(),
  }));
}

export async function fetchAllJobs() {
  const remoteok = await fetchRemoteOK();
  const remotive = await fetchRemotive();
  return [...remoteok, ...remotive];
}
