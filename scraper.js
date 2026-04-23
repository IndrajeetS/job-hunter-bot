import fetch from "node-fetch";
import crypto from "crypto";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Accept": "application/json",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://remoteok.com/",
};

/**
 * Generates a deterministic UUID v5-like string from an input.
 * This ensures the same job from the same source always has the same UUID.
 */
function generateStableUUID(inputString) {
  const hash = crypto.createHash("sha1").update(inputString).digest("hex");
  // Format as 8-4-4-4-12
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

export async function fetchRemoteOK(search = "flutter") {
  try {
    const res = await fetch("https://remoteok.com/api", { headers: HEADERS });
    const text = await res.text();

    try {
      const data = JSON.parse(text);
      // Filter out the legal notice (first element)
      let jobs = data.slice(1);

      // Simple keyword filtering for RemoteOK
      if (search) {
        const keywords = search.toLowerCase().split(/[ \/]+/);
        jobs = jobs.filter((job) => {
          const content = `${job.position} ${job.description} ${job.company}`.toLowerCase();
          return keywords.some((kw) => content.includes(kw));
        });
      }

      return jobs.map((job) => ({
        id: generateStableUUID(`remoteok-${job.id}`),
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

export async function fetchRemotive(search = "flutter") {
  try {
    const url = search 
      ? `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(search)}`
      : "https://remotive.com/api/remote-jobs";
    
    const res = await fetch(url, { headers: HEADERS });
    const data = await res.json();
    return data.jobs.map((job) => ({
      id: generateStableUUID(`remotive-${job.id}`),
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

export async function fetchAllJobs(search = "Senior mobile/flutter developer/engineer") {
  const remoteok = await fetchRemoteOK(search);
  const remotive = await fetchRemotive(search);
  return [...remoteok, ...remotive];
}
