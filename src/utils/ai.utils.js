// ai.utils.js
const HF_TOKENS = [
  process.env.HF_TOKEN1,
  process.env.HF_TOKEN2,
  process.env.HF_TOKEN3,
  // add more tokens here
];

function getRandomToken() {
  const index = Math.floor(Math.random() * HF_TOKENS.length);
  return HF_TOKENS[index];
}

export async function queryPrompt(prompt) {
  const data = {
    messages: [
      { role: "user", content: prompt }
    ],
    model: "openai/gpt-oss-120b",
  };

  try {
    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        headers: {
          Authorization: `Bearer ${getRandomToken()}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error querying the API:", error);
    return null;
  }
}
