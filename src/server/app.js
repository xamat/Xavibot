require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(express.json());
// Enable CORS for all routes
app.use(cors());
//TODO: In a production environment, you might want to restrict which origins are allowed to access your API for security reasons.

app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

  // Here, you should process the userMessage and generate a response.
  // For debugging, let's just send back a simple message:
  const responseMessage = "Received your message: " + userMessage;
  res.json({ message: responseMessage });


//  try {
//    const response = await axios.post('https://api.openai.com/v1/engines/davinci-codex/completions', {
//      prompt: userMessage,
//      max_tokens: 150,
//    }, {
//      headers: {
//        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
//      }
//    });

//   const aiMessage = response.data.choices[0].text.trim();
//    res.json({ message: aiMessage });
//  } catch (error) {
//    res.status(500).json({ message: 'Error communicating with OpenAI' });
//  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
