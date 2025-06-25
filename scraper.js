import axios from 'axios'
import cheerio from 'cheerio'

export async function getEbayData(ean) {
  const url = `https://www.ebay.de/sch/i.html?_nkw=${ean}&_sacat=0&LH_Sold=1&LH_Complete=1&LH_ItemCondition=3&rt=nc&LH_PrefLoc=1`
  const res = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  })

  const $ = cheerio.load(res.data)
  const prices = []

  $('.s-item__price').each((i, el) => {
    const text = $(el).text().replace(/[^\d,.]/g, '').replace(',', '.')
    const price = parseFloat(text)
    if (!isNaN(price)) prices.push(price)
  })

  const durchschnitt = prices.reduce((a, b) => a + b, 0) / prices.length

  return {
    durchschnitt_vk: +durchschnitt.toFixed(2),
    verkaeufe_pro_monat: prices.length,
    preise: prices
  }
}