# Ekko Console

A full-featured 2-way ChatGPT-style PWA client for the Ekko messaging API. This sample application demonstrates real-time messaging between multiple users with WebSocket events, REST polling, typing indicators, attachments, and push notifications.

## Features

- **Real-time Messaging**: WebSocket-based real-time message delivery and status updates
- **Two-way Chat**: ChatGPT-inspired UI with message bubbles and smooth animations
- **Dual Auth Mode**: Demo mode (env token) or real mode (user-entered API key)
- **Typing Indicators**: Real-time typing status with debounced events
- **File Attachments**: Support for file uploads with image previews
- **Message Inspector**: REST API polling panel for message lookup
- **PWA Support**: Installable app with service worker and push notifications
- **Dark Mode**: Automatic dark/light mode with system preference detection
- **Status Tracking**: Real-time message status (queued → sent → delivered/failed)

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Ekko API backend running (default: `http://localhost:8080`)

### Installation

```bash
# Clone the repository
cd ekko-console

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration (see below)
```

### Running the App

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port Vite assigns).

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Ekko API Configuration
VITE_EKKO_API_URL=http://localhost:8080
VITE_EKKO_WS_URL=http://localhost:8080

# Authentication Mode
# Set to "true" for demo mode (uses VITE_EKKO_AUTH_TOKEN from env)
# Set to "false" for real mode (user enters API key in UI)
VITE_EKKO_DEMO_MODE=true

# Demo Mode Settings (only used when VITE_EKKO_DEMO_MODE=true)
VITE_EKKO_AUTH_TOKEN=your-jwt-token-here
VITE_EKKO_IDENTITY_LABEL=Ryan

