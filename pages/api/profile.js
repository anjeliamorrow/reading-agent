import { getProfile, saveProfile } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const profile = await getProfile()
    return res.status(200).json(profile)
  }

  if (req.method === 'POST') {
    const { password, interests, preferences } = req.body
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const profile = { interests, preferences }
    await saveProfile(profile)
    return res.status(200).json(profile)
  }

  return res.status(405).end()
}
