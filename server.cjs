const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 10000;

// Dummy-Route /scrape – kann später angepasst werden
app.get('/scrape', async (req, res) => {
  const { ean } = req.query;

  if (!ean) {
    return res.status(400).json({ error: 'EAN ist erforderlich' });
  }

  try {
    const result = {
      ean: ean,
      avgPrice: "34,99 €",
      monthlySales: 12
    };
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Scraping fehlgeschlagen' });
  }
});

// Funktionierende eBay Scraper-Route
app.get('/ebay', async (req, res) => {
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
      const dateText = $(el).find('.s-item__title--tagblock').text();
      const price = parseFloat(priceText.replace(/[^0-9,]/g, '').replace(',', '.'));
      const isRecent = /Verkauft.*(?:Juni|Mai)/i.test(dateText);

      if (title && price && isRecent) {
        items.push({ title, price });
      }
    });

    const avgPrice = items.reduce((sum, i) => sum + i.price, 0) / items.length;

    res.json({
      found: items.length > 0,
      salesLast30Days: items.length,
      avgPrice: parseFloat(avgPrice.toFixed(2)),
      titleSample: items[0]?.title || null
    });
  } catch (err) {
    res.status(500).json({ error: 'Scraping-Fehler', detail: err.message });
  }
});

// EIN gemeinsames app.listen
app.listen(PORT, () => console.log(`✅ Server läuft auf Port ${PORT}`));

