import fetch from "node-fetch";

const RESUME = process.env.RESUME_TEXT || `PASTE YOUR RESUME TEXT HERE`;

export async function analyzeJob(job) {
  if (!process.env.AI_URL) {
    console.warn("AI_URL is not set in .env. Skipping analysis.");
    return { match_score: 0, missing_skills: [], strengths: [], summary: "AI_URL missing" };
  }

  const prompt = `
Return JSON only:

{
 "match_score": number (0-100),
 "missing_skills": ["max 5"],
 "strengths": ["max 5"],
 "summary": "1 line"
}

Job:
${job.description || "No description provided"}

Resume:
${RESUME}
`;

  try {
    const res = await fetch(process.env.AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307", // Default model
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await res.json();
    
    // Simple extraction logic - might need adjustment based on specific API provider
    const content = data.content?.[0]?.text || data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content returned from AI");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error(`Error analyzing job ${job.id}:`, error.message);
    return {
      match_score: 0,
      missing_skills: ["Error during analysis"],
      strengths: [],
      summary: "Analysis failed",
    };
  }
}
