
<img src="/public/logo.svg" alt="NNticks Logo" width="200"/>

# NNticks Trading Platform

NNticks is an advanced neural network-based trading platform designed for financial market analysis, prediction, and automated trading. This application leverages cutting-edge machine learning techniques to analyze market patterns and generate predictive insights.

## Features

### Market Data Visualization
- Real-time tick data streaming from multiple brokers
- High-precision charts with configurable timeframes (displaying up to 5 decimal places)
- Custom indicators and trend lines
- Price action analysis tools

### Neural Network Predictions
- AI-driven price movement predictions with multiple confidence modes
- Fast mode: More frequent predictions with lower confidence
- Accurate mode: Less frequent predictions with higher confidence
- Visual representation of neural network activity

### Training Module
- Custom neural network training with adjustable parameters
- Automatic saving of training progress to database
- Live training on real-time market data
- Model performance metrics and optimization

### Debug Tools
- WebSocket connection management with fail-safe limits
- Real-time data monitoring
- Connection diagnostics and error tracking
- System performance metrics

### User Management
- Account customization
- Pro subscription management ($10 USD)
- Personal prediction history
- Settings persistence

### Advanced Features (Pro)
- Leaderboard access
- Enhanced prediction algorithms
- Extended history storage
- Premium market data

### Administrative Tools
- User management panel
- System monitoring dashboard
- Performance analytics
- Access control

## Screenshots

### Dashboard
![Dashboard](/public/screenshots/dashboard.png)

### Neural Network Visualization
![Neural Network](/public/screenshots/neural-network.png)

### Prediction Module
![Predictions](/public/screenshots/predictions.png)

### Training Interface
![Training](/public/screenshots/training.png)

## Technical Details

NNticks is built with:
- React.js + TypeScript for the frontend
- TailwindCSS + shadcn/ui for styling
- Supabase for backend and data persistence
- WebSocket connections for real-time data
- Custom neural network implementation

## Requirements

- Modern web browser (Chrome, Firefox, Edge, Safari)
- Internet connection for real-time data
- User account (free or pro)

## Installation

The platform is available as a web application at [nnticks.ai](https://nnticks.ai). No installation required!

For developers looking to contribute:
1. Clone the repository
2. Run `npm install`
3. Configure Supabase credentials
4. Run `npm run dev`

## License

© 2025 NNticks Enterprise Analytics. All rights reserved.
