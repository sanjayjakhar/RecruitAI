import Groq from 'groq-sdk';

let _groq = null;
const getGroq = () => {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
};

export async function analyzeResume(
  resumeText,
  jobDescription,
  jobRequirements,
  skillsRequired
) {
  const prompt = `You are a senior HR recruiter. Carefully analyze the resume against the job requirements and return a structured JSON evaluation.

JOB TITLE/DESCRIPTION:
${jobDescription}

REQUIRED SKILLS:
${skillsRequired}

ADDITIONAL REQUIREMENTS:
${jobRequirements}

RESUME TEXT:
${resumeText.slice(0, 4000)}

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "name": "Full name from resume",
  "email": "Email from resume or empty string",
  "phone": "Phone from resume or empty string",
  "skills": ["skill1", "skill2", "skill3"],
  "experience": "X years in relevant field",
  "education": "Degree and field",
  "score": 75,
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["gap1", "gap2"],
  "summary": "2-sentence summary of candidate fit for this role",
  "fitReason": "Clear 2-3 sentence explanation of WHY this candidate is or is not a good fit for THIS specific job. Be specific about matching or missing skills/experience.",
  "bestFitRole": "The job title/role this candidate is most naturally suited for based on their overall profile, skills, and experience (e.g. 'Junior Frontend Developer', 'Full-Stack Engineer', 'Data Scientist'). If they are a perfect fit for this role, say so."
}

Scoring criteria (0–100):
- Skills match with required skills: 40 points
- Experience relevance and years: 30 points
- Education alignment: 15 points
- Overall profile quality: 15 points`;

  const completion = await getGroq().chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.1,
    max_tokens: 1000,
  });

  const raw = completion.choices[0]?.message?.content ?? '{}';

  try {
    const match = raw.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : JSON.parse(raw);
  } catch {
    return {
      name: 'Unknown Candidate',
      email: '',
      phone: '',
      skills: [],
      experience: 'Unknown',
      education: 'Unknown',
      score: 0,
      strengths: [],
      weaknesses: ['Resume could not be parsed automatically'],
      summary: 'Manual review required.',
      fitReason: 'Could not determine fit automatically.',
      bestFitRole: 'Unknown',
    };
  }
}
