import api from './api.js'

export const cmsService = {
  // Public endpoints
  getPageBySlug: (slug) => api.get(`/cms/pages/${slug}`),
  getFooter: () => api.get('/cms/footer'),
  listFaqs: () => api.get('/cms/faqs'),
  listJobs: () => api.get('/cms/jobs'),
  getJobById: (id) => api.get(`/cms/jobs/${id}`),
  applyJob: (id, data) => api.post(`/cms/jobs/${id}/apply`, data),
  submitInquiry: (data) => api.post('/cms/contact', data),
  getSettings: () => api.get('/cms/settings'),

  // Admin endpoints
  listCmsPages: () => api.get('/admin/cms'),
  createCmsPage: (data) => api.post('/admin/cms', data),
  updateCmsPage: (id, data) => api.put(`/admin/cms/${id}`, data),
  deleteCmsPage: (id) => api.delete(`/admin/cms/${id}`),

  listSections: () => api.get('/admin/footer/sections'),
  createSection: (data) => api.post('/admin/footer/sections', data),
  updateSection: (id, data) => api.put(`/admin/footer/sections/${id}`, data),
  deleteSection: (id) => api.delete(`/admin/footer/sections/${id}`),
  createLink: (data) => api.post('/admin/footer/links', data),
  updateLink: (id, data) => api.put(`/admin/footer/links/${id}`, data),
  deleteLink: (id) => api.delete(`/admin/footer/links/${id}`),

  listInquiries: (status) => api.get(`/admin/inquiries${status ? `?status=${status}` : ''}`),
  getInquiry: (id) => api.get(`/admin/inquiries/${id}`),
  updateInquiryStatus: (id, status) => api.patch(`/admin/inquiries/${id}/status`, { status }),

  getNotifications: () => api.get('/admin/notifications'),
  getUnreadCount: () => api.get('/admin/notifications/unread-count'),
  markAsRead: (id) => api.patch(`/admin/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/admin/notifications/mark-all-read'),

  listAllJobs: () => api.get('/admin/jobs'),
  createJob: (data) => api.post('/admin/jobs', data),
  updateJob: (id, data) => api.put(`/admin/jobs/${id}`, data),
  deleteJob: (id) => api.delete(`/admin/jobs/${id}`),
  listApplications: (jobId) => api.get(`/admin/jobs/${jobId}/applications`),
  updateApplicationStatus: (id, status) => api.patch(`/admin/applications/${id}/status`, { status }),

  listAllFaqs: () => api.get('/admin/faqs'),
  createFaq: (data) => api.post('/admin/faqs', data),
  updateFaq: (id, data) => api.put(`/admin/faqs/${id}`, data),
  deleteFaq: (id) => api.delete(`/admin/faqs/${id}`),

  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),

  uploadMedia: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/admin/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  listMedia: () => api.get('/admin/media'),
  deleteMedia: (id) => api.delete(`/admin/media/${id}`),
}
