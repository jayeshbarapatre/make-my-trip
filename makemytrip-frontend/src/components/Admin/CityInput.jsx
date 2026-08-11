/**
 * City field for the admin forms.
 *
 * A plain text box, deliberately.
 *
 * It began as a <select> over ten hardcoded city names, so an admin could not
 * list a route to anywhere else — no Surat, no Baroda, no Kochi — without
 * editing the component. Swapping in a <datalist> of all 56 known cities fixed
 * that but replaced it with a popup the height of the screen, which is worse to
 * use than the problem it solved.
 *
 * So: type the city. The search layer canonicalises names anyway (Baroda and
 * Vadodara resolve to the same route, as do Bangalore and Bengaluru), which is
 * what makes free text safe here rather than reckless.
 */
export default function CityInput ({ value, onChange, placeholder = 'e.g. Surat', required, name }) {
  return (
    <input
      type="text"
      name={name}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      autoComplete="off"
    />
  )
}
