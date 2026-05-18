import { useState, useEffect } from 'react'
import Head from 'next/head'

const TABS = ['Recommendations', 'Reading', 'Library']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function getDateFromBook(book) {
  if (book.finishedMonth && book.finishedYear) {
    const monthIndex = MONTHS.indexOf(book.finishedMonth)
    return new Date(parseInt(book.finishedYear), monthIndex, 1)
  }
  if (book.finishedAt) return new Date(book.finishedAt)
  return new Date(0)
}

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(null)

  function getStarFill(star, value) {
    if (value >= star) return 'full'
    if (value >= star - 0.5) return 'half'
    return 'empty'
  }

  function handleClick(e, star) {
    if (!onChange) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const isHalf = x < rect.width / 2
    onChange(isHalf ? star - 0.5 : star)
  }

  function handleMouseMove(e, star) {
    if (!onChange) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const isHalf = x < rect.width / 2
    setHover(isHalf ? star - 0.5 : star)
  }

  const displayValue = hover !== null ? hover : value

  return (
    <div style={{ display: 'flex', gap: 2 }} onMouseLeave={() => setHover(null)}>
      {[1,2,3,4,5].map(star => {
        const fill = getStarFill(star, displayValue)
        return (
          <div key={star} onClick={e => handleClick(e, star)}
            onMouseMove={e => handleMouseMove(e, star)}
            style={{ cursor: onChange ? 'pointer' : 'default', position: 'relative', width: 22, height: 22 }}>
            {/* Background star (empty) */}
            <svg width="22" height="22" viewBox="0 0 22 22" style={{ position: 'absolute', top: 0, left: 0 }}>
              <polygon points="11,2 13.5,8.5 20.5,8.5 15,13 17,20 11,16 5,20 7,13 1.5,8.5 8.5,8.5"
                fill="none" stroke="var(--border-hover)" strokeWidth="1.5" />
            </svg>
            {/* Filled portion */}
            {fill !== 'empty' && (
              <svg width="22" height="22" viewBox="0 0 22 22" style={{ position: 'absolute', top: 0, left: 0 }}>
                <defs>
                  <clipPath id={`clip-${star}`}>
                    <rect x="0" y="0" width={fill === 'half' ? '11' : '22'} height="22" />
                  </clipPath>
                </defs>
                <polygon points="11,2 13.5,8.5 20.5,8.5 15,13 17,20 11,16 5,20 7,13 1.5,8.5 8.5,8.5"
                  fill="var(--accent)" clipPath={`url(#clip-${star})`} />
              </svg>
            )}
          </div>
        )
      })}
      {value > 0 && (
        <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 4, lineHeight: '22px' }}>
          {value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}
        </span>
      )}
    </div>
  )
}

function MonthYearPicker({ month, year, onMonthChange, onYearChange }) {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i)
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
      <select value={month} onChange={e => onMonthChange(e.target.value)} style={{
        flex: 1, background: 'var(--bg-3)', border: '0.5px solid var(--border)',
        borderRadius: 6, padding: '8px 10px', fontSize: 13, color: 'var(--text)', outline: 'none', cursor: 'pointer',
      }}>
        {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <select value={year} onChange={e => onYearChange(e.target.value)} style={{
        width: 100, background: 'var(--bg-3)', border: '0.5px solid var(--border)',
        borderRadius: 6, padding: '8px 10px', fontSize: 13, color: 'var(--text)', outline: 'none', cursor: 'pointer',
      }}>
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  )
}

