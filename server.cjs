const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 10000;

async function scrapeEbayData(ean) {
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

    return {
      ean: ean,
      found: items.length > 0,
      monthlySales: items.length,
      avgPrice: parseFloat(avgPrice.toFixed(2)),
      titleSample: items[0]?.title || null
    };
  } catch (err) {
    throw new Error('Scraping-Fehler: ' + err.message);
  }
}

app.get('/scrape', async (req, res) => {
  const { ean } = req.query;

  if (!ean) {
    return res.status(400).json({ error: 'EAN ist erforderlich' });
  }

  try {
    const result = await scrapeEbayData(ean);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
