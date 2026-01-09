import { describe, expect, it } from 'vitest'

import { Diagnostic, Diagnostics } from './diagnostics'

describe('Diagnostic', () => {
  it('stores severity, message, and context', () => {
    const diagnostic = new Diagnostic('error', 'test message', 'test:context')
    expect(diagnostic.severity).toBe('error')
    expect(diagnostic.message).toBe('test message')
    expect(diagnostic.context).toBe('test:context')
  })

  it('allows undefined context', () => {
    const diagnostic = new Diagnostic('warning', 'test message')
    expect(diagnostic.context).toBeUndefined()
  })
})

describe('Diagnostics', () => {
  describe('add', () => {
    it('adds diagnostic with string message', () => {
      const diagnostics = new Diagnostics()
      diagnostics.add('error', 'test message')
      expect(diagnostics.size).toBe(1)
      expect(diagnostics.all[0].message).toBe('test message')
      expect(diagnostics.all[0].severity).toBe('error')
    })

    it('adds diagnostic with input object', () => {
      const diagnostics = new Diagnostics()
      diagnostics.add('warning', { message: 'test message', context: 'test:context' })
      expect(diagnostics.all[0].message).toBe('test message')
      expect(diagnostics.all[0].context).toBe('test:context')
    })

    it('returns this for chaining', () => {
      const diagnostics = new Diagnostics()
      const result = diagnostics.add('info', 'test')
      expect(result).toBe(diagnostics)
    })
  })

  describe('warning', () => {
    it('adds warning-level diagnostic', () => {
      const diagnostics = new Diagnostics()
      diagnostics.warning('test warning')
      expect(diagnostics.all[0].severity).toBe('warning')
    })
  })

  describe('error', () => {
    it('adds error-level diagnostic', () => {
      const diagnostics = new Diagnostics()
      diagnostics.error('test error')
      expect(diagnostics.all[0].severity).toBe('error')
    })
  })

  describe('hasErrors', () => {
    it('returns true when errors exist', () => {
      const diagnostics = new Diagnostics()
      diagnostics.error('test error')
      expect(diagnostics.hasErrors).toBe(true)
    })

    it('returns false when only warnings exist', () => {
      const diagnostics = new Diagnostics()
      diagnostics.warning('test warning')
      expect(diagnostics.hasErrors).toBe(false)
    })

    it('returns false when empty', () => {
      const diagnostics = new Diagnostics()
      expect(diagnostics.hasErrors).toBe(false)
    })
  })

  describe('merge', () => {
    it('combines diagnostics from another instance', () => {
      const a = new Diagnostics()
      const b = new Diagnostics()
      a.error('error a')
      b.warning('warning b')
      a.merge(b)
      expect(a.size).toBe(2)
      expect(a.all[0].message).toBe('error a')
      expect(a.all[1].message).toBe('warning b')
    })

    it('returns this for chaining', () => {
      const a = new Diagnostics()
      const b = new Diagnostics()
      const result = a.merge(b)
      expect(result).toBe(a)
    })
  })

  describe('clear', () => {
    it('removes all diagnostics', () => {
      const diagnostics = new Diagnostics()
      diagnostics.error('error')
      diagnostics.warning('warning')
      diagnostics.clear()
      expect(diagnostics.size).toBe(0)
    })

    it('returns this for chaining', () => {
      const diagnostics = new Diagnostics()
      const result = diagnostics.clear()
      expect(result).toBe(diagnostics)
    })
  })

  describe('size', () => {
    it('returns number of diagnostics', () => {
      const diagnostics = new Diagnostics()
      expect(diagnostics.size).toBe(0)
      diagnostics.error('error')
      expect(diagnostics.size).toBe(1)
      diagnostics.warning('warning')
      expect(diagnostics.size).toBe(2)
    })
  })

  describe('all', () => {
    it('returns array of diagnostics', () => {
      const diagnostics = new Diagnostics()
      diagnostics.error('error')
      diagnostics.warning('warning')
      expect(diagnostics.all).toHaveLength(2)
    })
  })

  describe('iteration', () => {
    it('implements Iterable interface', () => {
      const diagnostics = new Diagnostics()
      diagnostics.error('error')
      diagnostics.warning('warning')
      const items = [...diagnostics]
      expect(items).toHaveLength(2)
      expect(items[0].message).toBe('error')
      expect(items[1].message).toBe('warning')
    })
  })
})
