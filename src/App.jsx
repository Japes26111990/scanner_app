import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScanType } from 'html5-qrcode';
import { JobActionModal } from './components/JobActionModal';
import './App.css';
import tojemLogo from './assets/tojem-logo.png';

function App() {
  const [scannedJobId, setScannedJobId] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);
  const timeoutRef = useRef(null);

  // This function starts the scanner and the timeout
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
        (decodedText) => { // onScanSuccess
            setScannedJobId(decodedText);
            stopScanner(); // Stop scanning immediately on success
        },
        (errorMessage) => { /* onScanFailure, ignore */ }
    ).catch(err => {
        console.error("Unable to start scanning.", err);
        setIsScanning(false);
    });

    // Set a 5-minute timeout to stop the scanner automatically
    timeoutRef.current = setTimeout(() => {
        console.log("Scanner timed out due to inactivity.");
        stopScanner();
    }, 300000); // 5 minutes = 300,000 milliseconds
  };

  // This function stops the scanner and clears the timeout
  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
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
      {/* --- THIS IS THE UPDATED HEADER --- */}
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <img 
          src={tojemLogo} 
          alt="TOJEM Logo" 
          style={{ height: '80px', display: 'inline-block' }} 
        />
        {/* The <h1> title has been removed */}
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