import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScanType } from 'html5-qrcode';
import { JobActionModal } from './components/JobActionModal';
import { useWakeLock } from './hooks/useWakeLock';
import { auth } from './firebase'; // auth is exported from firebase.js now
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getDepartments, getEmployees } from './firestoreAPI';
import './App.css';
import tojemLogo from './assets/tojem-logo.png';

function App() {
  useWakeLock();

  const [scannedJobId, setScannedJobId] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [appData, setAppData] = useState({ departments: [], employees: [] });
  
  const scannerRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const email = import.meta.env.VITE_SCANNER_USER_EMAIL;
        const password = import.meta.env.VITE_SCANNER_USER_PASSWORD;
        await signInWithEmailAndPassword(auth, email, password);
        
        const [depts, emps] = await Promise.all([getDepartments(), getEmployees()]);
        setAppData({ departments: depts, employees: emps });

        setIsReady(true);
      } catch (error) {
        console.error("Initialization failed:", error);
        document.body.innerHTML = '<h1 style="color: red; text-align: center; margin-top: 50px;">App Initialization Failed.</h1>';
      }
    };
    
    initializeApp();
  }, []);

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

  if (!isReady) {
    return <h1 style={{ color: 'white' }}>Initializing Workshop App...</h1>;
  }

  return (
    <div>
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <img 
          src={tojemLogo} 
          alt="TOJEM Logo" 
          style={{ height: '80px', display: 'inline-block' }} 
        />
      </header>
      <main>
        <div id="qr-reader" style={{ width: '100%', border: isScanning ? 'none' : '2px dashed #374151', borderRadius: '8px', minHeight: '300px' }}></div>
        {!isScanning && !scannedJobId && (
            <div style={{ marginTop: '2rem' }}>
                <button className="button" style={{ padding: '1.5rem', fontSize: '1.5rem' }} onClick={startScanner}>Start Scanning</button>
            </div>
        )}
        {scannedJobId && (
            <JobActionModal 
                jobId={scannedJobId}
                departments={appData.departments}
                employees={appData.employees}
                onClose={handleModalClose}
            />
        )}
      </main>
    </div>
  );
}

export default App;