
# CHANGELOG

## Version 1.1.0 (2025-04-04)

### Added
- Modern font update: Changed from VT323 to Roboto Mono for better readability
- Price precision settings to display 5 decimal places in charts for micro-movements
- Improved admin panel with user management functionality
- Export functionality for predictions with NNticks branding
- Auto-save and auto-load functionality for neural network training progress
- Multiple prediction modes with different confidence levels
- Improved debug tools with fail-safe connection limits

### Fixed
- Connection status indicators consolidated to reduce duplicate information
- Fixed connection retry system to limit to 5 attempts
- Fixed toast notifications for connections to prevent notification spam
- Fixed avatar upload functionality
- Fixed settings save button
- Fixed PayPal button redirection
- Fixed history tracking and visualization
- Connected account settings between sidebar and topbar menu
- Fixed white theme selection

### Changed
- Connection status indicators now accurately show online/offline/connected states
- Limited WebSocket connection attempts to 5 to prevent excessive reconnection attempts
- Improved chart axis precision to show micro price movements
- Updated README.md with screenshots and feature descriptions
- Updated status badges for better visibility

## Version 1.0.0 (2025-04-03)

### Added
- Initial release of NNticks trading platform
- Neural network prediction system for financial markets
- Real-time market data visualization with precision charts
- Training module with custom neural network parameters
- Debug tools for WebSocket connections and market data
- User account management with Pro subscription options
- History tracking for predictions and training sessions
- Admin panel for system monitoring and user management
- Dark mode with multiple accent color options
- VT323 pixel font as default interface style
- Export functionality for predictions and reports
- PayPal integration for Pro subscriptions
- Customizable UI settings
- Terminal emulator for advanced commands
- Leaderboard for pro users
- Mobile responsive design

### Fixed
- WebSocket connection stability improvements
- Chart axis precision for small price movements
- Status indicators for connection state
- Settings dialog saving functionality
- Avatar upload and display
- Duplicate navigation elements
- Training session persistence
- Authentication state management

## Version 0.9.0 (2025-03-15)

### Added
- Beta version with core functionality
- Neural network training capabilities
- Basic prediction system
- Initial WebSocket connection for market data
- User authentication system
- Basic charting capabilities
- Settings customization

### Known Issues
- Inconsistent connection status indicators
- Limited chart precision for small price movements
- Training sessions not persisted between page refreshes
- Limited export capabilities
- Incomplete admin functionality