# Push Notifications (optional)
VITE_EKKO_PUSH_SUBSCRIBE_URL=
```

### Dual Auth Mode

The app supports two authentication modes:

#### Demo Mode (Default)

Perfect for demos and testing with pre-configured tokens:

1. Set `VITE_EKKO_DEMO_MODE=true`
2. Set `VITE_EKKO_AUTH_TOKEN` to a valid JWT token
3. Optionally set `VITE_EKKO_IDENTITY_LABEL` (e.g., "Ryan", "Mike")
4. The app will automatically use the token from the environment

**Example for Ryan:**
```env
VITE_EKKO_DEMO_MODE=true
VITE_EKKO_AUTH_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_EKKO_IDENTITY_LABEL=Ryan
```

**Example for Mike:**
```env
VITE_EKKO_DEMO_MODE=true
VITE_EKKO_AUTH_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_EKKO_IDENTITY_LABEL=Mike
```

#### Real Mode

For production use or when developers want to use their own API keys:

1. Set `VITE_EKKO_DEMO_MODE=false`
2. Do NOT set `VITE_EKKO_AUTH_TOKEN`
3. Run the app → it will prompt the user to paste their Ekko API key
4. API key is stored in localStorage and used for REST + WebSocket

```env
VITE_EKKO_DEMO_MODE=false
# VITE_EKKO_AUTH_TOKEN is not needed
```

## Demo Scenario: Ryan ↔ Mike

This app is designed to demonstrate real-time messaging between multiple users:

1. **Setup Ryan's instance:**
   ```env
   VITE_EKKO_DEMO_MODE=true
   VITE_EKKO_AUTH_TOKEN=<ryan-token>
   VITE_EKKO_IDENTITY_LABEL=Ryan
   ```

2. **Setup Mike's instance:**
   ```env
   VITE_EKKO_DEMO_MODE=true
   VITE_EKKO_AUTH_TOKEN=<mike-token>
   VITE_EKKO_IDENTITY_LABEL=Mike
   ```

3. **Run both instances:**
   - Open Ryan's instance in one browser/port
   - Open Mike's instance in another browser/port
   - Both connect to the same Ekko API backend

4. **Test real-time messaging:**
   - Ryan sends a message → Mike sees it instantly via WebSocket
   - Mike responds → Ryan sees it in real-time
   - Both see message status updates (queued → sent → delivered)
   - Typing indicators appear when either user is typing
   - Messages sent via Postman also appear in both UIs

## Usage

### Sending Messages

1. Enter recipient email address
2. Optionally add a subject
3. Type your message
4. Optionally attach files (images show previews)
5. Click "Send"

Messages are sent via `POST /v1/message` and appear immediately with "pending" status, then update via WebSocket events.

### Message Inspector

Click the "Show Inspector" button to:
- Look up messages by ID via REST API (`GET /v1/message/{messageId}`)
- View recent messages from the conversation
- See full JSON response from the API

This demonstrates RESTful lookups separate from WebSocket events.

### Typing Indicators

When you type in the message input, the app automatically:
- Emits `typing.start` event after 500ms of typing
- Emits `typing.stop` event when you stop typing
- Shows "Someone is typing..." when receiving `typing.started` events

### Attachments

- Click the 📎 button to select files
- Images show previews before sending
- Other files show filename and size
- Attachments are base64-encoded and sent with the message

### Push Notifications

1. Click "Enable Notifications" (if available)
2. Grant browser permission
3. Push subscriptions are sent to `VITE_EKKO_PUSH_SUBSCRIBE_URL` if configured
4. Notifications appear when messages arrive (handled by service worker)

## Project Structure

```
ekko-console/
├── src/
│   ├── components/          # React components
│   │   ├── ApiKeyLogin.tsx  # API key entry screen
│   │   ├── ChatHeader.tsx   # Header with identity and status
│   │   ├── ConnectionStatus.tsx
│   │   ├── MessageList.tsx  # Chat message bubbles
│   │   ├── TypingIndicator.tsx
│   │   ├── MessageInput.tsx # Message composition
│   │   └── MessageInspector.tsx # REST API inspector
│   ├── hooks/               # Custom React hooks
│   │   ├── useEkkoSocket.ts # WebSocket connection
│   │   └── useConversation.ts # Conversation state
│   ├── utils/               # Utility functions
│   │   ├── auth.ts          # Auth token provider
│   │   ├── apiClient.ts     # Axios REST client
│   │   └── time.ts          # Time formatting
│   ├── types/               # TypeScript types
│   │   └── api.ts           # API and WebSocket types
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── public/
│   ├── manifest.json        # PWA manifest
│   ├── service-worker.js    # Service worker
│   └── icons/               # PWA icons
├── .env.example             # Environment template
└── README.md
```

## API Integration

### REST Endpoints

- `POST /v1/message` - Send a message
- `GET /v1/message/{messageId}` - Get message by ID

### WebSocket Events

**Subscribed:**
- `message.queued` - Message queued for delivery
- `message.sent` - Message sent to provider
- `message.delivered` - Message delivered to recipient
- `message.failed` - Message delivery failed
- `typing.started` - User started typing
- `typing.stopped` - User stopped typing

**Emitted:**
- `typing.start` - Local user started typing
- `typing.stop` - Local user stopped typing

## PWA Installation

1. Build the app: `npm run build`
2. Serve the build: `npm run preview`
3. In supported browsers, you'll see an "Install" option
4. The app can be installed as a standalone application

## Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Screenshots

<!-- Add screenshots here -->
- [Screenshot: Chat Interface]
- [Screenshot: Message Inspector]
- [Screenshot: API Key Login]
- [Screenshot: Dark Mode]

## Troubleshooting

### WebSocket Connection Issues

- Ensure `VITE_EKKO_WS_URL` matches your backend URL
- Check that the backend WebSocket gateway is running
- Verify your auth token is valid
- Check browser console for connection errors

### Authentication Issues

- **Demo Mode**: Ensure `VITE_EKKO_AUTH_TOKEN` is set and valid
- **Real Mode**: Check that API key is saved in localStorage
- Clear localStorage and re-enter API key if needed

### Message Not Appearing

- Check WebSocket connection status (green/red indicator)
- Verify message was sent successfully (check network tab)
- Check browser console for errors
- Ensure recipient email is valid

## License

See LICENSE file for details.

## Contributing

This is a sample application. For issues or questions, please refer to the main Ekko API documentation.
