import React from 'react';

export default function ApiDocs() {
  return (
    <div className="p-10 font-sans">
      <h1 className="text-2xl font-bold mb-4">API Documentation</h1>
      <p className="mb-4">Herbaformadaqal.com API-si üçün rəsmi sənədlər.</p>
      <ul className="list-disc pl-5">
        <li>
          <strong>API Catalog:</strong> <a href="/.well-known/api-catalog" className="text-emerald-600 underline">/.well-known/api-catalog</a>
        </li>
        <li>
          <strong>Robots:</strong> <a href="/robots.txt" className="text-emerald-600 underline">/robots.txt</a>
        </li>
      </ul>
    </div>
  );
}
