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
        const key = import.meta.env.VITE_UNSPLASH_KEY;
        if (!key) throw new Error('Missing VITE_UNSPLASH_KEY environment variable');
        const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}`;
        const res = await fetch(url, { headers: { Authorization: `Client-ID ${key}` } });
        if (!res.ok) throw new Error(`Unsplash error ${res.status}`);
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
      <h3>Photos</h3>
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
