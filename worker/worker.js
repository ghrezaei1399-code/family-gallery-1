/* Optional Cloudflare Worker starter. No persistence or authentication is provided.
   Do not deploy as a production gallery API without identity, authorization, validation,
   storage, rate limiting, and audit logging. */
export default {
 async fetch(request, env) {
  const url = new URL(request.url);
  const headers = {'content-type':'application/json; charset=utf-8','x-content-type-options':'nosniff','cache-control':'no-store'};
  if (request.method === 'OPTIONS') return new Response(null,{status:204,headers:{...headers,'access-control-allow-methods':'GET, OPTIONS','access-control-allow-origin':'*'}});
  if (url.pathname === '/health' && request.method === 'GET') return new Response(JSON.stringify({ok:true,service:'family-gallery-worker',mode:'starter-only'}),{headers});
  return new Response(JSON.stringify({error:'Not implemented',message:'This starter has no API, authentication, or data storage.'}),{status:404,headers});
 }
};