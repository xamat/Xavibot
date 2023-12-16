# Fullstack chatbot 
This project was bootstrapped with [React Chatbot kit](https://fredrikoseberg.github.io/react-chatbot-kit-docs/docs/getting-started/) on the frontend.

The backend is developedin Node.js and uses [OpenAI's Assistant API](https://platform.openai.com/docs/assistants/overview).

## Available Scripts

In the project directory, you can run:

### `npm start`or  `npm start-server`

Runs the server.
Open [http://localhost:3001](http://localhost:3001) to view the different endpoints.
Note that the actual URL for the server should be defined in the REACT_APP_API_URL of your .env file.

### `npm start-frontend`

Launches the React frontend. Open [http://localhost:3000](http://localhost:3000)

### `npm dev-server`

Launches the server using nodemon so that it will restart whenever you change code while developing.

### `npm dev`

Uses concurrently to launch both the server and the frontend.

## Environment variables


OPENAI_API_KEY
AZURE_CLIENT_ID
AZURE_TENANT_ID
AZURE_CLIENT_SECRET

REACT_APP_API_URL=http://localhost:3001