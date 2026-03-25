import { useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { NoteItem } from '../types'
export function NotesPanel({ notes, setNotes }: { notes: NoteItem[]; setNotes: Dispatch<SetStateAction<NoteItem[]>> }) {
  const [draftTitle, setDraftTitle] = useState(''); const [draftBody, setDraftBody] = useState('')
  const sortedNotes = useMemo(() => [...notes].sort((a, b) => a.title.localeCompare(b.title)), [notes])
  const addNote = () => { const title = draftTitle.trim(); const body = draftBody.trim(); if (!title || !body) return; setNotes((current) => [{ id: `note-${crypto.randomUUID()}`, title, body, tag: 'local', updatedAt: 'Now' }, ...current]); setDraftTitle(''); setDraftBody('') }
  return <section className="panel"><div className="panel-header"><div><p className="eyebrow">Field notes</p><h3>Notes</h3></div><span className="pill stable">Persisted</span></div><div className="notes-composer"><input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} placeholder="Add note title" /><textarea value={draftBody} onChange={(event) => setDraftBody(event.target.value)} placeholder="Capture a decision, observation, or instruction" rows={4} /><button className="ghost-button" onClick={addNote}>Save note</button></div><div className="list-grid">{sortedNotes.map((note) => <article key={note.id} className="info-card"><div className="panel-header"><strong>{note.title}</strong><span className="pill">{note.tag}</span></div><p>{note.body}</p><p className="note-timestamp">Updated {note.updatedAt}</p></article>)}</div></section>
}
