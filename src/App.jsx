import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

function App() {
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // This effect runs only once when the component mounts
    
    const onScanSuccess = (decodedText, decodedResult) => {
      // When a QR code is successfully scanned, this function is called.
      setScanResult(decodedText);
      // We don't need to manually stop the scanner; the library handles it
      // when we return true from the callback.
    };

    const onScanFailure = (errorMessage) => {
      // This is called frequently, so we can ignore it to avoid spamming the console.
      // console.warn(`Code scan error = ${errorMessage}`);
    };

    // The configuration for our scanner.
    let config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true, // Good for mobile devices
    };

    // Create a new scanner instance. 
    // "qr-reader" is the ID of the div where the camera view will be rendered.
    const html5QrcodeScanner = new Html5QrcodeScanner("qr-reader", config, /* verbose= */ false);
    
    // Start scanning.
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);

  }, []); // The empty array ensures this effect runs only once.

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#7dd3fc', letterSpacing: '1px' }}>
          TOJEM Workshop Scanner
        </h1>
      </header>

      <main>
        {/* The div where the scanner will mount the camera view */}
        <div id="qr-reader" style={{ width: '100%' }}></div>

        {/* This section will show the result after a successful scan */}
        {scanResult && (
          <div style={{ marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem' }}>Scan Result</h2>
            <div style={{ marginTop: '1rem', padding: '2rem', backgroundColor: '#1f2937', borderRadius: '8px' }}>
              <p style={{ color: '#4ade80', margin: 0, wordBreak: 'break-all' }}>
                <b>Success:</b> {scanResult}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;