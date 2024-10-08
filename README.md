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

### `npm run dev-server`

Launches the server using nodemon so that it will restart whenever you change code while developing.

### `npm run dev`

Uses concurrently to launch both the server and the frontend.

### `npm build`

Builds react front-end

### `npm deploy`

Builds react front-end and deploys to github. Note that if you use this script you should edit the remote github URL to yours and possibly define GH_TOKEN locally if you are using token based authentication.

## Environment variables

### OPENAI_API_KEY

You can copy your OpenAI key here directly for local development

### AZURE_CLIENT_ID, AZURE_TENANT_ID, and AZURE_CLIENT_SECRET

I am using Azure to deploy the server and store the OpenAI key remotely. You might not need this. Make sure to modify the app.js file accordingly.

### REACT_APP_API_URL

Where you want to deploy the server. I recommend http://localhost:3001 for development.
