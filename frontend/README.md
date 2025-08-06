# ChatChit Frontend

A modern, secure messaging application built with React, featuring end-to-end encryption and real-time communication.

## Features

- 🔐 **End-to-End Encryption** - All messages are encrypted using RSA and AES encryption
- 🎨 **Modern UI** - Clean, responsive design with TailwindCSS
- 📱 **Mobile-First** - Optimized for both desktop and mobile devices
- 🚀 **Real-Time** - Instant messaging with WebSocket support (ready for integration)
- 🔑 **Secure Authentication** - JWT-based authentication with encrypted private keys
- 🌟 **User-Friendly** - Intuitive interface with search and chat management

## Tech Stack

- **React 18** - Modern React with hooks and functional components
- **TailwindCSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **React Toastify** - Toast notifications
- **Heroicons** - Beautiful SVG icons
- **Node Forge & CryptoJS** - Cryptographic operations for E2EE

## Getting Started

### Prerequisites

- Node.js 16 or higher
- npm or yarn
- Backend server running (see ../chatchat/README.md)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env to match your backend URL
```

3. Start the development server:
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App (not recommended)

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── chat/           # Chat-related components
│   └── layout/         # Layout components
├── context/            # React Context for state management
├── pages/              # Page components
├── services/           # API services
├── utils/              # Utility functions (crypto, etc.)
└── App.js              # Main application component
```

## Environment Variables

- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:8080)
- `REACT_APP_NAME` - Application name
- `REACT_APP_VERSION` - Application version

## Encryption Flow

### Registration
1. Generate RSA key pair on client
2. Encrypt private key with user password
3. Send public key and encrypted private key to server
4. Store salt and IV for key derivation

### Messaging
1. Retrieve recipient's public key
2. Generate shared secret using own private key + recipient's public key
3. Encrypt message with AES using shared secret
4. Send encrypted message with IV

### Message Decryption
1. Retrieve sender's public key
2. Generate same shared secret using own private key + sender's public key
3. Decrypt message using shared secret and IV

## Security Features

- **Client-Side Encryption** - All encryption happens on the client
- **Zero-Knowledge** - Server never sees unencrypted messages or private keys
- **Key Derivation** - PBKDF2 for password-based key derivation
- **Secure Storage** - Private keys encrypted with user password
- **Forward Secrecy** - Ready for implementing key rotation

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Production Build

To build for production:

```bash
npm run build
```

The build folder will contain the optimized production build.

## Deployment

The app can be deployed to any static hosting service:

- Vercel
- Netlify  
- GitHub Pages
- AWS S3 + CloudFront
- Firebase Hosting

Make sure to configure the `REACT_APP_API_URL` environment variable to point to your production backend. 