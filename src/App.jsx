import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { db, auth } from './firebase'; // Import auth
import { signInWithEmailAndPassword } from 'firebase/auth'; // Import sign-in function
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp, increment } from 'firebase/firestore';
import './App.css';
import { JobActionModal } from './components/JobActionModal';


function App() {
  const [scannedJobId, setScannedJobId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false); // New state to track login status
  const scannerRef = useRef(null);

  // --- NEW: useEffect for automatic login ---
  useEffect(() => {
    const email = import.meta.env.VITE_SCANNER_USER_EMAIL;
    const password = import.meta.env.VITE_SCANNER_USER_PASSWORD;

    const authenticate = async () => {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        setIsAuthReady(true); // Login successful, app is ready
      } catch (error) {
        console.error("Authentication failed:", error);
        // Display a permanent error if login fails, as the app cannot work.
        document.body.innerHTML = '<h1 style="color: red; text-align: center; margin-top: 50px;">Authentication Failed. Check scanner credentials.</h1>';
      }
    };
    
    authenticate();
  }, []); // Runs only once on app startup


  useEffect(() => {
    if (!isAuthReady || scannerRef.current) return; // Don't initialize scanner until logged in

    const onScanSuccess = (decodedText) => {
      setScannedJobId(decodedText);
    };

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      camera: { facingMode: "environment" }
    };
    
    const html5QrcodeScanner = new Html5QrcodeScanner("qr-reader", config, false);
    html5QrcodeScanner.render(onScanSuccess);
    scannerRef.current = html5QrcodeScanner;

  }, [isAuthReady]); // Dependency on auth status

  // When the modal closes, we clear the scanner and it will be re-rendered
  const handleModalClose = () => {
      if(scannerRef.current) {
          // A short delay can help ensure the UI is ready for the scanner to restart
          setTimeout(() => {
              if(!scannerRef.current.isScanning) {
                 scannerRef.current.render( (decodedText) => setScannedJobId(decodedText) );
              }
          }, 100);
      }
      setScannedJobId(null);
  }

  // If not authenticated, show a loading message
  if (!isAuthReady) {
    return <h1 style={{ color: 'white' }}>Authenticating Scanner...</h1>;
  }

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#7dd3fc', letterSpacing: '1px' }}>
          TOJEM Workshop Scanner
        </h1>
      </header>

      <main>
        <div id="qr-reader" style={{ display: scannedJobId ? 'none' : 'block', width: '100%' }}></div>
        
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