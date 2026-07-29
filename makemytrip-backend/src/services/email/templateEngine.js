import Handlebars from 'handlebars'

// Register custom helpers for email templates
Handlebars.registerHelper('currency', function (amount) {
  if (!amount && amount !== 0) return ''
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
})

Handlebars.registerHelper('date', function (dateString, format = 'short') {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (format === 'short') {
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
  } else if (format === 'long') {
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
  } else if (format === 'time') {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  }
  return date.toLocaleDateString('en-IN')
})

Handlebars.registerHelper('time', function (timeString) {
  if (!timeString) return ''
  if (timeString.includes('T')) {
    const date = new Date(timeString)
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  }
  return timeString
})

Handlebars.registerHelper('uppercase', function (str) {
  return str ? str.toUpperCase() : ''
})

Handlebars.registerHelper('capitalize', function (str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
})

Handlebars.registerHelper('eq', function (a, b, options) {
  return a === b ? options.fn(this) : options.inverse(this)
})

Handlebars.registerHelper('ne', function (a, b, options) {
  return a !== b ? options.fn(this) : options.inverse(this)
})

Handlebars.registerHelper('gt', function (a, b, options) {
  return a > b ? options.fn(this) : options.inverse(this)
})

Handlebars.registerHelper('lt', function (a, b, options) {
  return a < b ? options.fn(this) : options.inverse(this)
})

Handlebars.registerHelper('gte', function (a, b, options) {
  return a >= b ? options.fn(this) : options.inverse(this)
})

Handlebars.registerHelper('lte', function (a, b, options) {
  return a <= b ? options.fn(this) : options.inverse(this)
})

Handlebars.registerHelper('or', function (...args) {
  const options = args[args.length - 1]
  const values = args.slice(0, -1)
  return values.some(v => v) ? options.fn(this) : options.inverse(this)
})

Handlebars.registerHelper('and', function (...args) {
  const options = args[args.length - 1]
  const values = args.slice(0, -1)
  return values.every(v => v) ? options.fn(this) : options.inverse(this)
})

export const compileTemplate = (templateString) => {
  return Handlebars.compile(templateString)
}

export const renderTemplate = (templateString, data) => {
  try {
    const template = compileTemplate(templateString)
    return template(data)
  } catch (error) {
    console.error('Template render error:', error.message)
    throw error
  }
}

export default { compileTemplate, renderTemplate }
