// ==UserScript==
// @name         JKAutoSetup eBay FINAL + Beschreibung
// @namespace    jktools.local
// @version      1.5
// @description  Zustand „Neu“, MwSt 19 %, Stückzahl 5, Multi-Rabatt + Beschreibungsvorlage einfügen
// @match        https://www.ebay.de/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

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
                const link = $(el).find('.s-item__link').attr('href');

                if (
                    title.toLowerCase().includes('shop on ebay') ||
                    !priceText ||
                    !title
                ) return;

                const price = parseFloat(priceText.replace('EUR', '').replace(',', '.').replace(/[^0-9.]/g, ''));
                if (!isNaN(price)) items.push({ title, price, link });
            });

            if (items.length === 0) {
                return res.json({ found: false });
            }

            // Detailseite der ersten Auktion aufrufen, um die Kategorie zu holen
            let categoryName = '';
            try {
                const detailRes = await axios.get(items[0].link, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0'
                    }
                });
                const $$ = cheerio.load(detailRes.data);
                categoryName = $$('.breadcrumb span[itemprop="name"]').last().text().trim();
            } catch (e) {
                console.warn('Kategorie konnte nicht geladen werden.');
            }

            const avgPrice = (items.reduce((sum, x) => sum + x.price, 0) / items.length).toFixed(2);

            res.json({
                ean,
                found: true,
                monthlySales: items.length,
                avgPrice,
                titleSample: items[0]?.title || '',
                searchUrl: ebayUrl,
                categoryName
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Fehler beim Scraping' });
        }
    });

    app.listen(PORT, () => {
        console.log(`Server läuft auf Port ${PORT}`);
    });
})();

