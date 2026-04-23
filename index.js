import { analyzeJob } from "./analyzer.js";
import { fetchAllJobs } from "./scraper.js";
import { supabase } from "./supabase.js";

async function cleanupOldJobs() {
  console.log("Cleaning up old data...");
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

  // We want to delete jobs older than 12 hours, UNLESS they have a high match score (>80)
  // To do this reliably, we first find job_ids that are worth keeping
  const { data: keepData } = await supabase
    .from("job_analysis")
    .select("job_id")
    .gt("match_score", 80);

  const keepIds = keepData?.map((item) => item.job_id) || [];

  let query = supabase
    .from("jobs")
    .delete()
    .lt("created_at", twelveHoursAgo);

  if (keepIds.length > 0) {
    query = query.not("id", "in", `(${keepIds.join(",")})`);
  }

  const { error, count } = await query;

  if (error) {
    console.error("Cleanup error:", error.message);
  } else {
    console.log(`Cleanup complete. Removed old records.`);
  }
}

export async function run(search, resume) {
  await cleanupOldJobs();

  console.log(`Fetching jobs for: ${search || "Default keywords"}...`);
  const allJobs = await fetchAllJobs(search);
  console.log(`Fetched ${allJobs.length} jobs total.`);

  // Limit analysis to top 15 jobs to avoid excessive API calls
  const jobsToAnalyze = allJobs.slice(0, 15);
  console.log(`Analyzing top ${jobsToAnalyze.length} jobs for relevance...`);

  let addedCount = 0;

  for (const job of jobsToAnalyze) {
    // Check if job already exists to avoid redundant analysis
    const { data: existing } = await supabase
      .from("job_analysis")
      .select("id")
      .eq("job_id", job.id)
      .maybeSingle();

    if (existing) {
      // console.log(`Skipping: Job ${job.id} already analyzed.`);
      continue;
    }

    const analysis = await analyzeJob(job, resume);

    // Only push to DB if it's relevant (Match Score >= 20)
    if (analysis.match_score >= 20) {
      console.log(`[MATCH ${analysis.match_score}] Saving: ${job.title} @ ${job.company}`);
      
      // 1. Save the job
      const { error: jobError } = await supabase
        .from("jobs")
        .upsert(job, { onConflict: "url" });

      if (jobError) {
        console.error("Error saving job:", jobError.message);
        continue;
      }

      // 2. Save the analysis
      const { error: analysisError } = await supabase
        .from("job_analysis")
        .upsert({
          job_id: job.id,
          ...analysis,
        });

      if (analysisError) {
        console.error("Error saving analysis:", analysisError.message);
      } else {
        addedCount++;
      }
    } else {
      // console.log(`[SKIP ${analysis.match_score}] Irrelevant: ${job.title}`);
    }
  }

  console.log(`Done. Added ${addedCount} relevant jobs to the database.`);
}
