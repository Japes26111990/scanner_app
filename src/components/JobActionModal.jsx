import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp, increment } from 'firebase/firestore';
import '../App.css'; 

export const JobActionModal = ({ jobId, onClose }) => {
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchJobDetails = async () => {
            setLoading(true);
            setError(null);
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
            } finally {
                setLoading(false);
            }
        };

        if (jobId) {
            fetchJobDetails();
        }
    }, [jobId]);

    const handleUpdateStatus = async (newStatus) => {
        if (!job) return;
        setLoading(true);
        try {
            const jobDocRef = doc(db, "createdJobCards", job.id);
            const dataToUpdate = { status: newStatus };

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
            alert(`Job status updated to: ${newStatus}`);
            onClose(); // Close the modal on success
        } catch (err) {
            setError("Failed to update status.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="card" onClick={(e) => e.stopPropagation()}>
                <h2 style={{ fontSize: '1.5rem', marginTop: 0 }}>Scanned Job</h2>
                
                {loading && <p>Loading job...</p>}
                {error && <p className="error-text">Error: {error}</p>}
                
                {job && (
                  <>
                    <div className="job-details" style={{ borderBottom: '1px solid #374151', paddingBottom: '1rem', marginBottom: '1rem' }}>
                      <p><strong>Part:</strong> {job.partName}</p>
                      <p><strong>Employee:</strong> {job.employeeName}</p>
                      <p><strong>Status:</strong> <span className="status-text">{job.status}</span></p>
                    </div>

                    <div className="actions">
                      <button className="button" onClick={() => handleUpdateStatus('In Progress')} disabled={loading || job.status === 'In Progress'}>Start</button>
                      <button className="button button-secondary" onClick={() => handleUpdateStatus('Paused')} disabled={loading || job.status === 'Paused'}>Pause</button>
                      <button className="button button-complete" onClick={() => handleUpdateStatus('Awaiting QC')} disabled={loading}>Complete</button>
                    </div>
                  </>
                )}
            </div>
        </div>
    );
};