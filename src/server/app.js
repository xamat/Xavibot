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

// Global variable to store assistantId
let globalAssistantId = null;


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
  if(globalAssistantId!=null){
    console.log("Assistant has already been created in the backend with id:", globalAssistantId);
    return;
  }
  console.log("Creating assistant in the backend. Current id:", globalAssistantId);
  try {
    const file = await createFile();
    const assistant = await openai.beta.assistants.create({
      name: "Xavibot",
      instructions: "You are a bot named Xavi Amatriain. You are an expert on Xavier Amatriain (also known as Xavi Amatriain and respond any questions as if you where him.",
      model: "gpt-4-1106-preview",
      tools: [{"type": "retrieval"}],
      file_ids: [file.id]
    });
    res.json(assistant.id);
    globalAssistantId = assistant.id;
    console.log("Assistant created in the backend with id:", globalAssistantId);
    
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
    console.log("Thread created in the backend");
    console.log(thread.id);
  } catch (error) {
    console.error("Error creating thread:", error.response ? error.response.data : error);
    res.status(500).json({ message: "Failed to create thread" });
  }
});


app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

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

app.post('/chatWithAssistant', async (req, res) => {
  const userMessage = req.body.message;
  const threadId = req.body.threadId;
  const assistantId = globalAssistantId;
  console.log('Chatting with assistant with threadId, assistantId:', threadId, assistantId);
  try {
  
  //First we add the user message to the thread
  console.log('Adding message to thread:', userMessage);
  const threadMessages = await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: userMessage,
    });


  let timeElapsed = 0;
  const timeout = 60000; // Timeout in milliseconds
  const interval = 5000; // Polling interval in milliseconds

  console.log('Creating run with threadId, assistantId:',threadId, assistantId);
  const run = await openai.beta.threads.runs.create(
    threadId,
    { assistant_id: assistantId }
  );
  console.log('Starting poll to wait for run to finish');
  while (timeElapsed < timeout) {
    console.log('timeElapsed:', timeElapsed);
    console.log('Getting run info with threadId, runId',threadId,run.id);
    const runInfo = await openai.beta.threads.runs.retrieve(threadId, run.id);
    console.log('Got run information from openAI with run status:', runInfo.status);
    if (runInfo.status === 'completed') {
      messagesFromThread = await openai.beta.threads.messages.list(threadId);
      // Resolve or handle the completed run
      console.log('Run completed');
      //console.log({ runResult: run, messages: messagesFromThread });
      break;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
    timeElapsed += interval;
  }

  //console.log('Attempting to extract messages from response', messagesFromThread);
  console.log('First message is:', messagesFromThread.data[0].content[0].text.value);
  
  if (messagesFromThread.data.length > 0 && messagesFromThread.data[0].content.length > 0) {
    // Extract the message object. For now I will only process the first message
    console.log('Response has some messages');
    const messageObject = messagesFromThread.data[0];
    //console.log('Message object', messageObject);
    if (messageObject) {
      // Assuming the message object contains a property like 'content' with the response text
      console.log('Extracting first message from message list');
  
      //const aiMessage = messageObject.content ? messageObject.content.trim() : "";
      const aiMessage = messageObject.content[0].text.value;
     
      res.json({ message: aiMessage });
    } else {
      res.status(500).json({ message: "Received an unexpected response format from OpenAI API." });
    }
  } 
  else {
    console.log('Response has no messages');
    res.status(500).json({ message: "No choices found in the response from OpenAI API." });
  }
}

catch (error) {
  console.error("Assistant error:", error.response ? error.response.data : error.message);
  let errorMessage = 'Error running the assistant';
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

