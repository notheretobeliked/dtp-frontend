export const config = {
    // Vercel-specific
    runtime: 'edge',
  };
  
  export function GET({ fetch }) {
    return fetch('https://plausible.io/js/script.js');
  }