function BookCard({ book, onStartReading, onFinish, onDelete, isAdmin }) {
  const [finishing, setFinishing] = useState(false)
  const [rating, setRating] = useState(4)
  const [notes, setNotes] = useState('')
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()])
  const [year, setYear] = useState(new Date().getFullYear().toString())

  function formatFinished(book) {
    if (book.finishedMonth && book.finishedYear) return `${book.finishedMonth} ${book.finishedYear}`
    if (book.finishedAt) return new Date(book.finishedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    return null
  }

  return (
    <div style={{
      background: 'var(--bg-2)', border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '1.5rem', marginBottom: 8, transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 400, color: 'var(--text)', lineHeight: 1.4, marginBottom: 4 }}>
            {book.title}
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: book.why || book.summary || book.notes ? 10 : 0 }}>{book.author}</p>
          {book.why && <p style={{ fontSize: 13, color: 'var(--accent)', lineHeight: 1.6, marginBottom: 8 }}>{book.why}</p>}
          {book.summary && <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 8 }}>{book.summary}</p>}
          {!book.startedAt && book.notes && <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 8, fontStyle: 'italic' }}>"{book.notes}"</p>}
          {!book.startedAt && book.rating > 0 && <StarRating value={book.rating} />}
          {formatFinished(book) && (
            <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>Finished {formatFinished(book)}</p>
          )}
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
            {onStartReading && (
              <button onClick={() => onStartReading(book)} style={{
                background: 'var(--accent)', border: 'none', borderRadius: 6,
                padding: '6px 12px', fontSize: 12, fontWeight: 500, color: '#0a0a0a',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}>Reading →</button>
            )}
            {onFinish && !finishing && (
              <button onClick={() => setFinishing(true)} style={{
                background: 'var(--bg-3)', border: '0.5px solid var(--border)', borderRadius: 6,
                padding: '6px 12px', fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', whiteSpace: 'nowrap',
              }}>Finished</button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(book)} style={{
                background: 'none', border: '0.5px solid var(--border)', borderRadius: 6,
                padding: '6px 12px', fontSize: 12, color: 'var(--text-dim)', cursor: 'pointer',
              }}>Remove</button>
            )}
          </div>
        )}
      </div>

      {finishing && (
        <div style={{ marginTop: 16, borderTop: '0.5px solid var(--border)', paddingTop: 16 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Rate this book:</p>
          <StarRating value={rating} onChange={setRating} />
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="What did you like about it? (optional)" rows={3} style={{
              width: '100%', marginTop: 12, background: 'var(--bg-3)',
              border: '0.5px solid var(--border)', borderRadius: 6,
              padding: '10px 12px', fontSize: 13, color: 'var(--text)', resize: 'vertical', outline: 'none',
            }} />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, marginBottom: 4 }}>When did you finish it?</p>
          <MonthYearPicker month={month} year={year} onMonthChange={setMonth} onYearChange={setYear} />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={() => onFinish(book, rating, notes, month, year)} style={{
              background: 'var(--accent)', border: 'none', borderRadius: 6,
              padding: '8px 16px', fontSize: 13, fontWeight: 500, color: '#0a0a0a', cursor: 'pointer',
            }}>Save & finish</button>
            <button onClick={() => setFinishing(false)} style={{
              background: 'none', border: '0.5px solid var(--border)', borderRadius: 6,
              padding: '8px 16px', fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer',
            }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

function AddBookModal({ onAdd, onClose }) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [rating, setRating] = useState(4)
  const [notes, setNotes] = useState('')
  const [mode, setMode] = useState('read')
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()])
  const [year, setYear] = useState(new Date().getFullYear().toString())

  async function handleSubmit() {
    if (!title || !author) return
    const book = {
      id: Date.now().toString(), title, author, rating, notes,
      finishedMonth: mode === 'read' ? month : undefined,
      finishedYear: mode === 'read' ? year : undefined,
    }
    await onAdd(book, mode)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--bg-2)', border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '2rem', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto',
      }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400, color: 'var(--text)', marginBottom: '1.5rem' }}>Add a book</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['read', 'reading'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              background: mode === m ? 'var(--accent)' : 'var(--bg-3)', border: 'none', borderRadius: 6,
              padding: '6px 14px', fontSize: 13, fontWeight: mode === m ? 500 : 400,
              color: mode === m ? '#0a0a0a' : 'var(--text-muted)', cursor: 'pointer',
            }}>{m === 'read' ? 'Already read' : 'Currently reading'}</button>
          ))}
        </div>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" style={{
          width: '100%', marginBottom: 10, background: 'var(--bg-3)', border: '0.5px solid var(--border)',
          borderRadius: 6, padding: '10px 12px', fontSize: 14, color: 'var(--text)', outline: 'none',
        }} />
        <input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Author" style={{
          width: '100%', marginBottom: 16, background: 'var(--bg-3)', border: '0.5px solid var(--border)',
          borderRadius: 6, padding: '10px 12px', fontSize: 14, color: 'var(--text)', outline: 'none',
        }} />
        {mode === 'read' && (
          <>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Rating:</p>
            <StarRating value={rating} onChange={setRating} />
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="What did you like about it? (optional)" rows={3} style={{
                width: '100%', marginTop: 12, background: 'var(--bg-3)', border: '0.5px solid var(--border)',
                borderRadius: 6, padding: '10px 12px', fontSize: 13, color: 'var(--text)', resize: 'vertical', outline: 'none',
              }} />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, marginBottom: 4 }}>When did you finish it?</p>
            <MonthYearPicker month={month} year={year} onMonthChange={setMonth} onYearChange={setYear} />
          </>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button onClick={handleSubmit} style={{
            background: 'var(--accent)', border: 'none', borderRadius: 6,
            padding: '10px 20px', fontSize: 14, fontWeight: 500, color: '#0a0a0a', cursor: 'pointer', flex: 1,
          }}>Add book</button>
          <button onClick={onClose} style={{
            background: 'none', border: '0.5px solid var(--border)', borderRadius: 6,
            padding: '10px 20px', fontSize: 14, color: 'var(--text-muted)', cursor: 'pointer',
          }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [tab, setTab] = useState(0)
  const [books, setBooks] = useState({ read: [], reading: [] })
  const [recs, setRecs] = useState(null)
  const [recsLoading, setRecsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [password, setPassword] = useState('')
  const [showLogin, setShowLogin] = useState(false)
  const [showAddBook, setShowAddBook] = useState(false)
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    fetch('/api/books').then(r => r.json()).then(data => { setBooks(data); setLoading(false) })
  }, [])

  useEffect(() => {
    if (tab === 0 && !recs && !recsLoading) {
      setRecsLoading(true)
      fetch('/api/recommendations').then(r => r.json()).then(data => { setRecs(data); setRecsLoading(false) })
    }
  }, [tab])

  async function apiPost(action, book, extra = {}) {
    const res = await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, action, book, ...extra })
    })
    const data = await res.json()
    if (!data.error) setBooks(data)
    return data
  }

  async function handleStartReading(book) { await apiPost('add_reading', book) }

  async function handleFinish(book, rating, notes, month, year) {
    await apiPost('finish', { ...book, rating, notes, finishedMonth: month, finishedYear: year })
    setRecs(null)
    fetch('/api/recommendations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })
  }

  async function handleAddBook(book, mode) {
    if (mode === 'reading') await apiPost('add_reading', book)
    else await apiPost('add_read', book)
    setRecs(null)
    fetch('/api/recommendations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })
  }

  async function handleDeleteRead(book) { await apiPost('delete_read', book) }
  async function handleRemoveReading(book) { await apiPost('remove_reading', book) }

  function handleLogin(e) { e.preventDefault(); setIsAdmin(true); setShowLogin(false) }

  const sortedRead = [...books.read].sort((a, b) => {
    if (sortBy === 'newest') return getDateFromBook(b) - getDateFromBook(a)
    if (sortBy === 'oldest') return getDateFromBook(a) - getDateFromBook(b)
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0)
    return 0
  })

  return (
    <>
      <Head>
        <title>Reading — Anjelia</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0c0c0c" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Reading" />
      </Head>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>

        <div style={{ marginBottom: '2.5rem', animation: 'fadeUp 0.5s ease forwards' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
              {books.read.length} books read
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {isAdmin && (
                <button onClick={() => setShowAddBook(true)} style={{
                  background: 'var(--accent)', border: 'none', borderRadius: 6,
                  padding: '5px 12px', fontSize: 12, fontWeight: 500, color: '#0a0a0a', cursor: 'pointer',
                }}>+ Add book</button>
              )}
              {!isAdmin ? (
                <button onClick={() => setShowLogin(true)} style={{
                  background: 'none', border: 'none', fontSize: 11,
                  letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-dim)', cursor: 'pointer',
                }}>Admin</button>
              ) : (
                <button onClick={() => setIsAdmin(false)} style={{
                  background: 'none', border: 'none', fontSize: 11, color: 'var(--text-dim)', cursor: 'pointer',
                }}>Sign out</button>
              )}
            </div>
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(32px, 5vw, 44px)', fontWeight: 400, color: 'var(--text)', lineHeight: 1.15, marginBottom: '1.5rem' }}>
            Reading
          </h1>
          <div style={{ height: '0.5px', background: 'var(--border)' }} />
        </div>

        {showLogin && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          }} onClick={e => e.target === e.currentTarget && setShowLogin(false)}>
            <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '2rem', width: 320 }}>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 400, color: 'var(--text)', marginBottom: '1rem' }}>Admin login</h2>
              <form onSubmit={handleLogin}>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Password" autoFocus style={{
                    width: '100%', marginBottom: 12, background: 'var(--bg-3)',
                    border: '0.5px solid var(--border)', borderRadius: 6,
                    padding: '10px 12px', fontSize: 14, color: 'var(--text)', outline: 'none',
                  }} />
                <button type="submit" style={{
                  width: '100%', background: 'var(--accent)', border: 'none', borderRadius: 6,
                  padding: '10px', fontSize: 14, fontWeight: 500, color: '#0a0a0a', cursor: 'pointer',
                }}>Sign in</button>
              </form>
            </div>
          </div>
        )}

        {showAddBook && <AddBookModal onAdd={handleAddBook} onClose={() => setShowAddBook(false)} />}

        <div style={{ display: 'flex', gap: 0, marginBottom: '2rem', borderBottom: '0.5px solid var(--border)' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{
              background: 'none', border: 'none',
              borderBottom: tab === i ? '1.5px solid var(--accent)' : '1.5px solid transparent',
              padding: '10px 20px', fontSize: 13, fontWeight: tab === i ? 500 : 400,
              color: tab === i ? 'var(--text)' : 'var(--text-dim)',
              cursor: 'pointer', marginBottom: '-1px', transition: 'all 0.15s',
            }}>
              {t}
              {t === 'Reading' && books.reading.length > 0 && (
                <span style={{ marginLeft: 6, fontSize: 10, background: 'var(--accent)', color: '#0a0a0a', borderRadius: 10, padding: '2px 6px', fontWeight: 600 }}>
                  {books.reading.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 0 && (
          <div>
            {recsLoading && (
              <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                <div style={{ width: 24, height: 24, border: '1.5px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Finding your next reads...</p>
              </div>
            )}
            {recs?.recommendations?.map((book, i) => (
              <BookCard key={i} book={book} isAdmin={isAdmin} onStartReading={isAdmin ? handleStartReading : null} />
            ))}
            {isAdmin && recs && (
              <button onClick={() => {
                setRecs(null); setRecsLoading(true)
                fetch('/api/recommendations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })
                  .then(() => fetch('/api/recommendations').then(r => r.json()).then(d => { setRecs(d); setRecsLoading(false) }))
              }} style={{
                background: 'none', border: '0.5px solid var(--border)', borderRadius: 'var(--radius)',
                padding: '10px 20px', fontSize: 13, color: 'var(--text-muted)',
                cursor: 'pointer', width: '100%', marginTop: 8,
              }}>Refresh recommendations</button>
            )}
          </div>
        )}

        {tab === 1 && (
          <div>
            {books.reading.length === 0 && (
              <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 8 }}>Nothing in progress.</p>
                <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Pick something from your recommendations.</p>
              </div>
            )}
            {books.reading.map((book, i) => (
              <BookCard key={i} book={book} isAdmin={isAdmin}
                onFinish={isAdmin ? handleFinish : null}
                onDelete={isAdmin ? handleRemoveReading : null} />
            ))}
          </div>
        )}

        {tab === 2 && (
          <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {[['newest', 'Newest'], ['oldest', 'Oldest'], ['rating', 'Top rated']].map(([val, label]) => (
                <button key={val} onClick={() => setSortBy(val)} style={{
                  background: sortBy === val ? 'var(--accent)' : 'var(--bg-2)',
                  border: `0.5px solid ${sortBy === val ? 'transparent' : 'var(--border)'}`,
                  borderRadius: 20, padding: '5px 12px', fontSize: 12,
                  fontWeight: sortBy === val ? 500 : 400,
                  color: sortBy === val ? '#0a0a0a' : 'var(--text-muted)', cursor: 'pointer',
                }}>{label}</button>
              ))}
            </div>
            {sortedRead.length === 0 && (
              <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No books yet. Add your first one.</p>
              </div>
            )}
            {sortedRead.map((book, i) => (
              <BookCard key={i} book={book} isAdmin={isAdmin} onDelete={isAdmin ? handleDeleteRead : null} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
