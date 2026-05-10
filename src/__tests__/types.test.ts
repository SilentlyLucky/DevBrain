import type { Document, Schedule, ChatMessage } from '@/types'
import { describe, it, expectTypeOf } from 'vitest'

describe('types', () => {
  it('Document has required fields', () => {
    expectTypeOf<Document>().toHaveProperty('id')
    expectTypeOf<Document>().toHaveProperty('user_id')
    expectTypeOf<Document>().toHaveProperty('title')
    expectTypeOf<Document>().toHaveProperty('content')
    expectTypeOf<Document>().toHaveProperty('source_type')
  })

  it('Document source_type includes FILE', () => {
    expectTypeOf<Document['source_type']>().toEqualTypeOf<'PDF' | 'URL' | 'FILE'>()
  })

  it('Document has optional file_extension field', () => {
    expectTypeOf<Document>().toHaveProperty('file_extension')
    expectTypeOf<Document['file_extension']>().toEqualTypeOf<string | null | undefined>()
  })

  it('ChatMessage role is restricted', () => {
    expectTypeOf<ChatMessage['role']>().toEqualTypeOf<'user' | 'assistant'>()
  })

  it('Schedule status is restricted', () => {
    expectTypeOf<Schedule['status']>().toEqualTypeOf<'Upcoming' | 'Completed' | 'Missed'>()
  })
})
