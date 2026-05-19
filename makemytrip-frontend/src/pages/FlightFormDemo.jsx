import { useState } from 'react'
import { FlightForm } from '../components/FlightForm'
import styles from '../styles/FlightFormDemo.module.css'

const FlightFormDemo = () => {
  const [submittedData, setSubmittedData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleFormSubmit = async (formData) => {
    setLoading(true)
    setMessage('')

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Log the submitted data
      console.log('Form submitted:', formData)
      setSubmittedData(formData)
      setMessage('✅ Flight form submitted successfully! Check console for data.')

      // Reset after 3 seconds
      setTimeout(() => {
        setMessage('')
        setSubmittedData(null)
      }, 3000)
    } catch (err) {
      setMessage('❌ Error submitting form')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>✈️ Flight Module Testing</h1>
        <p>Test the dynamic flight form with autocomplete features</p>
      </div>

      <div className={styles.content}>
        <div className={styles.formSection}>
          <FlightForm onSubmit={handleFormSubmit} loading={loading} />
        </div>

        <div className={styles.testGuide}>
          <h3>📋 Testing Checklist</h3>
          <div className={styles.checklist}>
            <div className={styles.checklistItem}>
              <input type="checkbox" id="test1" />
              <label htmlFor="test1">
                <strong>Autocomplete Works</strong><br />
                Type in any field (e.g., &quot;Air&quot;, &quot;Boe&quot;) and see suggestions appear
              </label>
            </div>

            <div className={styles.checklistItem}>
              <input type="checkbox" id="test2" />
              <label htmlFor="test2">
                <strong>Keyboard Navigation</strong><br />
                Open suggestions and use ↑ ↓ arrows to navigate, Enter to select
              </label>
            </div>

            <div className={styles.checklistItem}>
              <input type="checkbox" id="test3" />
              <label htmlFor="test3">
                <strong>Debouncing Works</strong><br />
                Suggestions should appear after a short delay (300ms)
              </label>
            </div>

            <div className={styles.checklistItem}>
              <input type="checkbox" id="test4" />
              <label htmlFor="test4">
                <strong>Validation Works</strong><br />
                Try submitting with empty fields - should show error messages
              </label>
            </div>

            <div className={styles.checklistItem}>
              <input type="checkbox" id="test5" />
              <label htmlFor="test5">
                <strong>No Results Handling</strong><br />
                Type something that doesn&apos;t exist (e.g., &quot;XYZABC&quot;) - should show &quot;No results found&quot;
              </label>
            </div>

            <div className={styles.checklistItem}>
              <input type="checkbox" id="test6" />
              <label htmlFor="test6">
                <strong>Responsive Design</strong><br />
                Resize window to mobile (600px), tablet (900px), and desktop - form should adjust
              </label>
            </div>

            <div className={styles.checklistItem}>
              <input type="checkbox" id="test7" />
              <label htmlFor="test7">
                <strong>Loading States</strong><br />
                Submit button should show &quot;Adding Flight...&quot; while loading
              </label>
            </div>

            <div className={styles.checklistItem}>
              <input type="checkbox" id="test8" />
              <label htmlFor="test8">
                <strong>Form Reset</strong><br />
                After submission, test if form resets or persists values
              </label>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className={styles.message}>
          {message}
        </div>
      )}

      {submittedData && (
        <div className={styles.submittedData}>
          <h3>📊 Submitted Data</h3>
          <pre>{JSON.stringify(submittedData, null, 2)}</pre>
        </div>
      )}

      <div className={styles.apiEndpoints}>
        <h3>🔌 Available API Endpoints</h3>
        <ul>
          <li><code>GET /api/v1/autocomplete/airlines?q=search_query</code></li>
          <li><code>GET /api/v1/autocomplete/airports?q=search_query</code></li>
          <li><code>GET /api/v1/autocomplete/cities?q=search_query</code></li>
          <li><code>GET /api/v1/autocomplete/aircrafts?q=search_query</code></li>
        </ul>
      </div>
    </div>
  )
}

export default FlightFormDemo
