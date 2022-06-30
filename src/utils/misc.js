import { parseColor } from 'tailwindcss/lib/util/color'
import deepMerge from 'lodash.merge'
import { MacroError } from 'babel-plugin-macros'
import get from 'lodash.get'
import { SPACE_ID } from './../constants'

const throwIf = (expression, callBack) => {
  if (!expression) return
  throw new MacroError(callBack())
}

const isEmpty = value =>
  value === undefined ||
  value === null ||
  (typeof value === 'object' && Object.keys(value).length === 0) ||
  (typeof value === 'string' && value.trim().length === 0)

function transformThemeValue(themeSection) {
  if (['fontSize', 'outline'].includes(themeSection)) {
    return value => (Array.isArray(value) ? value[0] : value)
  }

  if (
    [
      'fontFamily',
      'boxShadow',
      'transitionProperty',
      'transitionDuration',
      'transitionDelay',
      'transitionTimingFunction',
      'backgroundImage',
      'backgroundSize',
      'backgroundColor',
      'cursor',
      'animation',
    ].includes(themeSection)
  ) {
    return value => (Array.isArray(value) ? value.join(', ') : value)
  }

  if (themeSection === 'colors') {
    return value => (typeof value === 'function' ? value({}) : value)
  }

  return value => value
}

const objectToStringValues = obj => {
  if (typeof obj === 'object' && !Array.isArray(obj))
    return Object.entries(obj).reduce(
      (result, [key, value]) =>
        deepMerge(result, { [key]: objectToStringValues(value) }),
      {}
    )

  if (Array.isArray(obj)) return obj.map(i => objectToStringValues(i))

  if (typeof obj === 'number') return String(obj)

  // typeof obj = string / function
  return obj
}

const getTheme = configTheme => grab => {
  if (!grab) return configTheme
  // Allow theme`` which gets supplied as an array
  const value = Array.isArray(grab) ? grab[0] : grab
  // Get the theme key so we can apply certain rules in transformThemeValue
  const themeKey = value.split('.')[0]
  // Get the resulting value from the config
  const themeValue = get(configTheme, value)
  return objectToStringValues(transformThemeValue(themeKey)(themeValue))
}

const camelize = string =>
  string && string.replace(/\W+(.)/g, (_, chr) => chr.toUpperCase())

const isClass = str => new RegExp(/(\s*\.|{{)\w/).test(str)

const isShortCss = className => new RegExp(/[^/-]\[/).test(className)

const isArbitraryProperty = className =>
  className.startsWith('[') && className.endsWith(']')

// Split a string at a value
const splitOnFirst = (input, delim) =>
  (([first, ...rest]) => [first, rest.join(delim)])(input.split(delim))

const formatProp = classes =>
  replaceSpaceId(
    classes
      // Normalize spacing
      .replace(/\s\s+/g, ' ')
      // Remove newline characters
      .replace(/\n/g, ' ')
      .trim()
  )

const isSpaceSeparatedColor = color => {
  const spaceMatch =
    typeof color === 'string' ? color.split(/\s+(?=[^)\]}]*(?:[([{]|$))/) : []
  if (spaceMatch.length === 0) return
  const hasValidSpaceSeparatedColors = spaceMatch.every(color =>
    // FIXME: Remove comment and fix next line
    // eslint-disable-next-line unicorn/prefer-regexp-test
    Boolean(/^var\(--\w*\)$/.exec(color) ? color : parseColor(color))
  )
  return hasValidSpaceSeparatedColors
}

const isObject = val =>
  // eslint-disable-next-line eqeqeq, no-eq-null, @typescript-eslint/no-unnecessary-boolean-literal-compare
  val != null && typeof val === 'object' && Array.isArray(val) === false

const getFirstValue = (list, getValue) => {
  let firstValue
  const listLength = list.length - 1
  const listItem = list.find((listItem, index) => {
    const isLast = index === listLength
    firstValue = getValue(listItem, { index, isLast })
    return Boolean(firstValue)
  })

  return [firstValue, listItem]
}

const replaceSpaceId = className =>
  className.replace(new RegExp(SPACE_ID, 'g'), ' ')

const toArray = arr => (Array.isArray(arr) ? arr : [arr])

const formatCssProperty = string => {
  // https://stackoverflow.com/questions/448981/which-characters-are-valid-in-css-class-names-selectors
  // FIXME: Remove comment and fix next line
  // eslint-disable-next-line unicorn/prefer-regexp-test
  if (string && string.match(/^-{2,3}[_a-z]+[\w-]*/i)) return string

  return camelize(string)
}

const stripMergePlaceholders = str =>
  str
    .replace(/:merge\((\S*?)\)/, '$1')
    .replace(/({{)|(}})/g, '')
    .trim()

export {
  throwIf,
  isEmpty,
  getTheme,
  get,
  camelize,
  isClass,
  isShortCss,
  isArbitraryProperty,
  splitOnFirst,
  formatProp,
  isSpaceSeparatedColor,
  isObject,
  getFirstValue,
  replaceSpaceId,
  toArray,
  formatCssProperty,
  stripMergePlaceholders,
}
