// index.js
import dotenv from "dotenv";
import { analyzeJob } from "./analyzer.js";
import { fetchAllJobs } from "./scraper.js";
import { supabase } from "./supabase.js";

dotenv.config();

async function run() {
  console.log("Fetching jobs...");
  const jobs = await fetchAllJobs();

  // Save jobs
  await supabase.from("jobs").upsert(jobs, { onConflict: "url" });

  console.log("Analyzing jobs...");

  const { data } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  for (const job of data) {
    const analysis = await analyzeJob(job);

    await supabase.from("job_analysis").upsert({
      job_id: job.id,
      ...analysis,
    });
  }

  console.log("Done");
}

run();
