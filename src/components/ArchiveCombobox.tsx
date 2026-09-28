
import {
  useEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'

type ArchiveComboboxProps = {
  id: string
  name: string
  options: string[]
  placeholder?: string
  required?: boolean
}

function ArchiveCombobox({
  id,
  name,
  options,
  placeholder,
  required = false,
}: ArchiveComboboxProps) {
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] =
    useState(0)

  const wrapperRef =
    useRef<HTMLDivElement>(null)

  const inputRef =
    useRef<HTMLInputElement>(null)

  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  })

  const filteredOptions = options.filter((option) =>
    option
      .toLowerCase()
      .includes(value.toLowerCase()),
  )

  function updateMenuPosition() {
    if (!inputRef.current) {
      return
    }

    const rect =
      inputRef.current.getBoundingClientRect()

    setMenuPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    })
  }

  function openMenu() {
    updateMenuPosition()
    setOpen(true)
    setHighlightedIndex(0)
  }

  function closeMenu() {
    setOpen(false)
  }

  function selectOption(option: string) {
    setValue(option)
    setOpen(false)
    setHighlightedIndex(0)
  }

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target as Node,
        )
      ) {
        closeMenu()
      }
    }

    document.addEventListener(
      'mousedown',
      handleOutsideClick,
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick,
      )
    }
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    function handlePositionChange() {
      updateMenuPosition()
    }

    window.addEventListener(
      'resize',
      handlePositionChange,
    )

    /*
     * Capture scrolling from the drawer/form as well
     * as normal window scrolling.
     */
    document.addEventListener(
      'scroll',
      handlePositionChange,
      true,
    )

    return () => {
      window.removeEventListener(
        'resize',
        handlePositionChange,
      )

      document.removeEventListener(
        'scroll',
        handlePositionChange,
        true,
      )
    }
  }, [open])

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()

      if (!open) {
        openMenu()
        return
      }

      if (filteredOptions.length > 0) {
        setHighlightedIndex((current) =>
          Math.min(
            current + 1,
            filteredOptions.length - 1,
          ),
        )
      }

      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()

      if (filteredOptions.length > 0) {
        setHighlightedIndex((current) =>
          Math.max(current - 1, 0),
        )
      }

      return
    }

    if (event.key === 'Enter') {
      if (
        open &&
        filteredOptions[highlightedIndex]
      ) {
        event.preventDefault()

        selectOption(
          filteredOptions[highlightedIndex],
        )
      }

      return
    }

    if (event.key === 'Escape') {
      closeMenu()
    }
  }

  return (
    <div
      ref={wrapperRef}
      className="archive-combobox"
    >
      <div className="archive-combobox-input-wrapper">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          value={value}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          onFocus={openMenu}
          onClick={openMenu}
          onChange={(event) => {
            setValue(event.target.value)
            openMenu()
          }}
          onKeyDown={handleKeyDown}
        />

        <button
          type="button"
          className="archive-combobox-toggle"
          aria-label={`Open ${id} options`}
          onMouseDown={(event) => {
            event.preventDefault()

            if (open) {
              closeMenu()
            } else {
              inputRef.current?.focus()
              openMenu()
            }
          }}
        >
          <span
            className={
              open
                ? 'archive-combobox-arrow open'
                : 'archive-combobox-arrow'
            }
          >
            ▾
          </span>
        </button>
      </div>

      {open &&
        createPortal(
          <div
            className="archive-combobox-menu"
            style={{
              position: 'fixed',
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
            }}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map(
                (option, index) => (
                  <button
                    key={option}
                    type="button"
                    className={
                      index === highlightedIndex
                        ? 'archive-combobox-option active'
                        : 'archive-combobox-option'
                    }
                    onMouseDown={(event) => {
                      event.preventDefault()
                      selectOption(option)
                    }}
                  >
                    {option}
                  </button>
                ),
              )
            ) : (
              <div className="archive-combobox-empty">
                No existing match — your value
                will be used as entered.
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  )
}

export default ArchiveCombobox
