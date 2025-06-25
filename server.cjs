const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;

app.get('/scrape', async (req, res) => {
  const { ean } = req.query;
  if (!ean) return res.status(400).json({ error: 'EAN fehlt' });

  const ebayUrl = `https://www.ebay.de/sch/i.html?_nkw=${ean}&_sacat=0&LH_ItemCondition=1000&LH_Sold=1&LH_Complete=1`;

  try {
    const { data } = await axios.get(ebayUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    const $ = cheerio.load(data);
    const items = [];

    $('.s-item').each((i, el) => {
      const title = $(el).find('.s-item__title').text().trim();
      const priceText = $(el).find('.s-item__price').text().trim();

      if (
        title.toLowerCase().includes('shop on ebay') || 
        !priceText || 
        !title
      ) return;

      const price = parseFloat(
        priceText.replace(/[^0-9,]/g, '').replace(',', '.')
      );
      if (isNaN(price)) return;

      items.push({ title, price });
    });

    if (items.length === 0) {
      return res.json({
        ean,
        found: false,
        monthlySales: 0,
        avgPrice: null,
        titleSample: null,
        searchUrl: ebayUrl
      });
    }

    const avgPrice = items.reduce((sum, i) => sum + i.price, 0) / items.length;

    res.json({
      ean,
      found: true,
      monthlySales: items.length,
      avgPrice: parseFloat(avgPrice.toFixed(2)),
      titleSample: items[0].title,
      searchUrl: ebayUrl
    });
  } catch (err) {
    res.status(500).json({ error: 'Scraping-Fehler', detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
