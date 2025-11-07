export const config = {
    // Vercel-specific
    runtime: 'edge',
  };
  
  export async function POST({ request, fetch }) {
    let response = fetch('https://plausible.io/api/event', {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
  
    return response;
  }
  