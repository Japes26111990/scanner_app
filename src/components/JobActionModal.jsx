import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp, increment } from 'firebase/firestore';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

// We can reuse the button styles from App.css
import '../App.css'; 

export const JobActionModal = ({ jobId, onClose }) => {
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- NEW: State to manage the view inside the modal ---
    // 'details', 'confirm', 'success', 'error'
    const [view, setView] = useState('details'); 
    const [actionToConfirm, setActionToConfirm] = useState(null);

    // This useEffect still runs as soon as the modal opens to fetch the job details
    useEffect(() => {
        const fetchJobDetails = async () => {
            setLoading(true);
            setError(null);
            setView('details'); // Start at the details view
            try {
                const q = query(collection(db, "createdJobCards"), where("jobId", "==", jobId));
                const querySnapshot = await getDocs(q);
                
                if (querySnapshot.empty) {
                    throw new Error("No job found with this ID.");
                }
                
                const jobDoc = querySnapshot.docs[0];
                setJob({ id: jobDoc.id, ...jobDoc.data() });

            } catch (err) {
                setError(err.message);
                setView('error');
            } finally {
                setLoading(false);
            }
        };

        if (jobId) {
            fetchJobDetails();
        }
    }, [jobId]);

    // This function now just sets up the confirmation view
    const handleActionClick = (status, label, color) => {
        setActionToConfirm({ status, label, color });
        setView('confirm');
    };

    // This new function executes the database update
    const executeStatusUpdate = async () => {
        if (!job || !actionToConfirm) return;

        setLoading(true);
        try {
            const jobDocRef = doc(db, "createdJobCards", job.id);
            const newStatus = actionToConfirm.status;
            const dataToUpdate = { status: newStatus };

            // Add timestamp logic
            if (newStatus === 'In Progress' && !job.startedAt) {
                dataToUpdate.startedAt = serverTimestamp();
            } else if (newStatus === 'In Progress' && job.status === 'Paused' && job.pausedAt) {
                const pauseDuration = new Date().getTime() - job.pausedAt.toDate().getTime();
                dataToUpdate.totalPausedMilliseconds = increment(pauseDuration);
            } else if (newStatus === 'Paused') {
                dataToUpdate.pausedAt = serverTimestamp();
            } else if (newStatus === 'Awaiting QC') {
                dataToUpdate.completedAt = serverTimestamp();
            }

            await updateDoc(jobDocRef, dataToUpdate);
            setView('success'); // Switch to the success view

            // Automatically close the modal after showing success message
            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (err) {
            setError("Failed to update status.");
            setView('error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    // --- The content of the modal now depends on the 'view' state ---
    const renderContent = () => {
        if (loading && view === 'details') {
            return <p>Loading job...</p>;
        }

        if (view === 'error') {
            return (
                <div style={{ textAlign: 'center' }}>
                    <XCircle size={60} className="error-text" style={{ margin: '0 auto' }}/>
                    <h3 className="error-text" style={{ fontSize: '1.5rem' }}>Error</h3>
                    <p>{error}</p>
                    <button className="button button-reset" onClick={onClose}>Close</button>
                </div>
            );
        }

        if (view === 'success') {
            return (
                <div style={{ textAlign: 'center' }}>
                    <CheckCircle size={60} style={{ color: '#4ade80', margin: '0 auto' }}/>
                    <h3 style={{ fontSize: '1.5rem' }}>Status Updated!</h3>
                    <p>The job is now "{actionToConfirm?.label}".</p>
                </div>
            );
        }

        if (view === 'confirm' && actionToConfirm) {
            return (
                <div style={{ textAlign: 'center' }}>
                    <AlertTriangle size={60} style={{ color: actionToConfirm.color, margin: '0 auto' }}/>
                    <h3 style={{ fontSize: '1.5rem' }}>Are you sure?</h3>
                    <p>You are about to change the status to "{actionToConfirm.label}".</p>
                    <div className="actions" style={{ marginTop: '2rem' }}>
                        <button className="button button-secondary" onClick={() => setView('details')}>Cancel</button>
                        <button className="button" style={{ backgroundColor: actionToConfirm.color }} onClick={executeStatusUpdate} disabled={loading}>
                            {loading ? 'Confirming...' : 'Yes, Confirm'}
                        </button>
                    </div>
                </div>
            );
        }

        if (view === 'details' && job) {
            return (
                <>
                    <div className="job-details" style={{ borderBottom: '1px solid #374151', paddingBottom: '1rem', marginBottom: '1rem' }}>
                      <p><strong>Part:</strong> {job.partName}</p>
                      <p><strong>Employee:</strong> {job.employeeName}</p>
                      <p><strong>Status:</strong> <span className="status-text">{job.status}</span></p>
                    </div>

                    <div className="actions">
                      <button className="button" onClick={() => handleActionClick('In Progress', 'Start Job', '#2563eb')} disabled={job.status === 'In Progress'}>Start Job</button>
                      <button className="button button-secondary" onClick={() => handleActionClick('Paused', 'Pause Job', '#4b5563')} disabled={job.status === 'Paused'}>Pause</button>
                      <button className="button button-complete" onClick={() => handleActionClick('Awaiting QC', 'Complete Job', '#16a34a')}>Complete Job</button>
                    </div>
                </>
            );
        }
        
        return <p>Waiting for job data...</p>; // Default case
    };


    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="card" onClick={(e) => e.stopPropagation()}>
                {renderContent()}
            </div>
        </div>
    );
};