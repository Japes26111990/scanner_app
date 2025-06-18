import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { JobActionModal } from './components/JobActionModal';
import './App.css';

function App() {
  const [scannedJobId, setScannedJobId] = useState(null);

  useEffect(() => {
    // This function will be called on successful scan
    function onScanSuccess(decodedText, decodedResult) {
      setScannedJobId(decodedText);
    }

    // UPDATED Configuration for the scanner
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true, // Asks browser to remember permission
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      camera: {
        facingMode: "environment" // This requests the back camera on mobile devices
      }
    };
    
    const html5QrcodeScanner = new Html5QrcodeScanner("qr-reader", config, false);
    html5QrcodeScanner.render(onScanSuccess);

    // Cleanup function to stop the scanner when the component unmounts
    return () => {
      html5QrcodeScanner.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner.", error);
      });
    };
  }, []);

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#7dd3fc', letterSpacing: '1px' }}>
          TOJEM Workshop Scanner
        </h1>
      </header>

      <main>
        {/* The scanner view will always be ready. The modal will appear over it. */}
        <div id="qr-reader" style={{ width: '100%', border: '2px dashed #374151', borderRadius: '8px' }}></div>
        
        {/* Conditionally render the modal when a job ID has been scanned */}
        {scannedJobId && (
            <JobActionModal 
                jobId={scannedJobId}
                onClose={() => setScannedJobId(null)} // This will close the modal and make the scanner active again
            />
        )}
      </main>
    </div>
  );
}

export default App;