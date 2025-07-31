// server/routes/news.js
const express = require('express');
const axios = require('axios');
const Parser = require('rss-parser');
const router = express.Router();

let cachedNews = null;
let cachedAt = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const rssParser = new Parser();

// GET /api/news - Proxy to Cointelegraph RSS feed with caching
router.get('/', async (req, res) => {
  try {
    if (cachedNews && Date.now() - cachedAt < CACHE_DURATION) {
      return res.json({ result: cachedNews });
    }
    // Fetch and parse Cointelegraph RSS feed
    const feed = await rssParser.parseURL('https://cointelegraph.com/rss');
    console.log('[Cointelegraph RSS] Feed:', JSON.stringify(feed));
    const news = (feed.items || []).slice(0, 5).map(item => ({
      id: item.guid || item.link,
      title: item.title,
      description: item.contentSnippet || item.content || '',
      link: item.link,
      publishedAt: item.pubDate
    }));
    cachedNews = news;
    cachedAt = Date.now();
    res.json({ result: cachedNews });
  } catch (err) {
    console.error('Cointelegraph RSS error:', err.message, err);
    res.status(502).json({ error: 'Failed to fetch news from Cointelegraph', details: err.message });
  }
});

module.exports = router;
