const requiredEnv = ["OPENAI_API_KEY", "WORKFLOW_ID"];

function validateEnv() {
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}.`
    );
  }
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    validateEnv();
    const { user = "guest" } = JSON.parse(event.body || "{}") || {};

    const response = await fetch("https://api.openai.com/v1/chatkit/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "chatkit_beta=v1",
      },
      body: JSON.stringify({
        workflow: { id: process.env.WORKFLOW_ID },
        user,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const error =
        data?.error?.message || data?.message || "Unable to create session";
      return { statusCode: response.status, body: JSON.stringify({ error }) };
    }

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ client_secret: data.client_secret }),
    };
  } catch (error) {
    console.error("ChatKit session error", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message || "Server error" }),
    };
  }
}
