import { getBooks, saveBooks } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const books = await getBooks()
    return res.status(200).json(books)
  }

  if (req.method === 'POST') {
    const { password, action, book } = req.body
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const books = await getBooks()

    if (action === 'add_reading') {
      books.reading.push({ ...book, startedAt: new Date().toISOString() })
    }

    if (action === 'finish') {
      books.reading = books.reading.filter(b => b.id !== book.id)
      books.read.unshift({ ...book, finishedAt: new Date().toISOString() })
    }

    if (action === 'remove_reading') {
      books.reading = books.reading.filter(b => b.id !== book.id)
    }

    if (action === 'add_read') {
      books.read.unshift({ ...book, finishedAt: new Date().toISOString() })
    }

    if (action === 'delete_read') {
      books.read = books.read.filter(b => b.id !== book.id)
    }

    await saveBooks(books)
    return res.status(200).json(books)
  }

  return res.status(405).end()
}
