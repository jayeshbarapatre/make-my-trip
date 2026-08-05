import { useState, useEffect } from 'react';
import { cmsService } from '../services/cmsService';
import { useToastContext } from '../context/ToastContext';
import './CareersPage.css';

export default function CareersPage() {
  const toast = useToastContext();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', resume: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchJobs = async () => {
    try {
      const response = await cmsService.listJobs();
      setJobs(response.data?.data || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Careers - MakeMyTrip';
    fetchJobs();
  }, []);

  const handleApply = (job) => {
    setSelectedJob(job);
    setShowApplicationForm(true);
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.warning('Please fill in required fields', 'Missing details');
      return;
    }

    try {
      setSubmitting(true);
      await cmsService.applyJob(selectedJob.id, formData);
      toast.success('Application submitted successfully!', 'Thanks for applying');
      setFormData({ name: '', email: '', phone: '', resume: '', message: '' });
      setShowApplicationForm(false);
      setSelectedJob(null);
    } catch (err) {
      toast.error('Failed to submit application. Please try again.', 'Something went wrong');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="careers-page flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="careers-page pb-16">
      <div className="careers-container">
        
        {/* Header Hero Banner */}
        <header className="careers-hero-banner" data-aos="fade-up">
          <h1 className="careers-hero-title">Careers at MakeMyTrip</h1>
          <p className="careers-hero-sub">Join our high-performing team and build the future of travel tech.</p>
        </header>

        {/* Dynamic Job Postings Section */}
        <section className="careers-jobs-sec" data-aos="fade-up" data-aos-delay="100">
          <h2 className="careers-sec-title">Current Openings</h2>
          <div className="careers-jobs-grid">
            {jobs.length === 0 ? (
              <div className="careers-no-jobs" data-aos="zoom-in">
                <p>No open positions at the moment. Please check back later!</p>
              </div>
            ) : (
              jobs.map((job, idx) => (
                <div key={job.id} className="careers-job-card" data-aos="fade-up" data-aos-delay={idx * 50}>
                  <div className="careers-job-header">
                    <h3>{job.title}</h3>
                    <span className="careers-job-dept">{job.department}</span>
                  </div>
                  <div className="careers-job-meta">
                    <span>📍 {job.location}</span>
                    <span>💼 {job.experience}</span>
                  </div>
                  <p className="careers-job-desc">
                    {job.description.substring(0, 180)}...
                  </p>
                  <button className="careers-apply-btn" onClick={() => handleApply(job)}>
                    Apply Now
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

      </div>

      {/* Application Modal Popup */}
      {showApplicationForm && selectedJob && (
        <div className="careers-modal-overlay">
          <div className="careers-modal-card" data-aos="zoom-in">
            <button className="careers-modal-close" onClick={() => setShowApplicationForm(false)}>×</button>
            <h2>Apply for {selectedJob.title}</h2>
            <p className="careers-modal-sub">{selectedJob.department} · {selectedJob.location}</p>
            
            <form onSubmit={handleSubmitApplication} className="careers-form">
              <div className="careers-form-group">
                <label>Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your full name"
                />
              </div>
              <div className="careers-form-group">
                <label>Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                />
              </div>
              <div className="careers-form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Your phone number"
                />
              </div>
              <div className="careers-form-group">
                <label>Resume Link (e.g. Google Drive, Dropbox)</label>
                <input
                  type="text"
                  value={formData.resume}
                  onChange={(e) => setFormData({ ...formData, resume: e.target.value })}
                  placeholder="https://... or paste resume URL"
                />
              </div>
              <div className="careers-form-group">
                <label>Cover Letter</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us why you are interested in this position"
                  rows="4"
                />
              </div>
              <button type="submit" className="careers-submit-btn" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
