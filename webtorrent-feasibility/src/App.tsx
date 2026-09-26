import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import type { Torrent } from 'webtorrent';
import WebTorrent from 'webtorrent/dist/webtorrent.min.js';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const clientRef = useRef<WebTorrent | null>(null);
  const [clientReady, setClientReady] = useState(false);
  const [magnetURI, setMagnetURI] = useState<string | null>(null);
  const [torrent, setTorrent] = useState<Torrent | null>(null);

  useEffect(() => {
    const client = new WebTorrent();
    clientRef.current = client;

    setClientReady(true);

    return () => {
      clientRef.current = null;
      client.destroy();
    };
  }, []);

  function seedFile(e: ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;
    if (!clientRef.current) return;

    setFile(selectedFile);
    clientRef.current.seed(selectedFile, (torrent) => {
      setMagnetURI(torrent.magnetURI);
    });
  }

  return (
    <main>
      <h1>WebTorrent Feasibility Test</h1>

      <h2>WebTorrent Client Status</h2>
      <p>Connected: {clientRef.current ? 'Yes' : 'No'}</p>

      <fieldset>
        <legend>Upload a file</legend>
        <input type='file' onChange={seedFile} />
      </fieldset>

      <p>Seeded file: {file?.name || 'No file selected'}</p>
      <h3>Magnet URI</h3>
      <p>{magnetURI || 'No torrent created yet'}</p>

      <h2>Video Player</h2>
    </main>
  );
}

export default App;
