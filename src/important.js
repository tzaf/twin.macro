import deepMerge from 'lodash.merge'

/**
 * Add important to a value
 * Only used for static and dynamic styles - not core plugins
 */
const mergeImportant = (style, hasImportant) => {
  if (!hasImportant) return style
  // Bail if the ruleset already has an important
  if (JSON.stringify(style).includes(' !important')) return style

  return Object.entries(style).reduce((result, item) => {
    const [key, value] = item
    if (typeof value === 'object') return mergeImportant(value, hasImportant)

    // Don't add important to css variables
    const newValue = key.startsWith('--') ? value : `${value} !important`

    return deepMerge(result, { [key]: newValue })
  }, {})
}

/**
 * Split the important from the className
 */
const splitImportant = ({ className, state }) => {
  const hasPrefix = className.slice(0, 1) === '!'
  const hasSuffix = className.slice(-1) === '!'
  let hasImportant = hasSuffix || hasPrefix

  if (hasImportant) {
    className = hasSuffix ? className.slice(0, -1) : className.slice(1)
  }

  if (state.config.important === true) {
    hasImportant = true
  }

  const important = hasImportant ? ' !important' : ''

  return { className, hasImportant, important }
}

export { splitImportant, mergeImportant }
