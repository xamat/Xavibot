# Fullstack chatbot 
This project was bootstrapped with [React Chatbot kit](https://fredrikoseberg.github.io/react-chatbot-kit-docs/docs/getting-started/) on the frontend.

The backend is developedin Node.js and uses [OpenAI's Assistant API](https://platform.openai.com/docs/assistants/overview).

## Available Scripts

In the project directory, you can run:

"scripts": {
    "start": "node src/server/app.js",
    "start-frontend": "react-scripts start",
    "start-server": "node src/server/app.js",
    "dev-server": "nodemon src/server/app.js",
    "dev": "concurrently \"npm run start\" \"npm run dev-server\""

### `npm start`or  `npm start-server`

Runs the server.
Open [http://localhost:3001](http://localhost:3001) to view the different endpoints.

### `npm start-frontend`

Launches the React frontend. Open [http://localhost:3000](http://localhost:3000)

### `npm dev-server`

Launches the server using nodemon so that it will restart whenever you change code while developing.

### `npm dev`

Uses concurrently to launch both the server and the frontend.