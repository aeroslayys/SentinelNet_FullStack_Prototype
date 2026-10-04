const DEFAULT_TIMEOUT_MS = 30_000;

function mlBaseUrl() {
  return String(process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
}

export async function getMlHealth() {
  try {
    const response = await fetch(`${mlBaseUrl()}/health`, {
      signal: AbortSignal.timeout(Number(process.env.ML_REQUEST_TIMEOUT_MS || 3000))
    });
    if (!response.ok) return { status: 'unavailable' };
    return await response.json();
  } catch {
    return { status: 'unavailable' };
  }
}

export async function analyzeBatch(posts) {
  let response;
  try {
    response = await fetch(`${mlBaseUrl()}/analyze/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        posts: posts.map((post) => ({
          id: post.id,
          handle: post.handle,
          text: post.text
        }))
      }),
      signal: AbortSignal.timeout(Number(process.env.ML_REQUEST_TIMEOUT_MS || DEFAULT_TIMEOUT_MS))
    });
  } catch (error) {
    const wrapped = new Error(`NLP service unavailable at ${mlBaseUrl()}. Start the FastAPI service before running analysis.`);
    wrapped.status = 503;
    wrapped.cause = error;
    throw wrapped;
  }

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`NLP service failed (${response.status}): ${body.slice(0, 250)}`);
    error.status = 502;
    throw error;
  }

  const payload = await response.json();
  if (!Array.isArray(payload.items)) {
    const error = new Error('NLP service returned an invalid batch response.');
    error.status = 502;
    throw error;
  }

  return payload;
}
