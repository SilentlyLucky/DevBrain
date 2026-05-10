import { describe, it, expect } from 'vitest'
import { getFileExtension, isSupportedFile, SUPPORTED_EXTENSIONS } from '@/lib/file-parser'

function makeFile(name: string): File {
  return new File(['content'], name, { type: 'text/plain' })
}

describe('getFileExtension', () => {
  it('returns lowercase extension with leading dot', () => {
    expect(getFileExtension('document.PDF')).toBe('.pdf')
    expect(getFileExtension('README.md')).toBe('.md')
    expect(getFileExtension('script.PY')).toBe('.py')
  })

  it('returns empty string for files with no extension', () => {
    expect(getFileExtension('Makefile')).toBe('')
  })

  it('handles multiple dots - returns last extension', () => {
    expect(getFileExtension('archive.tar.gz')).toBe('.gz')
  })
})

describe('isSupportedFile', () => {
  it('returns true for every extension in SUPPORTED_EXTENSIONS', () => {
    for (const ext of SUPPORTED_EXTENSIONS) {
      const file = makeFile(`test${ext}`)
      expect(isSupportedFile(file), `${ext} should be supported`).toBe(true)
    }
  })

  it('returns false for .exe', () => {
    expect(isSupportedFile(makeFile('virus.exe'))).toBe(false)
  })

  it('returns false for .xyz', () => {
    expect(isSupportedFile(makeFile('unknown.xyz'))).toBe(false)
  })

  it('returns false for file with no extension', () => {
    expect(isSupportedFile(makeFile('Makefile'))).toBe(false)
  })
})
