import React, { useState, useEffect } from 'react';
import { db } from '../supabaseClient';

export default function AdminDashboard({ addToast }) {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCause, setFilterCause] = useState('All');
  const [filterCity, setFilterCity] = useState('All');
  const [filterAvailability, setFilterAvailability] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Confirmation modal states
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    volunteer: null,
    targetStatus: null
  });

  // Volunteer detail modal states
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    volunteer: null
  });

  // Available option sets
  const CAUSE_OPTIONS = ['Food Drives', 'Menstrual Hygiene Awareness', 'Clothing Distribution', 'Education'];
  const STATUS_PIPELINE = ['Pending', 'Approved', 'Active', 'Inactive'];

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const fetchVolunteers = async () => {
    setLoading(true);
    const { data, error } = await db.getVolunteers();
    if (error) {
      addToast(error.message, 'error');
    } else {
      setVolunteers(data || []);
    }
    setLoading(false);
  };

  // Extract unique cities from active list to dynamically populate filter dropdown
  const uniqueCities = Array.from(new Set(volunteers.map(v => v.city))).sort();

  // Status transitions
  const getNextStatus = (currentStatus) => {
    const idx = STATUS_PIPELINE.indexOf(currentStatus);
    if (idx < STATUS_PIPELINE.length - 1) return STATUS_PIPELINE[idx + 1];
    return null;
  };

  const getPrevStatus = (currentStatus) => {
    const idx = STATUS_PIPELINE.indexOf(currentStatus);
    if (idx > 0) return STATUS_PIPELINE[idx - 1];
    return null;
  };

  const triggerStatusTransition = (volunteer, targetStatus) => {
    setConfirmModal({
      isOpen: true,
      volunteer,
      targetStatus
    });
  };

  const handleStatusConfirm = async () => {
    const { volunteer, targetStatus } = confirmModal;
    if (!volunteer || !targetStatus) return;

    setLoading(true);
    const { error } = await db.updateVolunteerStatus(volunteer.id, targetStatus);
    setLoading(false);

    if (error) {
      addToast(error.message, 'error');
    } else {
      addToast(`Status updated to ${targetStatus} for ${volunteer.full_name}`, 'success');
      fetchVolunteers();
    }

    setConfirmModal({ isOpen: false, volunteer: null, targetStatus: null });
  };

  // Filter logic
  const filteredVolunteers = volunteers.filter(v => {
    const matchesSearch = 
      v.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.phone.includes(searchQuery) ||
      (v.skills && v.skills.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCause = filterCause === 'All' || v.causes.includes(filterCause);
    const matchesCity = filterCity === 'All' || v.city === filterCity;
    const matchesAvailability = filterAvailability === 'All' || v.availability === filterAvailability;
    const matchesStatus = filterStatus === 'All' || v.status === filterStatus;

    return matchesSearch && matchesCause && matchesCity && matchesAvailability && matchesStatus;
  });

  // Calculate quick stats totals based on current database state (ignores filter for top stats panel)
  const getStats = () => {
    const stats = { Total: volunteers.length, Pending: 0, Approved: 0, Active: 0, Inactive: 0 };
    volunteers.forEach(v => {
      if (stats[v.status] !== undefined) {
        stats[v.status]++;
      }
    });
    return stats;
  };

  const stats = getStats();

  // CSV Export utility
  const exportToCSV = () => {
    if (filteredVolunteers.length === 0) {
      addToast('No records available to export.', 'error');
      return;
    }

    const headers = ['Full Name', 'Email', 'Phone', 'City', 'Causes Supported', 'Availability', 'Hours/Week', 'Key Skills', 'Pipeline Status', 'Registration Date'];
    
    const rows = filteredVolunteers.map(v => [
      v.full_name,
      v.email,
      v.phone,
      v.city,
      v.causes.join('; '),
      v.availability,
      v.hours_per_week,
      (v.skills || '').replace(/"/g, '""'), // escape quotes
      v.status,
      new Date(v.registered_at).toLocaleString()
    ]);

    const csvContent = 
      'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(r => r.map(field => `"${field}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NayePankh_Volunteers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('CSV export downloaded!', 'success');
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterCause('All');
    setFilterCity('All');
    setFilterAvailability('All');
    setFilterStatus('All');
  };

  // Explanatory texts for status changes in pipeline confirmation modal
  const getTransitionMessage = (current, target) => {
    if (current === 'Pending' && target === 'Approved') {
      return 'Approving this volunteer confirms they meet NayePankh eligibility criteria. They will move to the onboarding queue.';
    }
    if (current === 'Approved' && target === 'Active') {
      return 'Activating this volunteer indicates they have completed onboarding and are now actively assigned to NayePankh projects/food drives.';
    }
    if (current === 'Active' && target === 'Inactive') {
      return 'Moving to Inactive indicates this volunteer is currently resting, taking a break, or has finished their volunteer deployment.';
    }
    if (current === 'Approved' && target === 'Pending') {
      return 'Reverting to Pending moves this application back to the review queue for further information.';
    }
    if (current === 'Active' && target === 'Approved') {
      return 'Reverting to Approved takes this volunteer off active field projects, putting them back in onboarding queue.';
    }
    if (current === 'Inactive' && target === 'Active') {
      return 'Re-activating this volunteer returns them to active duty on ongoing programs.';
    }
    return `Are you sure you want to transition this volunteer status from ${current} to ${target}?`;
  };

  return (
    <div className="container">
      {/* Page Header and CSV Export Button */}
      <div className="dashboard-actions-header">
        <div className="dashboard-title-group">
          <h2>Volunteer Organizer Dashboard</h2>
          <p>Review signups, screen skills, and manage the deployment pipeline</p>
        </div>
        <button 
          onClick={exportToCSV}
          className="btn btn-outline"
          disabled={loading || filteredVolunteers.length === 0}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/></svg>
          Export Filtered CSV ({filteredVolunteers.length})
        </button>
      </div>

      {/* 1. Real-time Status Pipelines Count */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.48 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.Total}</span>
            <span className="stat-label">Total Registered</span>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm3.3 15.3L11 13V7h1.5v5.25l4.05 2.4-1.26 2.05-1.5-.4z"/></svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.Pending}</span>
            <span className="stat-label">Pending Review</span>
          </div>
        </div>

        <div className="stat-card approved">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.Approved}</span>
            <span className="stat-label">Approved Queue</span>
          </div>
        </div>

        <div className="stat-card active-status">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.Active}</span>
            <span className="stat-label">Active Field</span>
          </div>
        </div>

        <div className="stat-card inactive">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 11H7v-2h10v2z"/></svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.Inactive}</span>
            <span className="stat-label">Inactive/Rest</span>
          </div>
        </div>
      </div>

      {/* 2. Control Panel (Search & Dynamic Filter Dropdowns) */}
      <div className="controls-card">
        <div className="controls-row">
          <div className="search-input-wrapper">
            <svg className="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            <input 
              type="text" 
              className="form-control"
              placeholder="Search by volunteer name, email, skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-select">
            <select 
              className="form-control"
              value={filterCause}
              onChange={(e) => setFilterCause(e.target.value)}
            >
              <option value="All">All Causes</option>
              {CAUSE_OPTIONS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="filter-select">
            <select 
              className="form-control"
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
            >
              <option value="All">All Cities</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="filter-select">
            <select 
              className="form-control"
              value={filterAvailability}
              onChange={(e) => setFilterAvailability(e.target.value)}
            >
              <option value="All">All Availabilities</option>
              <option value="Weekdays">Weekdays</option>
              <option value="Weekends">Weekends</option>
              <option value="Both">Both</option>
            </select>
          </div>
        </div>

        {/* Interactive status filters pills */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div className="badge-filters">
            <span className="badge-filter-label">Pipeline Status:</span>
            <button 
              className={`badge-pill ${filterStatus === 'All' ? 'active' : ''}`}
              onClick={() => setFilterStatus('All')}
            >
              All
            </button>
            {STATUS_PIPELINE.map(st => (
              <button 
                key={st}
                className={`badge-pill ${filterStatus === st ? 'active' : ''}`}
                onClick={() => setFilterStatus(st)}
              >
                {st}
              </button>
            ))}
          </div>

          {(searchQuery || filterCause !== 'All' || filterCity !== 'All' || filterAvailability !== 'All' || filterStatus !== 'All') && (
            <button 
              onClick={resetFilters} 
              className="btn btn-outline" 
              style={{ padding: '4px 12px', fontSize: '0.8rem', height: 'auto' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 3. Interactive Data Table / List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div className="spinner" style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'pulse-soft 1s linear infinite' }}></div>
          <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Updating volunteer database...</p>
        </div>
      ) : filteredVolunteers.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-state-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" opacity="0.3"/>
            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12s4.48 10 10 10 10-4.48 10-10zm-10 5H8v-2h4v2zm0-4H8V7h4v6z"/>
          </svg>
          <h3 className="empty-state-title">No Wings Found</h3>
          <p className="empty-state-desc">
            No registered volunteers match your search and filter criteria. 
            Try clearing filters or search query to see other database records.
          </p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="volunteers-table">
            <thead>
              <tr>
                <th>Volunteer Name & Info</th>
                <th>Location</th>
                <th>Causes Supported</th>
                <th>Availability</th>
                <th>Hours/Wk</th>
                <th>Pipeline Status</th>
                <th style={{ textAlign: 'center' }}>Transition Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredVolunteers.map(volunteer => {
                const next = getNextStatus(volunteer.status);
                const prev = getPrevStatus(volunteer.status);
                
                return (
                  <tr key={volunteer.id}>
                    {/* Volunteer Column */}
                    <td>
                      <div className="volunteer-name-cell">
                        <button 
                          onClick={() => setDetailModal({ isOpen: true, volunteer })}
                          className="volunteer-primary-name"
                          style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline' }}
                        >
                          {volunteer.full_name}
                        </button>
                        <div className="volunteer-sub-details">
                          <span>{volunteer.email}</span> • <span>{volunteer.phone}</span>
                        </div>
                      </div>
                    </td>

                    {/* Location Column */}
                    <td>
                      <span style={{ fontWeight: 500 }}>{volunteer.city}</span>
                    </td>

                    {/* Causes Column */}
                    <td>
                      <div className="causes-tag-list">
                        {volunteer.causes.map(c => (
                          <span key={c} className={`cause-tag ${c === 'Menstrual Hygiene Awareness' ? 'cause-tag-menstrual' : ''}`}>{c}</span>
                        ))}
                      </div>
                    </td>

                    {/* Availability Column */}
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>{volunteer.availability}</span>
                    </td>

                    {/* Hours Column */}
                    <td>
                      <span style={{ fontWeight: 600 }}>{volunteer.hours_per_week}h</span>
                    </td>

                    {/* Status Column */}
                    <td>
                      <span className={`status-badge ${volunteer.status.toLowerCase()}`}>
                        {volunteer.status}
                      </span>
                    </td>

                    {/* Transition Actions Column */}
                    <td>
                      <div className="pipeline-controls" style={{ justifyContent: 'center' }}>
                        <button 
                          className="pipeline-btn"
                          title={prev ? `Revert status to ${prev}` : 'At start of pipeline'}
                          disabled={!prev}
                          onClick={() => triggerStatusTransition(volunteer, prev)}
                        >
                          ←
                        </button>
                        <button 
                          className="pipeline-btn"
                          title={next ? `Advance status to ${next}` : 'At end of pipeline'}
                          disabled={!next}
                          onClick={() => triggerStatusTransition(volunteer, next)}
                        >
                          →
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal for status pipeline shifts */}
      {confirmModal.isOpen && confirmModal.volunteer && (
        <div className="modal-overlay" onClick={() => setConfirmModal({ isOpen: false, volunteer: null, targetStatus: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Pipeline Transition</h3>
              <button className="modal-close" onClick={() => setConfirmModal({ isOpen: false, volunteer: null, targetStatus: null })}>×</button>
            </div>
            <div className="modal-body">
              <p>
                You are changing the status pipeline for <strong>{confirmModal.volunteer.full_name}</strong>.
              </p>
              
              <div className="pipeline-visual-comparison">
                <span className={`status-badge ${confirmModal.volunteer.status.toLowerCase()}`}>
                  {confirmModal.volunteer.status}
                </span>
                <span className="pipeline-arrow">➔</span>
                <span className={`status-badge ${confirmModal.targetStatus.toLowerCase()}`}>
                  {confirmModal.targetStatus}
                </span>
              </div>

              <p style={{ fontSize: '0.88rem', lineHeight: '1.4', marginTop: '16px' }}>
                {getTransitionMessage(confirmModal.volunteer.status, confirmModal.targetStatus)}
              </p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setConfirmModal({ isOpen: false, volunteer: null, targetStatus: null })}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleStatusConfirm}
              >
                Confirm Transition
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Volunteer Detail Modal */}
      {detailModal.isOpen && detailModal.volunteer && (
        <div className="modal-overlay" onClick={() => setDetailModal({ isOpen: false, volunteer: null })}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Volunteer Profile: {detailModal.volunteer.full_name}</h3>
              <button className="modal-close" onClick={() => setDetailModal({ isOpen: false, volunteer: null })}>×</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`status-badge ${detailModal.volunteer.status.toLowerCase()}`}>
                  {detailModal.volunteer.status}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Registered: {new Date(detailModal.volunteer.registered_at).toLocaleString()}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div>
                  <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '4px' }}>Email Contact</h4>
                  <p style={{ fontWeight: 500 }}>{detailModal.volunteer.email}</p>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '4px' }}>Phone Contact</h4>
                  <p style={{ fontWeight: 500 }}>{detailModal.volunteer.phone}</p>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '4px' }}>City</h4>
                  <p style={{ fontWeight: 500 }}>{detailModal.volunteer.city}</p>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '4px' }}>Availability</h4>
                  <p style={{ fontWeight: 500 }}>
                    {detailModal.volunteer.availability} ({detailModal.volunteer.hours_per_week} hours/week)
                  </p>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '6px' }}>Selected Causes</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {detailModal.volunteer.causes.map(c => (
                    <span key={c} className={`cause-tag ${c === 'Menstrual Hygiene Awareness' ? 'cause-tag-menstrual' : ''}`} style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '6px' }}>Skills & Experience</h4>
                <div style={{ backgroundColor: 'var(--bg-app)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem', color: 'var(--text-main)', minHeight: '80px', whiteSpace: 'pre-wrap' }}>
                  {detailModal.volunteer.skills || 'No skills described.'}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setDetailModal({ isOpen: false, volunteer: null })}>
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
