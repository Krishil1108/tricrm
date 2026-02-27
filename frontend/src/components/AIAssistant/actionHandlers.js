// ============================================================
// AI Assistant — Action Handlers
// Calls existing REST APIs to execute confirmed actions.
// ============================================================
import axios from 'axios';
import API_BASE_URL from '../../config/api';

const API = API_BASE_URL;

// Auth header from localStorage (same pattern as all other services)
function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Create Client ──────────────────────────────────────────
export async function createClient(data) {
  const payload = {
    name: data.name,
    email: data.email || undefined,
    phone: data.phone || undefined,
    company: data.company || undefined,
    city: data.city || undefined,
    state: data.state || undefined,
    status: data.status || 'Active',
  };
  const res = await axios.post(`${API}/clients`, payload, {
    headers: authHeader(),
  });
  return res.data;
}

// ── Create Associate ──────────────────────────────────────
export async function createAssociate(data) {
  const payload = {
    name: data.name,
    email: data.email,
    phone: data.phone || undefined,
    company: data.company || undefined,
    city: data.city || undefined,
    state: data.state || undefined,
    status: data.status || 'Active',
  };
  const res = await axios.post(`${API}/associates`, payload, {
    headers: authHeader(),
  });
  return res.data;
}

// ── Create Meeting ──────────────────────────────────────
export async function createMeeting(data) {
  const payload = {
    title: data.title,
    dateTime: data.dateTime,
    type: data.meetingType || 'Meeting',
    priority: data.priority || 'Medium',
    location: data.location || undefined,
    description: data.description || undefined,
    duration: data.duration ? Number(data.duration) : 60,
    status: 'Scheduled',
  };
  const res = await axios.post(`${API}/meetings`, payload, {
    headers: authHeader(),
  });
  return res.data;
}

// ── Create Note ──────────────────────────────────────────
export async function createNote(data) {
  const payload = {
    title: data.noteTitle,
    content: data.noteContent,
    category: data.noteCategory || 'General',
    priority: data.notePriority || 'Medium',
    status: 'Active',
  };
  const res = await axios.post(`${API}/notes`, payload, {
    headers: authHeader(),
  });
  return res.data;
}

// ── Find Clients ──────────────────────────────────────────
export async function findClients(query) {
  const res = await axios.get(`${API}/clients`, {
    headers: authHeader(),
  });
  const all = res.data?.data || res.data || [];
  const q = query.toLowerCase();
  return all.filter(
    c =>
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
  );
}

// ── Find Associates ───────────────────────────────────────
export async function findAssociates(query) {
  const res = await axios.get(`${API}/associates`, {
    headers: authHeader(),
  });
  const all = res.data?.data || res.data || [];
  const q = query.toLowerCase();
  return all.filter(
    a =>
      a.name?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.company?.toLowerCase().includes(q) ||
      a.phone?.includes(q)
  );
}

// ── Dispatcher ───────────────────────────────────────────
// Single entry point used by AIAssistant.js
export async function executeAction(action, data) {
  switch (action) {
    case 'create_client':
      return createClient(data);
    case 'create_associate':
      return createAssociate(data);
    case 'create_meeting':
      return createMeeting(data);
    case 'create_note':
      return createNote(data);
    case 'find_client':
      return findClients(data.query);
    case 'find_associate':
      return findAssociates(data.query);
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
