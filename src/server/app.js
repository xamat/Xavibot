require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

app.use(express.json());
// Enable CORS for all routes
app.use(cors());
//TODO: In a production environment, you might want to restrict which origins are allowed to access your API for security reasons.

//const openai = OpenAI.Beta.Assistants.create({
//const openai = axios.create({
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.openai.com/v1',
  defaultHeaders: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

async function createFile() {
  try {
    console.log("Creating file");
    const filePath = path.join(__dirname, 'xamatriain.pdf');
    const file = await openai.files.create({
      file: fs.createReadStream(filePath),
      purpose: "assistants",
    });
    console.log("File created");
    return file;
  } catch (error) {
    console.error("Error creating file:", error);
    console.log("Error creating file");
    // Handle error appropriately
  }
}

app.post('/create-assistant', async (req,res) => {
  console.log("Creating assistant in the backend")
  try {
    const file = await createFile();
    const assistant = await openai.beta.assistants.create({
      name: "Xavibot",
      instructions: "You are great at creating beautiful data visualizations. You analyze data present in .csv files, understand trends, and come up with data visualizations relevant to those trends. You also share a brief text summary of the trends observed.",
      model: "gpt-4-1106-preview",
      tools: [{"type": "retrieval"}],
      file_ids: [file.id]
    });
    console.log("Assistant created in the backend");
    res.json({ message: "Assistant created" });
    
   } 
 catch (error) {
    console.error("Error creating assistant:", error.response ? error.response.data : error);
  }
});

app.post('/create-thread', async (req, res) => {
  console.log("Creating thread")
  try {
    const thread = await openai.beta.threads.create({
      // Additional parameters if needed
    });
    res.json(thread.id);
    console.log(thread.id);
  } catch (error) {
    console.error("Error creating thread:", error.response ? error.response.data : error);
    res.status(500).json({ message: "Failed to create thread" });
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

