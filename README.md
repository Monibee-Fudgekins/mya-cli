# Mya CLI: Daily AI Stock Market Predictions

Mya is an autonomous trading intelligence platform that makes **daily stock market predictions** using fresh, real-time data. The system automatically discovers high-probability options trades and volatile stocks by analyzing news sentiment, economic data, and technical indicators—no user input required, just intelligent daily recommendations.

![Version](https://img.shields.io/badge/version-0.12.2-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-green.svg)
![AI](https://img.shields.io/badge/AI-Powered-purple.svg)
![Automated](https://img.shields.io/badge/Daily%20Predictions-orange.svg)

## Core Functions

- **Double Capital**: AI automatically scans market news and identifies options with 200%+ profit potential using advanced technical analysis
- **Analyze**: AI predicts which stocks may become volatile soon based on real-time news sentiment analysis and market indicators
- **Earnings**: Identifies stocks with upcoming earnings this week using comprehensive news analysis and historical patterns
- **Announcements**: Tracks important economic data and Federal Reserve announcements affecting markets
- **Benchmark**: Tracks and learns from recommendation performance to improve future predictions

*All functions are 100% automated—no stock symbols or parameters required. Just run the command and get intelligent recommendations.*

## Fresh Data Guarantee

MYA always uses the most current market data available:

- **Real-time News**: Continuous scanning of market-moving announcements
- **Live Prices**: Current market prices and volatility measurements  
- **Daily Updates**: Earnings calendars and economic data refreshed daily
- **Intraday Analysis**: Market conditions reassessed throughout trading hours
- **Historical Context**: Fresh data combined with proven pattern recognition

The system automatically determines when data has changed and updates predictions accordingly—ensuring you always get recommendations based on the latest market conditions.

## Installation

```bash
# Install from npm
npm i mya-cli

```

## Quick Start

```bash
# Authenticate with your email
mya login

# Check your authentication status
mya status

# Find options with 200%+ profit potential (automatic analysis)
mya double

# Find stocks that may become volatile soon (AI prediction)
mya analyze

# Multi-horizon price forecast (1d / 1w / 1mo / 1q / 6mo / 1y)
mya forecast

# Find stocks with upcoming earnings this week (news-based)
mya earnings

# Get important economic announcements for traders
mya announcements

# CMT technical analysis
mya cmt

# View performance tracking and AI learning insights
mya benchmark

# View most recent analysis results
mya results

# Run comprehensive analysis (all commands in sequence)
mya quick    # or: mya all

# Quick aliases for faster typing
mya d        # double
mya a        # analyze
mya e        # earnings
mya n        # announcements
mya b        # benchmark
mya s        # status
mya r        # results
```

## Frequently Asked Questions

### Q: How does Mya work without me providing stock symbols?
A: Mya automatically scans news and market signals, extracts relevant stock symbols using AI, then fetches market data using Finnhub with Yahoo Finance (yfinance) as a fallback. The entire process is automated—you just run the command and get intelligent recommendations.

### Q: What data sources does Mya use?
A: Mya uses:
- **Finnhub**: Market data and news
- **Yahoo Finance (yfinance)**: Historical price data fallback

### Q: How accurate are the recommendations?
A: Mya aims for 85%+ probability recommendations by combining multiple data sources and AI analysis. However, market conditions can change rapidly, and past performance doesn't guarantee future results.

### Q: Do I need API keys?
A: For full fidelity market data you typically configure `FINNHUB_API_KEY`. The yfinance fallback does not require an API key.

### Q: How often is the data updated?
A: News and market data are updated continuously throughout trading hours. The AI models analyze this data in real-time to provide the most current recommendations.

### Q: Can I customize the analysis parameters?
A: Mya is designed to be fully automated for optimal ease of use. The AI automatically selects the best parameters based on current market conditions and historical performance.


## License

MIT License - see LICENSE file for details.

---

## Contributing

We welcome contributions to improve Mya CLI! Here's how you can help:

### Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/mya.git`
3. Install dependencies: `npm install`
4. Build the project: `npm run build`
5. Create a feature branch: `git checkout -b feature/amazing-feature`

### Development Process

1. Make your changes with clear commit messages
2. Add tests for new functionality: `npm test`
3. Ensure all tests pass and linting is clean
4. Submit a pull request with detailed description
