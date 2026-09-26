import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import type { Torrent } from 'webtorrent';
import WebTorrent from 'webtorrent/dist/webtorrent.min.js';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const clientRef = useRef<WebTorrent | null>(null);
  const [clientReady, setClientReady] = useState(false);
  const [torrent, setTorrent] = useState<Torrent | null>(null);
  const [magnetInput, setMagnetInput] = useState('');
  const [seededMagnetURI, setSeededMagnetURI] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [peerCount, setPeerCount] = useState(0);

  useEffect(() => {
    const client = new WebTorrent();
    clientRef.current = client;

    let cancelled = false;

    async function initClient() {
      try {
        await navigator.serviceWorker.register('/sw.min.js');

        const registration = await navigator.serviceWorker.ready;

        if (cancelled) return;

        client.createServer({ controller: registration });
        setClientReady(true);
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to initialize WebTorrent:', error);
        }
      }
    }

    void initClient();

    return () => {
      cancelled = true;
      clientRef.current = null;
      client.destroy();
    };
  }, []);

  useEffect(() => {
    if (!torrent) return;

    const interval = window.setInterval(() => {
      setDownloadProgress(torrent.progress * 100);
      setPeerCount(torrent.numPeers);
    }, 500);

    return () => {
      window.clearInterval(interval);
    };
  }, [torrent]);

  function seedFile(e: ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;
    if (!clientRef.current) return;

    setFile(selectedFile);
    clientRef.current.seed(selectedFile, (torrent) => {
      setSeededMagnetURI(torrent.magnetURI);
    });
  }

  function joinTorrent() {
    const client = clientRef.current;
    const magnet = magnetInput.trim();

    if (!client || !magnet) return;

    client.add(magnet, (torrent) => {
      setTorrent(torrent);

      console.log(
        'Torrent files:',
        torrent.files.map((file) => file.name),
      );

      const videoFile = torrent.files.find((file) =>
        file.name.toLowerCase().endsWith('.mp4'),
      );

      if (!videoFile) {
        console.error('No MP4 file found in torrent');
        return;
      }

      const videoElement = videoRef.current;

      if (!videoElement) {
        console.error('Video element is not available');
        return;
      }

      videoFile.streamTo(videoElement);
    });
  }

  console.log({
    progress: torrent?.progress,
    downloaded: torrent?.downloaded,
    received: torrent?.received,
    length: torrent?.length,
    peers: torrent?.numPeers,
    downloadSpeed: torrent?.downloadSpeed,
  });

  return (
    <main>
      <h1>WebTorrent Feasibility Test</h1>

      <h2>WebTorrent Client Status</h2>
      <p>Client ready: {clientReady ? 'Yes' : 'No'}</p>

      <fieldset>
        <legend>Upload a file</legend>
        <input type='file' onChange={seedFile} />
      </fieldset>

      <p>Seeded file: {file?.name || 'No file selected'}</p>
      <h3>Magnet URI</h3>
      <p>{seededMagnetURI || 'No torrent created yet'}</p>

      {torrent && (
        <section>
          <h2>Joined Torrent</h2>
          <p>Name: {torrent.name}</p>

          <h3>Files</h3>
          <ul>
            {torrent.files.map((file) => (
              <li key={file.path}>{file.name}</li>
            ))}
          </ul>
        </section>
      )}

      <h2>Video Player</h2>

      <video ref={videoRef} controls width='720' />

      {torrent && (
        <section>
          <p>Peers: {peerCount}</p>
          <p>Downloaded: {downloadProgress.toFixed(1)}%</p>
        </section>
      )}

      <fieldset>
        <legend>Enter a magnet URI</legend>
        <input
          type='text'
          value={magnetInput}
          onChange={(e) => setMagnetInput(e.target.value)}
        />

        <button onClick={joinTorrent}>Join Torrent</button>
      </fieldset>
    </main>
  );
}

export default App;
