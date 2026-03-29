import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { WeatherPanel } from './WeatherPanel'

function renderPanel(props: Partial<Parameters<typeof WeatherPanel>[0]> = {}) {
  return render(
    <WeatherPanel isOpen={true} onClose={vi.fn()} cityName="Atlanta" {...props}>
      <button>First</button>
      <button>Second</button>
      <button>Third</button>
    </WeatherPanel>
  )
}

describe('WeatherPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.style.overflow = ''
  })

  describe('dialog semantics', () => {
    it('has role="dialog" and aria-modal="true"', () => {
      renderPanel()

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
    })

    it('has aria-labelledby pointing to the heading', () => {
      renderPanel()

      const dialog = screen.getByRole('dialog')
      const labelledById = dialog.getAttribute('aria-labelledby')
      expect(labelledById).toBeTruthy()

      const heading = document.getElementById(labelledById!)
      expect(heading).toBeTruthy()
      expect(heading!.textContent).toBe('Atlanta')
    })
  })

  describe('focus management', () => {
    it('moves focus into panel when opened', async () => {
      const triggerBtn = document.createElement('button')
      triggerBtn.textContent = 'Trigger'
      document.body.appendChild(triggerBtn)
      triggerBtn.focus()

      renderPanel({ isOpen: true })

      await act(async () => {
        await new Promise((r) => requestAnimationFrame(r))
      })

      const dialog = screen.getByRole('dialog')
      expect(dialog.contains(document.activeElement)).toBe(true)

      document.body.removeChild(triggerBtn)
    })

    it('restores focus to trigger element on close', async () => {
      const triggerBtn = document.createElement('button')
      triggerBtn.textContent = 'Trigger'
      document.body.appendChild(triggerBtn)
      triggerBtn.focus()

      const onClose = vi.fn()
      const { rerender } = render(
        <WeatherPanel isOpen={true} onClose={onClose} cityName="Atlanta">
          <button>Inside</button>
        </WeatherPanel>
      )

      await act(async () => {
        await new Promise((r) => requestAnimationFrame(r))
      })

      // Close via close button
      fireEvent.click(screen.getByRole('button', { name: 'Close panel' }))
      expect(onClose).toHaveBeenCalled()

      rerender(
        <WeatherPanel isOpen={false} onClose={onClose} cityName="Atlanta">
          <button>Inside</button>
        </WeatherPanel>
      )

      await act(async () => {
        await new Promise((r) => requestAnimationFrame(r))
      })

      expect(document.activeElement).toBe(triggerBtn)

      document.body.removeChild(triggerBtn)
    })
  })

  describe('focus trap', () => {
    it('wraps Tab from last to first element', async () => {
      renderPanel()

      await act(async () => {
        await new Promise((r) => requestAnimationFrame(r))
      })

      // Focus the last focusable element (Third button)
      const buttons = screen.getAllByRole('button')
      const lastButton = buttons[buttons.length - 1]
      lastButton.focus()

      fireEvent.keyDown(document, { key: 'Tab' })

      // Focus should wrap to the first focusable element in the panel
      const dialog = screen.getByRole('dialog')
      expect(dialog.contains(document.activeElement)).toBe(true)
    })

    it('wraps Shift+Tab from first to last element', async () => {
      renderPanel()

      await act(async () => {
        await new Promise((r) => requestAnimationFrame(r))
      })

      // Focus the first focusable element inside the panel
      // The close button is before the child buttons in DOM order
      const closeBtn = screen.getByRole('button', { name: 'Close panel' })
      closeBtn.focus()

      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })

      const dialog = screen.getByRole('dialog')
      expect(dialog.contains(document.activeElement)).toBe(true)
    })
  })

  describe('close triggers', () => {
    it('Escape calls onClose', async () => {
      const onClose = vi.fn()
      renderPanel({ onClose })

      await act(async () => {
        await new Promise((r) => requestAnimationFrame(r))
      })

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(onClose).toHaveBeenCalled()
    })

    it('backdrop click calls onClose', () => {
      const onClose = vi.fn()
      const { container } = renderPanel({ onClose })

      const backdrop = container.querySelector('.weather-panel-backdrop')!
      fireEvent.click(backdrop)

      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('scroll lock', () => {
    it('sets body overflow to hidden when open', () => {
      renderPanel({ isOpen: true })

      expect(document.body.style.overflow).toBe('hidden')
    })

    it('restores body overflow when closed', () => {
      const { rerender } = render(
        <WeatherPanel isOpen={true} onClose={vi.fn()} cityName="Atlanta">
          <div>content</div>
        </WeatherPanel>
      )

      expect(document.body.style.overflow).toBe('hidden')

      rerender(
        <WeatherPanel isOpen={false} onClose={vi.fn()} cityName="Atlanta">
          <div>content</div>
        </WeatherPanel>
      )

      expect(document.body.style.overflow).toBe('')
    })
  })
})
