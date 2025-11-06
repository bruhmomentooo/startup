import React, { useEffect, useState } from 'react';
import './about-photos.css';

export function AboutPhotos({ query = 'workspace', perPage = 8 }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Call server-side proxy to hide API key
        const res = await fetch('/api/photo-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, perPage })
        });
        if (!res.ok) throw new Error(`Photo proxy error ${res.status}`);
        const data = await res.json();
        if (!cancelled) setPhotos(data.results || []);
      } catch (err) {
        if (!cancelled) setError(err.message || String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [query, perPage]);

  return (
    <section className="about-photos">
      {loading && <div className="about-photos__loading">Loading photos…</div>}
      {error && <div className="about-photos__error">{error}</div>}
      <div className="about-photos__grid">
        {photos.map(p => (
          <a key={p.id} className="about-photos__item" href={p.links.html} target="_blank" rel="noopener noreferrer">
            <img src={p.urls.small} alt={p.alt_description || 'photo'} loading="lazy" />
          </a>
        ))}
      </div>
      <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>Photos from Unsplash</p>
    </section>
  );
}

export default AboutPhotos;
