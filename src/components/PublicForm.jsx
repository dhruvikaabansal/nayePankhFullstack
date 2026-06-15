import React, { useState } from 'react';
import { db } from '../supabaseClient';

export default function PublicForm({ addToast }) {
  // Form step routing
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    city: '',
    causes: [], // Multi-select array
    availability: 'Both', // default
    hours_per_week: 4,
    skills: ''
  });

  // Errors state
  const [errors, setErrors] = useState({});

  // Cause constants
  const AVAILABLE_CAUSES = [
    'Food Drives',
    'Menstrual Hygiene Awareness',
    'Clothing Distribution',
    'Education'
  ];

  // City options (popular Indian cities / NayePankh activity centers)
  const CITIES = [
    'Lucknow',
    'New Delhi',
    'Mumbai',
    'Bengaluru',
    'Pune',
    'Kolkata',
    'Hyderabad',
    'Chennai',
    'Jaipur',
    'Guwahati'
  ];

  // Handle standard input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when editing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle checkbox selection for causes (multi-select)
  const handleCauseChange = (cause) => {
    setFormData(prev => {
      const causes = prev.causes.includes(cause)
        ? prev.causes.filter(c => c !== cause)
        : [...prev.causes, cause];
      
      // Clear error if causes selected
      if (causes.length > 0 && errors.causes) {
        setErrors(err => ({ ...err, causes: '' }));
      }
      
      return { ...prev, causes };
    });
  };

  // Validate Step 1
  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Indian phone number regex
    // Supports: +91 XXXXX XXXXX, 91XXXXXXXXXX, 0XXXXXXXXXX, XXXXXXXXXX (10 digits)
    const phoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
    const cleanPhone = formData.phone.replace(/[\s-]/g, '');
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(cleanPhone)) {
      newErrors.phone = 'Please enter a valid 10-digit Indian phone number';
    }

    if (!formData.city) {
      newErrors.city = 'Please select a city';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate Step 2
  const validateStep2 = () => {
    const newErrors = {};
    if (formData.causes.length === 0) {
      newErrors.causes = 'Please select at least one cause you want to support';
    }
    
    const hours = parseInt(formData.hours_per_week);
    if (isNaN(hours) || hours <= 0) {
      newErrors.hours_per_week = 'Hours per week must be a positive number';
    } else if (hours > 50) {
      newErrors.hours_per_week = 'Volunteering hours cannot exceed 50 hours/week';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep1()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    
    // API request to unify Supabase insert and check duplicates
    const { data, error } = await db.addVolunteer(formData);
    setLoading(false);

    if (error) {
      addToast(error.message, 'error');
      // If email is duplicate, flag it on email field and go back to step 1
      if (error.message.toLowerCase().includes('email')) {
        setErrors(prev => ({ ...prev, email: error.message }));
        setStep(1);
      }
    } else {
      setIsSuccess(true);
      addToast('Registration submitted successfully!', 'success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isSuccess) {
    return (
      <div className="container" style={{ maxWidth: '600px' }}>
        <div className="card success-card" style={{ animation: 'float-up 0.5s ease-out' }}>
          <div className="success-wing-animation">
            <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
              {/* Custom detailed wing motif in SVG */}
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9zm2-13c2.2 0 4.15 1.17 5.25 2.92C15.65 6.34 13.9 6 12 6s-3.65.34-5.25.92C7.85 5.17 9.8 4 12 4z" />
              <path d="M12 7c-4.42 0-8 2.24-8 5s3.58 5 8 5 8-2.24 8-5-3.58-5-8-5zm-5 6c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm5 2c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm5-2c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" opacity="0.3" />
            </svg>
          </div>
          <h2 className="success-title">Spread Your Wings!</h2>
          <p className="success-desc">
            Thank you, <strong>{formData.full_name}</strong>, for registering with NayePankh Foundation. 
            Your registration is currently <strong>Pending review</strong>. Our volunteer organizers 
            will review your skills and causes, and get back to you by phone or email within 3 to 5 business days!
          </p>
          <div style={{ backgroundColor: 'var(--bg-app)', padding: '16px', borderRadius: '8px', textAlign: 'left', marginBottom: '24px', fontSize: '0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 16px' }}>
              <strong style={{ color: 'var(--text-muted)' }}>Registered City:</strong>
              <span>{formData.city}</span>
              <strong style={{ color: 'var(--text-muted)' }}>Selected Causes:</strong>
              <span>{formData.causes.join(', ')}</span>
              <strong style={{ color: 'var(--text-muted)' }}>Availability:</strong>
              <span>{formData.availability} ({formData.hours_per_week} hrs/week)</span>
            </div>
          </div>
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={() => {
              setIsSuccess(false);
              setStep(1);
              setFormData({
                full_name: '',
                email: '',
                phone: '',
                city: '',
                causes: [],
                availability: 'Both',
                hours_per_week: 4,
                skills: ''
              });
            }}
          >
            Register Another Volunteer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wing-motif-container">
      {/* Flight visual backgrounds */}
      <div className="wing-motif-bg-left">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
      </div>
      <div className="wing-motif-bg-right">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
      </div>

      <div className="container" style={{ maxWidth: '680px' }}>
        <header className="hero">
          <div className="hero-logo-container">
            <svg className="hero-logo" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l8 2.5z" />
            </svg>
          </div>
          <h1>Give Wings to Change</h1>
          <p>
            Join NayePankh Foundation. Direct your energy towards food drives, menstrual health awareness, 
            clothing runs, and underprivileged education. Register below to start your flight.
          </p>
        </header>

        {/* Wizard Progress Steps indicator */}
        <div className="wizard-steps">
          <div 
            className="wizard-step-line-active" 
            style={{ width: step === 1 ? '0%' : '50%' }}
          ></div>
          <div className={`wizard-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <div className="wizard-step-node">{step > 1 ? '✓' : '1'}</div>
            <div className="wizard-step-label">Personal Info</div>
          </div>
          <div className={`wizard-step ${step === 2 ? 'active' : ''}`}>
            <div className="wizard-step-node">2</div>
            <div className="wizard-step-label">Preferences & Skills</div>
          </div>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} noValidate>
            {/* Step 1: Personal Details */}
            {step === 1 && (
              <div style={{ animation: 'float-up 0.3s ease-out' }}>
                <h3 style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', textAlign: 'left' }}>
                  Step 1: Contact Information
                </h3>
                
                <div className="form-group">
                  <label htmlFor="full_name">
                    Full Name <span className="required">*</span>
                  </label>
                  <input 
                    type="text" 
                    id="full_name" 
                    name="full_name" 
                    placeholder="Enter your first and last name"
                    className="form-control"
                    value={formData.full_name}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                  {errors.full_name && <div className="form-error-msg">{errors.full_name}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    Email Address <span className="required">*</span>
                  </label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    placeholder="e.g. rahul@example.com"
                    className="form-control"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                  <span className="form-helper">We prevent duplicate registrations under the same email.</span>
                  {errors.email && <div className="form-error-msg">{errors.email}</div>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">
                      WhatsApp / Phone Number <span className="required">*</span>
                    </label>
                    <input 
                      type="tel" 
                      id="phone" 
                      name="phone" 
                      placeholder="10-digit mobile number"
                      className="form-control"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    />
                    {errors.phone && <div className="form-error-msg">{errors.phone}</div>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="city">
                      City of Residence <span className="required">*</span>
                    </label>
                    <select 
                      id="city" 
                      name="city" 
                      className="form-control"
                      value={formData.city}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    >
                      <option value="">-- Select Your City --</option>
                      {CITIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {errors.city && <div className="form-error-msg">{errors.city}</div>}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '28px' }}>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={nextStep}
                    disabled={loading}
                  >
                    Next: Preferences
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M5 13h11.86l-5.43 5.43 1.42 1.42L21.14 12l-8.29-8.29-1.42 1.42L16.86 11H5v2z"/></svg>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Preferences and Skills */}
            {step === 2 && (
              <div style={{ animation: 'float-up 0.3s ease-out' }}>
                <h3 style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', textAlign: 'left' }}>
                  Step 2: Volunteering Preferences
                </h3>

                <div className="form-group">
                  <label>
                    Causes to Support <span className="required">*</span> 
                    <span style={{ fontWeight: 'normal', fontSize: '0.8rem', color: 'var(--text-muted)' }}> (Select all that apply)</span>
                  </label>
                  <div className="form-control-checkbox-group">
                    {AVAILABLE_CAUSES.map(cause => {
                      const isChecked = formData.causes.includes(cause);
                      return (
                        <label key={cause} className={`checkbox-label ${isChecked ? 'checked' : ''}`}>
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleCauseChange(cause)}
                            disabled={loading}
                          />
                          {cause}
                        </label>
                      );
                    })}
                  </div>
                  {errors.causes && <div className="form-error-msg">{errors.causes}</div>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="availability">
                      Weekly Availability <span className="required">*</span>
                    </label>
                    <select 
                      id="availability" 
                      name="availability" 
                      className="form-control"
                      value={formData.availability}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      <option value="Weekdays">Weekdays</option>
                      <option value="Weekends">Weekends</option>
                      <option value="Both">Both (Weekdays & Weekends)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="hours_per_week">
                      Target Hours Per Week <span className="required">*</span>
                    </label>
                    <input 
                      type="number" 
                      id="hours_per_week" 
                      name="hours_per_week" 
                      min="1" 
                      max="40"
                      className="form-control"
                      value={formData.hours_per_week}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    />
                    {errors.hours_per_week && <div className="form-error-msg">{errors.hours_per_week}</div>}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="skills">
                    Skills & Key Interests 
                    <span style={{ fontWeight: 'normal', fontSize: '0.8rem', color: 'var(--text-muted)' }}> (Optional)</span>
                  </label>
                  <textarea 
                    id="skills" 
                    name="skills" 
                    rows="4"
                    placeholder="Tell us about your background, expertise (e.g. photography, graphic design, tutoring, event planning), or why you'd like to join."
                    className="form-control"
                    value={formData.skills}
                    onChange={handleChange}
                    disabled={loading}
                    style={{ resize: 'vertical' }}
                  ></textarea>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px', gap: '12px' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline"
                    onClick={prevStep}
                    disabled={loading}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ transform: 'rotate(180deg)' }}><path d="M5 13h11.86l-5.43 5.43 1.42 1.42L21.14 12l-8.29-8.29-1.42 1.42L16.86 11H5v2z"/></svg>
                    Back to Contact Info
                  </button>

                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'pulse-soft 1s linear infinite' }}></span>
                        Registering...
                      </>
                    ) : (
                      <>
                        Submit Volunteer Registration
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
