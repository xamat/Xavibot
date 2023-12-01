require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(express.json());
// Enable CORS for all routes
app.use(cors());
//TODO: In a production environment, you might want to restrict which origins are allowed to access your API for security reasons.

async function createFile() {
  try {
    const file = await openai.files.create({
      file: fs.createReadStream("xamatriain.pdf"),
      purpose: "assistants",
    });
    return file;
  } catch (error) {
    console.error("Error creating file:", error);
    // Handle error appropriately
  }
}

const openai = axios.create({
  baseURL: 'https://api.openai.com',
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

app.post('/create-assistant', async (req, res) => {
  try {
    const assistantData = {
      name: "Xavibot",
      description: "You are a chatbot that responds like Xavier Amatriain. You not only know about him and his experience, but you also try to answer as if you were him.",
      model: "gpt-4-1106-preview",
      tools: [{"type": "retrieval "}],
      file_ids: [file.id]
    };

    const response = await openai.post('/v1/assistants', assistantData);
    res.json(response.data);
  } catch (error) {
    console.error("Error creating assistant:", error.response ? error.response.data : error);
    res.status(500).json({ message: "Failed to create assistant" });
  }
});

app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

  // Here, you should process the userMessage and generate a response.
  // For debugging, let's just send back a simple message:
  //const responseMessage = "Received your message: " + userMessage;
  //res.json({ message: responseMessage });


  try {
  const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: "gpt-3.5-turbo", // Or your chosen conversational model
    messages: [{ role: "user", content: userMessage }] // Wrap user message in 'messages' array
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    }
  });

  if (response.data.choices && response.data.choices.length > 0) {
    // Extract the message object
    const messageObject = response.data.choices[0].message;

    if (messageObject) {
      // Assuming the message object contains a property like 'content' with the response text
      const aiMessage = messageObject.content ? messageObject.content.trim() : "";
      res.json({ message: aiMessage });
    } else {
      res.status(500).json({ message: "Received an unexpected response format from OpenAI API." });
    }
  } else {
    res.status(500).json({ message: "No choices found in the response from OpenAI API." });
  }
} catch (error) {
  console.error("OpenAI API error:", error.response ? error.response.data : error.message);
  let errorMessage = 'Error communicating with OpenAI';
  if (error.response && error.response.data) {
    errorMessage += `: ${error.response.data.error}`;
  }
  res.status(500).json({ message: errorMessage });
}
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

