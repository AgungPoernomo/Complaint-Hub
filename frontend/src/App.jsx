import { useEffect, useState } from 'react';
import { apiGet } from './lib/api.js';

export default function App() {
  const [status, setStatus] = useState('memeriksa');

  // Cek koneksi ke backend (/api/health)
  useEffect(() => {
    apiGet('/health')
      .then((d) => setStatus(d.ok ? 'terhubung' : 'bermasalah'))
      .catch(() => setStatus('tidak terhubung'));
  }, []);

  const warna =
    status === 'terhubung'
      ? 'bg-teal-100 text-teal-800'
      : status === 'memeriksa'
        ? 'bg-slate-100 text-slate-700'
        : 'bg-red-100 text-red-800';

  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <p className="text-sm font-semibold tracking-widest text-teal-700">SATORIA PHARMA</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Complaint Hub</h1>
        <p className="mt-2 text-slate-600">Sistem Digital Penerimaan Keluhan Teknis dan Fisik Produk</p>
        <span className={`mt-6 inline-block rounded-full px-4 py-1 text-sm font-medium ${warna}`}>
          Status layanan: {status}
        </span>
      </div>
    </main>
  );
}

