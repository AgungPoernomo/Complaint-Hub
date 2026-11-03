// Pembungkus fetch ke backend. Token Firebase ditambahkan di Fase 1.
export async function apiGet(path) {
  const res = await fetch(`/api${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

