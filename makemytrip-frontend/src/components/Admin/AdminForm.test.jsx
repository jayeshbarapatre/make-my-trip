import { describe, it, expect, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import HotelForm from './HotelForm'
import CabForm from './CabForm'

/**
 * Every admin form copied its entity into state from an effect:
 *
 *   const [formData, setFormData] = useState(BLANK)
 *   useEffect(() => { if (hotel) setFormData(hotel) }, [hotel])
 *
 * That renders once with blank fields before the effect runs, and it is the
 * pattern React's own docs call out — the documented answer is a `key` so the
 * component remounts with the right initial state instead.
 *
 * These pin the behaviour that has to survive that change: a form given no
 * entity is blank, a form given one shows its values, and switching entity
 * shows the new one rather than the previous.
 */
const noop = () => {}

describe('admin forms', () => {
  it('HotelForm is blank when creating', () => {
    const { container } = render(<HotelForm hotel={null} onSubmit={noop} onClose={noop} />)
    expect(container.querySelector('input[name="name"]')).toHaveValue('')
    expect(screen.queryByDisplayValue('Taj Palace')).not.toBeInTheDocument()
  })

  it('HotelForm shows the hotel it was given, on first render', () => {
    render(
      <HotelForm
        key="h1"
        hotel={{ id: 'h1', name: 'Taj Palace', city: 'Udaipur', price: 9000 }}
        onSubmit={noop}
        onClose={noop}
      />
    )
    expect(screen.getByDisplayValue('Taj Palace')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Udaipur')).toBeInTheDocument()
  })

  it('HotelForm shows the second hotel when the key changes', () => {
    const { rerender } = render(
      <HotelForm key="h1" hotel={{ id: 'h1', name: 'Taj Palace', city: 'Udaipur' }} onSubmit={noop} onClose={noop} />
    )
    expect(screen.getByDisplayValue('Taj Palace')).toBeInTheDocument()

    rerender(
      <HotelForm key="h2" hotel={{ id: 'h2', name: 'Oberoi Amarvilas', city: 'Agra' }} onSubmit={noop} onClose={noop} />
    )
    expect(screen.getByDisplayValue('Oberoi Amarvilas')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('Taj Palace')).not.toBeInTheDocument()
  })

  it('CabForm shows the cab it was given', () => {
    cleanup()
    render(<CabForm key="c1" cab={{ id: 'c1', operatorName: 'Meru Cabs', currentCity: 'Jaipur' }} onSubmit={noop} onClose={noop} />)
    expect(screen.getByDisplayValue('Meru Cabs')).toBeInTheDocument()
  })

  it('CabForm is blank when creating', () => {
    cleanup()
    render(<CabForm cab={null} onSubmit={noop} onClose={noop} />)
    expect(screen.queryByDisplayValue('Meru Cabs')).not.toBeInTheDocument()
  })

  it('calls onClose from Cancel without submitting', async () => {
    const onClose = vi.fn()
    const onSubmit = vi.fn()
    render(<CabForm cab={null} onSubmit={onSubmit} onClose={onClose} />)
    screen.getByRole('button', { name: /cancel/i }).click()
    expect(onClose).toHaveBeenCalled()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
