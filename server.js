import express from 'express'
import { getEbayData } from './scraper.js'

const app = express()
const port = process.env.PORT || 3000

app.get('/ebay-data', async (req, res) => {
  const ean = req.query.ean
  if (!ean) return res.status(400).json({ error: 'EAN fehlt' })

  try {
    const result = await getEbayData(ean)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'Fehler beim Abruf', details: err.toString() })
  }
})

app.listen(port, () => {
  console.log(`✅ Server läuft auf Port ${port}`)
})