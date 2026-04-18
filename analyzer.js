import fetch from "node-fetch";

const RESUME = `PASTE YOUR RESUME TEXT HERE`;

export async function analyzeJob(job) {
  const prompt = `
Return JSON only:

{
 "match_score": number (0-100),
 "missing_skills": ["max 5"],
 "strengths": ["max 5"],
 "summary": "1 line"
}

Job:
${job.description}

Resume:
${RESUME}
`;

  const res = await fetch("YOUR_LLM_API", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.AI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  return JSON.parse(data.content[0].text);
}
