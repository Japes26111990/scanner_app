import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScanType } from 'html5-qrcode';
import { JobActionModal } from './components/JobActionModal';
import './App.css';
import tojemLogo from './assets/tojem-logo.png'; // 1. Import the logo at the top

function App() {
  const [scannedJobId, setScannedJobId] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);
  const timeoutRef = useRef(null);

  const startScanner = () => {
    if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-reader");
    }
    
    setIsScanning(true);

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
    };

    scannerRef.current.start(
        { facingMode: "environment" }, 
        config, 
        (decodedText) => {
            setScannedJobId(decodedText);
            stopScanner();
        },
        (errorMessage) => { /* ignore */ }
    ).catch(err => {
        console.error("Unable to start scanning.", err);
        setIsScanning(false);
    });

    timeoutRef.current = setTimeout(() => {
        console.log("Scanner timed out due to inactivity.");
        stopScanner();
    }, 300000);
  };

  const stopScanner = () => {
    // Check if the scanner has the stop method before calling it
    if (scannerRef.current && typeof scannerRef.current.stop === 'function' && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Failed to stop scanner.", err));
    }
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
    }
    setIsScanning(false);
  };

  const handleModalClose = () => {
    setScannedJobId(null);
  };

  return (
    <div>
      {/* 2. Update the header to include the image and flexbox styles for alignment */}
      <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <img src={tojemLogo} alt="TOJEM Logo" style={{ height: '50px' }} />
        <h1 style={{ fontSize: '2.5rem', color: '#7dd3fc', letterSpacing: '1px', margin: 0 }}>
          Workshop Scanner
        </h1>
      </header>

      <main>
        <div id="qr-reader" style={{ width: '100%', border: isScanning ? 'none' : '2px dashed #374151', borderRadius: '8px', minHeight: '300px' }}></div>
        
        {!isScanning && !scannedJobId && (
            <div style={{ marginTop: '2rem' }}>
                <button className="button" style={{ padding: '1.5rem', fontSize: '1.5rem' }} onClick={startScanner}>
                    Start Scanning
                </button>
            </div>
        )}
        
        {scannedJobId && (
            <JobActionModal 
                jobId={scannedJobId}
                onClose={handleModalClose}
            />
        )}
      </main>
    </div>
  );
}

export default App;