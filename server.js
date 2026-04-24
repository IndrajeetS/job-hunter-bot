console.log("Starting Server...");
import express from "express";
import { run } from "./index.js";
import { supabase } from "./supabase.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Trigger job fetching and analysis
app.post("/run", async (req, res) => {
  try {
    const { resume, search } = req.body;
    console.log(`Triggering job run with search: "${search || "Default"}"...`);

    // Run the process in the background
    run(search, resume)
      .then(() => console.log("API-triggered run completed."))
      .catch((err) => console.error("API-triggered run failed:", err));

    res.status(202).json({
      message: "Job run started in background.",
      parameters: { search: search || "Default", hasResume: !!resume },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current jobs from database
app.get("/jobs", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const { data, error } = await supabase.from("jobs").select("id").limit(1);
    if (error) throw error;
    res.json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Database connection failed",
      details: error.message,
    });
  }
});

app.get("/", (req, res) => {
  res.json({ message: "Job Hunter Bot API is running." });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is definitely running and listening on 0.0.0.0:${port}`);
});
