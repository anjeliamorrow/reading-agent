const BASE_URL = process.env.KV_REST_API_URL
const TOKEN = process.env.KV_REST_API_TOKEN

async function kv(commands) {
  const res = await fetch(`${BASE_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  })
  const data = await res.json()
  return data
}

export async function getBooks() {
  const res = await kv([['GET', 'books']])
  const raw = res[0]?.result
  return raw ? JSON.parse(raw) : { read: [], reading: [] }
}

export async function saveBooks(books) {
  await kv([['SET', 'books', JSON.stringify(books)]])
}

export async function getProfile() {
  const res = await kv([['GET', 'profile']])
  const raw = res[0]?.result
  return raw ? JSON.parse(raw) : {
    interests: 'business, entrepreneurship, AI, philosophy, success stories',
    preferences: 'I like books that are dense with ideas, not just motivational fluff. I prefer authors who have actually done the thing they are writing about.'
  }
}

export async function saveProfile(profile) {
  await kv([['SET', 'profile', JSON.stringify(profile)]])
}

export async function getRecommendations() {
  const res = await kv([['GET', 'recommendations']])
  const raw = res[0]?.result
  return raw ? JSON.parse(raw) : null
}

export async function saveRecommendations(recs) {
  await kv([['SET', 'recommendations', JSON.stringify(recs), 'EX', 86400]])
}
