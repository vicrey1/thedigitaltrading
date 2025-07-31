const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

// POST /api/ai-chat
// Body: { message: "user's question" }
router.post('/', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    // Hugging Face Inference API (text-generation)
    const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
    if (!HF_API_KEY) {
      return res.status(500).json({ error: 'Hugging Face API key not set.' });
    }
    const hfResponse = await axios.post(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
      { inputs: message },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );
    console.log('Hugging Face API response:', JSON.stringify(hfResponse.data));
    let aiReply = 'Sorry, no response.';
    if (Array.isArray(hfResponse.data) && hfResponse.data[0]?.generated_text) {
      aiReply = hfResponse.data[0].generated_text;
    } else if (hfResponse.data.generated_text) {
      aiReply = hfResponse.data.generated_text;
    } else if (hfResponse.data.error) {
      aiReply = `Error: ${hfResponse.data.error}`;
    }
    res.json({ reply: aiReply });
  } catch (err) {
    console.error('AI chat error:', err.message, err.response?.data);
    res.status(500).json({ error: 'AI chat service unavailable.' });
  }
});

module.exports = router;
