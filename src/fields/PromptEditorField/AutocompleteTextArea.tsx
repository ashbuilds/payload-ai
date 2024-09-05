import * as inputSelection from 'get-input-selection'
import isEqual from 'lodash.isequal'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import scrollIntoView from 'scroll-into-view-if-needed'
import getCaretCoordinates from 'textarea-caret'

import styles from './AutocompleteTextArea.module.scss'

const KEY_UP = 38
const KEY_DOWN = 40
const KEY_RETURN = 13
const KEY_ENTER = 14
const KEY_ESCAPE = 27
const KEY_TAB = 9

const OPTION_LIST_MIN_WIDTH = 100

export const AutocompleteTextField = (props) => {
  const {
    changeOnSelect = (trigger, slug) => trigger + slug,
    defaultValue = '',
    disabled = false,
    matchAny = false,
    maxOptions = 10,
    minChars = 0,
    offsetX = 0,
    offsetY = 0,
    onBlur = (e: any) => {},
    onChange = (e: any) => {},
    onKeyDown = (e: any) => {},
    onRequestOptions = (e: any) => {},
    onSelect = (e: any) => {},
    options = [],
    passThroughEnter = false,
    passThroughTab = true,
    regex = '^[A-Za-z0-9\\-_]+$',
    requestOnlyIfNoOptions = true,
    spaceRemovers = [',', '.', '!', '?'],
    spacer = ' ',
    trigger = '@',
    triggerCaseInsensitive = false,
    triggerMatchWholeWord = false,
    value: propValue = null,
    ...rest
  } = props

  const [helperVisible, setHelperVisible] = useState(false)
  const [left, setLeft] = useState(0)
  const [top, setTop] = useState(0)
  const [triggerChar, setTriggerChar] = useState(null)
  const [matchLength, setMatchLength] = useState(0)
  const [matchStart, setMatchStart] = useState(0)
  const [selection, setSelection] = useState(0)
  const [value, setValue] = useState(null)
  const [caret, setCaret] = useState(0)
  const [currentOptions, setCurrentOptions] = useState([])

  const recentValue = useRef(defaultValue)
  const enableSpaceRemovers = useRef(false)
  const inputRef = useRef(null)
  const currentRef = useRef(null)
  const parentRef = useRef(null)

  useEffect(() => {
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleResize)
    }
  }, [])

  useEffect(() => {
    if (!isEqual(options, currentOptions)) {
      updateHelper(recentValue.current, caret, options)
    }
  }, [options, caret])

  useEffect(() => {
    if (helperVisible && currentRef.current) {
      scrollIntoView(currentRef.current, { boundary: parentRef.current, scrollMode: 'if-needed' })
    }
  }, [helperVisible, selection])

  const handleResize = useCallback(() => {
    setHelperVisible(false)
  }, [])

  const isTrigger = useCallback(
    (triggerStr, str, i) => {
      if (!triggerStr || !triggerStr.length) {
        return true
      }

      if (triggerMatchWholeWord && i > 0 && str.charAt(i - 1).match(/\w/)) {
        return false
      }

      if (
        str.substr(i, triggerStr.length) === triggerStr ||
        (triggerCaseInsensitive &&
          str.substr(i, triggerStr.length).toLowerCase() === triggerStr.toLowerCase())
      ) {
        return true
      }

      return false
    },
    [triggerMatchWholeWord, triggerCaseInsensitive],
  )

  const arrayTriggerMatch = useCallback((triggers, re) => {
    return triggers.map((trigger) => ({
      triggerLength: trigger.length,
      triggerMatch: trigger.match(re),
      triggerStr: trigger,
    }))
  }, [])

  const getMatch = useCallback(
    (str, caret, providedOptions) => {
      const re = new RegExp(regex)
      const triggers = Array.isArray(trigger) ? trigger : [trigger]
      triggers.sort()

      const providedOptionsObject = Array.isArray(providedOptions)
        ? triggers.reduce((acc, triggerStr) => ({ ...acc, [triggerStr]: providedOptions }), {})
        : providedOptions

      const triggersMatch = arrayTriggerMatch(triggers, re)
      let slugData = null

      for (let triggersIndex = 0; triggersIndex < triggersMatch.length; triggersIndex++) {
        const { triggerLength, triggerMatch, triggerStr } = triggersMatch[triggersIndex]

        for (let i = caret - 1; i >= 0; --i) {
          const substr = str.substring(i, caret)
          const match = substr.match(re)
          let matchStart = -1

          if (triggerLength > 0) {
            const triggerIdx = triggerMatch ? i : i - triggerLength + 1

            if (triggerIdx < 0) {
              break
            }

            if (isTrigger(triggerStr, str, triggerIdx)) {
              matchStart = triggerIdx + triggerLength
            }

            if (!match && matchStart < 0) {
              break
            }
          } else {
            if (match && i > 0) {
              continue
            }
            matchStart = i === 0 && match ? 0 : i + 1

            if (caret - matchStart === 0) {
              break
            }
          }

          if (matchStart >= 0) {
            const triggerOptions = providedOptionsObject[triggerStr]
            if (triggerOptions == null) {
              continue
            }

            const matchedSlug = str.substring(matchStart, caret)

            const filteredOptions = triggerOptions.filter((slug) => {
              const idx = slug.toLowerCase().indexOf(matchedSlug.toLowerCase())
              return idx !== -1 && (matchAny || idx === 0)
            })

            const currTrigger = triggerStr
            const matchLength = matchedSlug.length

            slugData = {
              matchLength,
              matchStart,
              options: filteredOptions,
              trigger: currTrigger,
            }
          }
        }
      }

      return slugData
    },
    [regex, trigger, arrayTriggerMatch, isTrigger, matchAny],
  )

  const updateCaretPosition = useCallback((newCaret) => {
    setCaret(newCaret)
    inputSelection.default.setCaretPosition(inputRef.current, newCaret)
  }, [])

  const updateHelper = useCallback(
    (str, caretPos, helperOptions) => {
      const slug = getMatch(str, caretPos, helperOptions)

      if (slug) {
        const caretCoordinates = getCaretCoordinates(inputRef.current, caretPos)
        const rect = inputRef.current.getBoundingClientRect()

        const newTop = caretCoordinates.top + rect.top - inputRef.current.scrollTop
        const newLeft = Math.min(
          caretCoordinates.left + rect.left - inputRef.current.scrollLeft,
          window.innerWidth - OPTION_LIST_MIN_WIDTH,
        )

        if (
          slug.matchLength >= minChars &&
          (slug.options.length > 1 ||
            (slug.options.length === 1 &&
              (slug.options[0].length !== slug.matchLength || slug.options[0].length === 1)))
        ) {
          setHelperVisible(true)
          setTop(newTop)
          setLeft(newLeft)
          setTriggerChar(slug.trigger)
          setMatchLength(slug.matchLength)
          setMatchStart(slug.matchStart)
          setCurrentOptions(slug.options)
        } else {
          if (!requestOnlyIfNoOptions || !slug.options.length) {
            onRequestOptions(str.substr(slug.matchStart, slug.matchLength))
          }
          resetHelper()
        }
      } else {
        resetHelper()
      }
    },
    [getMatch, minChars, requestOnlyIfNoOptions, onRequestOptions],
  )

  const resetHelper = useCallback(() => {
    setHelperVisible(false)
    setSelection(0)
  }, [])

  const handleChange = useCallback(
    (e) => {
      const str = e.target.value
      const caretPos = inputSelection.default.default(e.target).end

      if (!str.length) {
        setHelperVisible(false)
      }

      recentValue.current = str

      setCaret(caretPos)
      setValue(e.target.value)

      if (!str.length || !caretPos) {
        return onChange(e.target.value)
      }

      // Space removers logic
      if (enableSpaceRemovers.current && spaceRemovers.length && str.length > 2 && spacer.length) {
        for (let i = 0; i < Math.max(recentValue.current.length, str.length); ++i) {
          if (recentValue.current[i] !== str[i]) {
            if (
              i >= 2 &&
              str[i - 1] === spacer &&
              spaceRemovers.indexOf(str[i - 2]) === -1 &&
              spaceRemovers.indexOf(str[i]) !== -1 &&
              getMatch(str.substring(0, i - 2), caretPos - 3, options)
            ) {
              const newValue = `${str.slice(0, i - 1)}${str.slice(i, i + 1)}${str.slice(i - 1, i)}${str.slice(i + 1)}`

              updateCaretPosition(i + 1)
              inputRef.current.value = newValue

              if (!propValue) {
                setValue(newValue)
              }

              return onChange(newValue)
            }

            break
          }
        }

        enableSpaceRemovers.current = false
      }

      updateHelper(str, caretPos, options)

      if (!propValue) {
        setValue(e.target.value)
      }

      return onChange(e.target.value)
    },
    [
      onChange,
      propValue,
      spaceRemovers,
      spacer,
      options,
      updateCaretPosition,
      updateHelper,
      getMatch,
    ],
  )

  const handleBlur = useCallback(
    (e) => {
      resetHelper()
      onBlur(e)
    },
    [onBlur, resetHelper],
  )

  const handleSelection = useCallback(
    (idx) => {
      const slug = currentOptions[idx]
      const value = recentValue.current
      const part1 =
        triggerChar.length === 0 ? '' : value.substring(0, matchStart - triggerChar.length)
      const part2 = value.substring(matchStart + matchLength)

      const event = { target: inputRef.current }
      const changedStr = changeOnSelect(triggerChar, slug)

      event.target.value = `${part1}${changedStr}${spacer}${part2}`
      handleChange(event)
      onSelect(event.target.value)

      resetHelper()

      const advanceCaretDistance = part1.length + changedStr.length + (spacer ? spacer.length : 1)
      updateCaretPosition(advanceCaretDistance)

      enableSpaceRemovers.current = true
    },
    [
      currentOptions,
      triggerChar,
      matchStart,
      matchLength,
      changeOnSelect,
      spacer,
      handleChange,
      onSelect,
      resetHelper,
      updateCaretPosition,
    ],
  )

  const handleKeyDown = useCallback(
    (event) => {
      const optionsCount =
        maxOptions > 0 ? Math.min(currentOptions.length, maxOptions) : currentOptions.length

      if (helperVisible) {
        switch (event.keyCode) {
          case KEY_ESCAPE:
            event.preventDefault()
            resetHelper()
            break
          case KEY_UP:
            event.preventDefault()
            if (optionsCount > 0) {
              setSelection(
                (prevSelection) => Math.max(0, optionsCount + prevSelection - 1) % optionsCount,
              )
            }
            break
          case KEY_DOWN:
            event.preventDefault()
            if (optionsCount > 0) {
              setSelection((prevSelection) => (prevSelection + 1) % optionsCount)
            }
            break
          case KEY_ENTER:
          case KEY_RETURN:
            if (!passThroughEnter) {
              event.preventDefault()
            }
            handleSelection(selection)
            break
          case KEY_TAB:
            if (!passThroughTab) {
              event.preventDefault()
            }
            handleSelection(selection)
            break
          default:
            onKeyDown(event)
            break
        }
      } else {
        onKeyDown(event)
      }
    },
    [
      helperVisible,
      currentOptions,
      maxOptions,
      passThroughEnter,
      passThroughTab,
      selection,
      onKeyDown,
      resetHelper,
      handleSelection,
    ],
  )

  const renderAutocompleteList = useCallback(() => {
    if (!helperVisible || currentOptions.length === 0) {
      return null
    }

    if (selection >= currentOptions.length) {
      setSelection(0)
      return null
    }

    const optionNumber = maxOptions === 0 ? currentOptions.length : maxOptions

    const helperOptions = currentOptions.slice(0, optionNumber).map((val, idx) => {
      let [helper, value] = val.split(' ')
      if (!value) {
        helper = undefined
        value = val
      }

      // const highlightStart = val
      //   .toLowerCase()
      //   .indexOf(recentValue.current.substr(matchStart, matchLength).toLowerCase())

      // console.log('helper, value: ', helper, value)

      const renderHighlightedText = (text) => {
        const highlightStart = text
          .toLowerCase()
          .indexOf(recentValue.current.substr(matchStart, matchLength).toLowerCase())

        console.log('highlightStart : ', highlightStart)
        console.log('highlightStart text: ', text)

        const highlightedText = text.substr(highlightStart, matchLength)

        if (!val.startsWith(text)) {
          return text
        }

        return (
          <>
            {text.slice(0, highlightStart)}
            <strong>{highlightedText}</strong>
            {text.slice(highlightStart + matchLength)}
          </>
        )
      }

      // TODO: Add helper if defined inside span before value
      // TODO: Add highlight to helper
      return (
        <li
          className={idx === selection ? styles.active : null}
          key={val}
          onClick={() => {
            handleSelection(idx)
          }}
          onMouseDown={(e) => {
            e.preventDefault()
          }}
          onMouseEnter={() => {
            setSelection(idx)
          }}
          ref={idx === selection ? currentRef : null}
          role="presentation"
        >
          {/*{val.slice(0, highlightStart)}*/}
          {/*<strong>{val.substr(highlightStart, matchLength)}</strong>*/}
          {/*{val.slice(highlightStart + matchLength)}*/}

          {helper && <code className={styles.helper}>{renderHighlightedText(helper)}</code>}
          {renderHighlightedText(value)}
        </li>
      )
    })

    const maxWidth = window.innerWidth - left - offsetX - 5
    const maxHeight = window.innerHeight - top - offsetY - 5

    return (
      <ul
        className={styles.autocompleteInput + ' ' + 'popup__content'}
        ref={parentRef}
        style={{
          left: left + offsetX,
          maxHeight,
          maxWidth,
          opacity: 'initial',
          pointerEvents: 'initial',
          position: 'fixed',
          top: top + offsetY,
          visibility: 'initial',
        }}
      >
        {helperOptions}
      </ul>
    )
  }, [
    helperVisible,
    currentOptions,
    selection,
    maxOptions,
    left,
    top,
    offsetX,
    offsetY,
    matchStart,
    matchLength,
    handleSelection,
  ])

  return (
    <div className="popup">
      <textarea
        className="textarea-outer"
        disabled={disabled}
        // onBlur={handleBlur}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        ref={inputRef}
        rows={6}
        style={{ overflow: 'auto' }}
        value={propValue !== null ? propValue : value || defaultValue}
        {...rest}
      />
      {renderAutocompleteList()}
    </div>
  )
}
