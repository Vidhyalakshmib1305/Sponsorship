// frontend/src/lib/api.js
// All calls to our Express backend

import { supabase } from './supabaseClient';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

async function req(method, path, body) {
  const token = await getToken();
  const res   = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  getCreator:        ()       => req('GET',  '/api/creator'),
  updateCreator:     (body)   => req('PUT',  '/api/creator', body),
  getBrands:         ()       => req('GET',  '/api/brands'),
  getPitches:        ()       => req('GET',  '/api/pitches'),
  getStats:          ()       => req('GET',  '/api/stats'),
  getNotifications:  ()       => req('GET',  '/api/notifications'),
  runPipeline:       (opts)   => req('POST', '/api/pipeline/run', opts),
  getPipelineStatus: (id)     => req('GET',  `/api/pipeline/status/${id}`),
  uploadPhoto:       (body)   => req('POST', '/api/upload/photo', body),
  uploadPosts:       (body)   => req('POST', '/api/upload/posts', body),
  fetchInstagram:    (handle) => req('GET',  `/api/instagram/fetch/${encodeURIComponent(handle)}`),
};