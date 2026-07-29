import { useState, useEffect } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'
import { cmsService } from '../services/cmsService'
import toast from 'react-hot-toast'
import './AdminFaqs.css'

const AdminFaqs = () => {
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ question: '', answer: '', sortOrder: 0, status: 'active' })

  const fetchFaqs = async () => {
    try {
      setLoading(true)
      const response = await cmsService.listAllFaqs()
      setFaqs(response.data.data)
      setError('')
    } catch (err) {
      setError('Failed to load FAQs')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFaqs()
  }, [])

  const handleEdit = (faq) => {
    setFormData({ question: faq.question, answer: faq.answer, sortOrder: faq.sortOrder, status: faq.status })
    setEditingId(faq.id)
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await cmsService.updateFaq(editingId, formData)
        setFaqs(faqs.map(f => f.id === editingId ? { ...f, ...formData } : f))
        toast.success('FAQ updated!')
      } else {
        const response = await cmsService.createFaq(formData)
        setFaqs([response.data.data, ...faqs])
        toast.success('FAQ created!')
      }
      handleCloseForm()
    } catch (err) {
      toast.error('Failed to save FAQ')
      console.error(err)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this FAQ?')) {
      try {
        await cmsService.deleteFaq(id)
        setFaqs(faqs.filter(f => f.id !== id))
        toast.success('FAQ deleted!')
      } catch (_err) {
        toast.error('Failed to delete FAQ')
      }
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({ question: '', answer: '', sortOrder: 0, status: 'active' })
  }

  if (loading) return <AdminLayout><div className="admin-faqs"><p>Loading...</p></div></AdminLayout>

  return (
    <AdminLayout>
      <div className="admin-faqs">
        <div className="faq-header">
          <h1>FAQs Management</h1>
          <button className="btn-create" onClick={() => setShowForm(true)}>+ Add FAQ</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="faq-table-wrapper">
          <table className="faq-table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Sort Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {faqs.map(faq => (
                <tr key={faq.id}>
                  <td>{faq.question}</td>
                  <td>{faq.sortOrder}</td>
                  <td><span className={`badge badge-${faq.status}`}>{faq.status}</span></td>
                  <td>
                    <button className="btn-edit" onClick={() => handleEdit(faq)}>Edit</button>
                    <button className="btn-delete" onClick={() => handleDelete(faq.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button className="close-btn" onClick={handleCloseForm}>×</button>
              <h2>{editingId ? 'Edit FAQ' : 'Create FAQ'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Question *</label>
                  <input
                    type="text"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="FAQ question"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Answer *</label>
                  <textarea
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    placeholder="FAQ answer (HTML supported)"
                    rows="6"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Sort Order</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <button type="submit" className="btn-submit">Save FAQ</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminFaqs
