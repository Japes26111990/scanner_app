import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp, increment } from 'firebase/firestore';
import { CheckCircle, AlertTriangle, XCircle, UserPlus } from 'lucide-react';
import '../App.css'; 

// A simple Dropdown component for this file
const Dropdown = ({ label, value, onChange, options = [], placeholder, disabled = false, name = '' }) => {
    return (
        <div style={{ marginBottom: '1rem' }}>
            <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
            <select
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:bg-gray-800 disabled:text-gray-500"
                style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map(option => (
                    <option key={option.id} value={option.id}>{option.name}</option>
                ))}
            </select>
        </div>
    );
};


export const JobActionModal = ({ jobId, departments, employees, onClose }) => {
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [view, setView] = useState('details');
    const [actionToConfirm, setActionToConfirm] = useState(null);
    
    const [assignment, setAssignment] = useState({ departmentId: '', employeeId: '' });

    const fetchJobDetails = async (id) => {
        setLoading(true);
        setError(null);
        setView('details');
        try {
            const q = query(collection(db, "createdJobCards"), where("jobId", "==", id));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) throw new Error("No job found with this ID.");
            const jobDoc = querySnapshot.docs[0];
            const jobData = { id: jobDoc.id, ...jobDoc.data() };
            setJob(jobData);
            setAssignment({ departmentId: jobData.departmentId || '', employeeId: jobData.employeeId || '' });
        } catch (err) {
            setError(err.message);
            setView('error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (jobId) { fetchJobDetails(jobId); } }, [jobId]);

    const handleActionClick = (status, label, color) => {
        setActionToConfirm({ status, label, color });
        setView('confirm');
    };

    const executeStatusUpdate = async () => {
        if (!job || !actionToConfirm) return;
        setLoading(true);
        try {
            const jobDocRef = doc(db, "createdJobCards", job.id);
            const newStatus = actionToConfirm.status;
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
            setView('success');
            setTimeout(() => { onClose(); }, 2000);
        } catch (err) {
            setError("Failed to update status.");
            setView('error');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignJob = async () => {
        if (!assignment.employeeId) return alert("Please select an employee.");
        const employee = employees.find(e => e.id === assignment.employeeId);
        if (!employee) return alert("Selected employee not found.");

        setLoading(true);
        try {
            const jobDocRef = doc(db, "createdJobCards", job.id);
            await updateDoc(jobDocRef, {
                employeeId: employee.id,
                employeeName: employee.name,
            });
            await fetchJobDetails(jobId); // Refetch to show the updated name and switch back to details view
        } catch(err) {
            setError("Failed to assign job.");
            setView('error');
        } finally {
            setLoading(false);
        }
    };
    
    const filteredEmployees = useMemo(() => {
        if (!assignment.departmentId) return [];
        return employees.filter(e => e.departmentId === assignment.departmentId);
    }, [assignment.departmentId, employees]);

    const renderContent = () => {
        if (loading && view === 'details') return <p>Loading job...</p>;
        if (view === 'error') { return ( <div style={{ textAlign: 'center' }}> <XCircle size={60} className="error-text" style={{ margin: '0 auto' }}/> <h3 className="error-text" style={{ fontSize: '1.5rem' }}>Error</h3> <p>{error}</p> <button className="button button-reset" onClick={onClose}>Close</button> </div> ); }
        if (view === 'success') { return ( <div style={{ textAlign: 'center' }}> <CheckCircle size={60} style={{ color: '#4ade80', margin: '0 auto' }}/> <h3 style={{ fontSize: '1.5rem' }}>Status Updated!</h3> <p>The job is now "{actionToConfirm?.status}".</p> </div> ); }
        if (view === 'confirm' && actionToConfirm) { return ( <div style={{ textAlign: 'center' }}> <AlertTriangle size={60} style={{ color: actionToConfirm.color, margin: '0 auto' }}/> <h3 style={{ fontSize: '1.5rem' }}>Are you sure?</h3> <p>You are about to change the status to "{actionToConfirm.label}".</p> <div className="actions" style={{ marginTop: '2rem' }}> <button className="button button-secondary" onClick={() => setView('details')}>Cancel</button> <button className="button" style={{ backgroundColor: actionToConfirm.color }} onClick={executeStatusUpdate} disabled={loading}> {loading ? 'Confirming...' : 'Yes, Confirm'} </button> </div> </div> ); }
        
        if (view === 'assign') {
            return (
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: '2rem' }}>Assign Job</h3>
                    <Dropdown label="Department" value={assignment.departmentId} onChange={(e) => setAssignment({ departmentId: e.target.value, employeeId: '' })} options={departments} placeholder="Select Department..." />
                    <Dropdown label="Employee" value={assignment.employeeId} onChange={(e) => setAssignment(prev => ({ ...prev, employeeId: e.target.value }))} options={filteredEmployees} placeholder="Select Employee..." disabled={!assignment.departmentId} />
                    <div className="actions" style={{ marginTop: '2rem' }}>
                        <button className="button button-secondary" onClick={() => setView('details')}>Cancel</button>
                        <button className="button" onClick={handleAssignJob} disabled={loading || !assignment.employeeId}>{loading ? 'Assigning...' : 'Assign to This Employee'}</button>
                    </div>
                </div>
            )
        }

        if (view === 'details' && job) {
            return (
              <>
                <div className="job-details" style={{ borderBottom: '1px solid #374151', paddingBottom: '1rem', marginBottom: '1rem' }}>
                  <p><strong>Part:</strong> {job.partName}</p>
                  <p><strong>Assigned to:</strong> {job.employeeName || <span style={{color: '#facc15'}}>Unassigned</span>}</p>
                  <p><strong>Status:</strong> <span className="status-text">{job.status}</span></p>
                </div>

                <button className="button button-secondary" style={{width: '100%', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}} onClick={() => setView('assign')}>
                    <UserPlus size={20} />
                    Assign / Re-assign
                </button>

                <div className="actions">
                  <button className="button" onClick={() => handleActionClick('In Progress', 'Start Job', '#2563eb')} disabled={!job.employeeId || job.status === 'In Progress'}>Start Job</button>
                  <button className="button button-secondary" onClick={() => handleActionClick('Paused', 'Pause Job', '#4b5563')} disabled={!job.employeeId || job.status === 'Paused'}>Pause</button>
                  <button className="button button-complete" onClick={() => handleActionClick('Awaiting QC', 'Complete Job', '#16a34a')} disabled={!job.employeeId}>Complete</button>
                </div>
              </>
            );
        }
        
        return <p>Waiting for job data...</p>;
    };

    return ( <div className="modal-backdrop" onClick={onClose}> <div className="card" onClick={(e) => e.stopPropagation()}> {renderContent()} </div> </div> );
};