import fetch from "node-fetch";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
};

export async function fetchRemoteOK() {
  try {
    const res = await fetch("https://remoteok.com/api", { headers: HEADERS });
    const text = await res.text();
    
    try {
      const data = JSON.parse(text);
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
    } catch (e) {
      console.warn("RemoteOK returned non-JSON response (likely blocked):", text.slice(0, 50));
      return [];
    }
  } catch (error) {
    console.error("Error fetching RemoteOK:", error.message);
    return [];
  }
}

export async function fetchRemotive() {
  try {
    const res = await fetch("https://remotive.com/api/remote-jobs", { headers: HEADERS });
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
  } catch (error) {
    console.error("Error fetching Remotive:", error.message);
    return [];
  }
}

export async function fetchAllJobs() {
  const remoteok = await fetchRemoteOK();
  const remotive = await fetchRemotive();
  return [...remoteok, ...remotive];
}
