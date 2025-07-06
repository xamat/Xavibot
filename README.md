# Xavibot - AI Chatbot with Gemini Backend

This project is a fullstack chatbot that can impersonate Xavi Amatriain using Google's Gemini AI. It features a React frontend with a Node.js backend that supports both OpenAI and Google Gemini backends with automatic switching.

## Features

- **Dual Backend Support**: Switch between OpenAI GPT and Google Gemini
- **Dynamic Backend Switching**: Switch between backends during runtime via the chat interface
- **Xavi Amatriain Impersonation**: AI responds as if it were Xavi Amatriain
- **Knowledge Base Integration**: Uses PDF documents about Xavi's work and background
- **File API Support**: Uploads PDF files to Gemini File API for native document processing
- **Conversation History**: Maintains context across chat sessions
- **Backend Switching**: Easy configuration to switch between AI providers

## Architecture

### Frontend
- Built with [React Chatbot Kit](https://fredrikoseberg.github.io/react-chatbot-kit-docs/docs/getting-started/)
- Modern UI with customizable styling
- Real-time chat interface

### Backend
- **Primary**: Google Gemini with File API support
- **Fallback**: OpenAI GPT (optional)
- **Backend Switcher**: Automatic routing between AI providers
- **File Upload**: Native PDF processing with Gemini File API

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- Google Gemini API key
- (Optional) OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/xamat/Xavibot.git
cd Xavibot
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables in `.env`:
```bash
# API Configuration
REACT_APP_API_URL=http://localhost:8080
BACKEND_TYPE=gemini

# Gemini Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Server Configuration
PORT=8080
CORS_ORIGIN=*

# Optional: OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
```

4. Start the backend:
```bash
cd src/server && node index.js
```

5. Start the frontend (in a new terminal):
```bash
npm run start-frontend
```

6. Open [http://localhost:8081/Xavibot](http://localhost:8081/Xavibot) in your browser

## Available Scripts

### Development
- `npm run start-frontend` - Launches the React frontend on port 8081
- `npm run dev-server` - Launches the server using nodemon for development
- `npm run dev` - Launches both frontend and backend concurrently
- `npm run dev-gemini` - Launches with Gemini backend
- `npm run dev-openai` - Launches with OpenAI backend

### Production
- `npm run build` - Builds the React frontend for production
- `npm run deploy` - Builds and deploys to GitHub Pages

### Testing
- `npm run test-backends` - Tests backend switching functionality

## Configuration

### Backend Switching

The system supports two types of backend switching:

#### 1. Configuration-based Switching
The system automatically switches between backends based on the `BACKEND_TYPE` environment variable:

- `BACKEND_TYPE=gemini` - Uses Google Gemini (default)
- `BACKEND_TYPE=openai` - Uses OpenAI GPT

#### 2. Runtime Backend Switching
You can switch between backends during a conversation by typing specific commands:

- Type `/useGemini` or `/useOpenAI` to change backends
- The system will automatically create a new thread for the new backend
- Your conversation history will be preserved within each backend

**Note**: When switching backends, you'll get a new conversation thread, so previous messages won't be available in the new backend. Gemini is used by default.

### Knowledge Base

The chatbot uses PDF documents stored in `src/server/`:
- `xamatriain.pdf` - Main knowledge base about Xavi
- `xamatriain_guide.pdf` - Additional information
- `blog.pdf` - Blog content

These files are automatically uploaded to Gemini File API on startup.

### AI Instructions

The system uses comprehensive instructions to make the AI impersonate Xavi Amatriain, including:
- Professional background and expertise
- Personal communication style
- Knowledge limitations and honesty
- Use of provided documents

## Deployment

### Local Development
1. Set `REACT_APP_API_URL=http://localhost:8080` in `.env`
2. Start backend: `cd src/server && node index.js`
3. Start frontend: `npm run start-frontend`

### Production Deployment
1. Set `REACT_APP_API_URL` to your production backend URL
2. Build frontend: `npm run build`
3. Deploy backend to your preferred hosting service
4. Deploy frontend: `npm run deploy`

## Environment Variables

### Required
- `GEMINI_API_KEY` - Your Google Gemini API key
- `REACT_APP_API_URL` - Backend server URL

### Optional
- `BACKEND_TYPE` - Set to 'gemini' or 'openai' (default: 'gemini')
- `GEMINI_MODEL` - Gemini model to use (default: 'gemini-2.5-flash')
- `OPENAI_API_KEY` - OpenAI API key (if using OpenAI backend)
- `PORT` - Server port (default: 8080)
- `CORS_ORIGIN` - CORS origin (default: '*')

## Project Structure

```
Xavibot/
├── src/
│   ├── server/
│   │   ├── gemini-backend.js      # Gemini backend implementation
│   │   ├── openai-backend.js      # OpenAI backend implementation
│   │   ├── backend-switcher.js    # Backend switching logic
│   │   ├── config.js              # Configuration and instructions
│   │   ├── app.js                 # Main Express server
│   │   └── index.js               # Server entry point
│   ├── ActionProvider.js          # Frontend action handling
│   ├── MessageParser.js           # Message parsing logic
│   └── ChatbotContainer.js        # Main chatbot component
├── public/                        # Static assets
├── .env                           # Environment variables
└── package.json                   # Dependencies and scripts
```

## Documentation

- [GEMINI_MIGRATION.md](GEMINI_MIGRATION.md) - Migration guide from OpenAI to Gemini
- [BACKEND_SWITCHING.md](BACKEND_SWITCHING.md) - Backend switching implementation details
- [KNOWLEDGE_BASE_STRATEGIES.md](KNOWLEDGE_BASE_STRATEGIES.md) - Knowledge base strategies and approaches

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [React Chatbot Kit](https://fredrikoseberg.github.io/react-chatbot-kit-docs/)
- Powered by [Google Gemini](https://ai.google.dev/) and [OpenAI](https://openai.com/)
- Knowledge base contains information about Xavi Amatriain's work and background
# Updated deployment status
