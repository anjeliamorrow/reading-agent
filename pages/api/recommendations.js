import Anthropic from '@anthropic-ai/sdk'
import { getBooks, getProfile, getRecommendations, saveRecommendations } from '../../lib/db'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const cached = await getRecommendations()
    if (cached) return res.status(200).json(cached)

    const [books, profile] = await Promise.all([getBooks(), getProfile()])

    const readList = books.read.map(b =>
      `- ${b.title} by ${b.author} (${b.rating}/5 stars): ${b.notes}`
    ).join('\n')

    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `You are a personal book curator for someone with the following profile:

Interests: ${profile.interests}
Preferences: ${profile.preferences}

Books they have already read:
${readList || 'None yet'}

Based on their taste, recommend exactly 6 books they have NOT already read. Be specific to their interests — do not recommend generic bestsellers unless they genuinely fit. For each book explain exactly why it matches their specific taste.

Return ONLY raw JSON, no markdown:
{
  "recommendations": [
    {
      "title": "book title",
      "author": "author name",
      "why": "2-3 sentences on exactly why this fits their taste and what they will get from it",
      "summary": "2-3 sentences on what the book is about"
    }
  ]
}`
      }]
    })

    const raw = msg.content[0].text.trim()
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}') + 1
    const parsed = JSON.parse(raw.slice(start, end))

    await saveRecommendations(parsed)
    return res.status(200).json(parsed)
  }

  if (req.method === 'POST') {
    const { password } = req.body
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    await saveRecommendations(null)
    return res.status(200).json({ ok: true })
  }

  return res.status(405).end()
}
