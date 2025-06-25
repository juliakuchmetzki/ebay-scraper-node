const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 10000;

app.get('/scrape', async (req, res) => {
  const ean = req.query.ean;
  if (!ean) return res.status(400).json({ error: 'EAN fehlt' });

  const ebayUrl = `https://www.ebay.de/sch/i.html?_nkw=${ean}&_sacat=0&LH_ItemCondition=1000&LH_Sold=1&LH_Complete=1`;

  try {
    const { data } = await axios.get(ebayUrl);
    const $ = cheerio.load(data);
    const items = [];

    $('.s-item').each((i, el) => {
      const title = $(el).find('.s-item__title').text().trim();
      const priceText = $(el).find('.s-item__price').text().trim();
      const price = parseFloat(priceText.replace(/[^\d,]/g, '').replace(',', '.'));

      if (title && !isNaN(price)) {
        items.push({ title, price });
      }
    });

    const avgPrice = items.length > 0
      ? items.reduce((sum, i) => sum + i.price, 0) / items.length
      : null;

    res.json({
      ean,
      found: items.length > 0,
      monthlySales: items.length,
      avgPrice: avgPrice ? parseFloat(avgPrice.toFixed(2)) : null,
      titleSample: items[0]?.title || null
    });
  } catch (err) {
    res.status(500).json({ error: 'Scraping-Fehler', detail: err.message });
  }
});

app.listen(PORT, () => console.log(`✅ Server läuft auf Port ${PORT}`));
