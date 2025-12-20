import { query } from "../../../../utils/ai.utils";

export async function enrichLead(email, company) {
  const data = {
    messages: [
      {
        role: "user",
        content: `
          Analyze this lead:
          Email: ${email}
          Company: ${company}

          Return JSON with:
          {
            "email": "...",
            "role": "...",
            "company": "...",
            "likelihood_to_convert": 0-1
          }
        `,
      },
    ],
    model: "openai/gpt-oss-120b",
  };

  const result = await query(data);

  try {
    return JSON.parse(result.choices[0].message.content);
  } catch {
    return { email, company, role: "unknown", likelihood_to_convert: 0.3 };
  }
}
