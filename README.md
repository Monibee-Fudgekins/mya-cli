# Mya CLI: AI-Powered Stock & Options Analysis

Mya is a fully automated trading intelligence platform that combines real-time news analysis with advanced market data to identify high-probability options trades. Using AlphaVantage for news and economic data, Yahoo Finance for real-time prices, and Polygon.io for historical data and options chains, Mya's AI automatically discovers opportunities without requiring any user input—no stock symbols, no parameters, just intelligent recommendations.

![Version](https://img.shields.io/badge/version-0.3.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-green.svg)
![AI](https://img.shields.io/badge/AI-Powered-purple.svg)
![Automated](https://img.shields.io/badge/100%25-Automated-orange.svg)

## Core Functions

- **Double Capital**: AI automatically scans market news and identifies options with 200%+ profit potential using advanced technical analysis
- **Analyze**: AI predicts which stocks may become volatile soon based on real-time news sentiment analysis and market indicators
- **Earnings**: Identifies stocks with upcoming earnings this week using comprehensive news analysis and historical patterns
- **Announcements**: Tracks important economic data and Federal Reserve announcements affecting markets
- **Benchmark**: Tracks and learns from recommendation performance to improve future predictions

*All functions are 100% automated—no stock symbols or parameters required. Just run the command and get intelligent recommendations.*

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

# Find stocks with upcoming earnings this week (news-based)
mya earnings

# Get important economic announcements for traders
mya announcements

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

## Commands

### Authentication

```bash
# Login with email (uses one-time passcode)
mya login

# Check authentication status
mya status

# Log out and clear session
mya logout
```

### Analysis Commands

```bash
# Find options to double your capital (fully automated)
mya double

# Analyze stocks for future volatility potential (AI-powered)
mya analyze

# Find stocks with upcoming earnings this week (news-driven)
mya earnings

# Get important economic announcements (comprehensive intelligence)
mya announcements
```

## AI-Powered Features

### Advanced Natural Language Processing
- **News Sentiment Analysis**: Processes thousands of news articles to identify market sentiment and potential catalysts
- **Symbol Extraction**: Automatically identifies relevant stock symbols from unstructured news text
- **Context Understanding**: Distinguishes between noise and actionable market-moving information

### Machine Learning Models
- **Volatility Prediction**: Proprietary algorithms that predict which stocks will experience increased volatility
- **Pattern Recognition**: Identifies technical patterns that historically precede significant price movements
- **Risk Assessment**: Automatically calculates probability scores and risk metrics for each recommendation

### Predictive Analytics
- **Earnings Impact Modeling**: Predicts post-earnings price movements based on historical patterns and current sentiment
- **Economic Event Correlation**: Analyzes how economic announcements affect different sectors and stocks
- **Options Strategy Optimization**: Selects optimal strike prices and expiration dates for maximum probability of success

## How It Works

### Fully Automated Intelligence Pipeline

Mya operates on a sophisticated, multi-stage automation pipeline that requires zero user input:

#### 1. **News & Economic Data Collection** (AlphaVantage)
- Continuously monitors real-time market news, earnings reports, and economic indicators
- Gathers Federal Reserve announcements, economic calendar events, and sector-specific news
- Analyzes sentiment and identifies market-moving catalysts

#### 2. **Symbol Discovery & Extraction** (AI-Powered)
- Advanced NLP algorithms automatically extract relevant stock symbols from news articles
- Identifies companies mentioned in earnings reports, economic announcements, and breaking news
- Prioritizes symbols based on news sentiment, volume, and potential market impact

#### 3. **Real-Time Market Data Enrichment** (Multi-Source)
- **Yahoo Finance**: Real-time stock prices and basic market data (primary source)
- **Polygon.io**: Historical data, options chains, and detailed market microstructure
- **AlphaVantage**: Delayed prices as backup, fundamental data, and technical indicators
- Comprehensive data fusion for optimal accuracy and reliability

#### 4. **AI Analysis & Filtering**
- Combines news sentiment with advanced technical analysis (SMA, EMA, MACD, RSI, volume analysis)
- Applies Fidelity's professional technical analysis methodology
- Uses Cloudflare AI Gateway (Llama 3.1 8B) for intelligent pattern recognition
- Filters recommendations based on liquidity, risk parameters, and probability thresholds

#### 5. **Intelligent Recommendations with Performance Tracking**
- Presents filtered, ranked recommendations with specific entry/exit points
- Provides probability scores, timeframes, and risk assessments
- **Benchmark tracking**: Monitors recommendation performance and learns from outcomes
- Updates recommendations based on changing market conditions and historical accuracy

### Data Sources & Technology

- **AlphaVantage**: Real-time news, earnings data, economic indicators, and market sentiment
- **Yahoo Finance**: Real-time stock prices and market data for immediate accuracy
- **Polygon.io**: Historical patterns, options chains, and detailed market microstructure
- **AutoRAG Cache**: Intelligent caching system with vector storage for context-aware analysis
- **Cloudflare AI Gateway**: Advanced machine learning models for pattern recognition and prediction
- **Performance Analytics**: Continuous learning from recommendation outcomes

### Double Capital Function

The `double` command runs a comprehensive automated analysis to find options with 200%+ profit potential:

- **News Catalyst Detection**: Scans AlphaVantage news for stocks with upcoming catalysts (earnings, FDA approvals, partnerships, etc.)
- **Technical Analysis Integration**: Uses Fidelity's methodology with SMA, EMA, MACD, RSI, and volume analysis
- **Options Chain Analysis**: Uses Polygon.io to analyze options chains for optimal strike prices and expiration dates
- **Real-Time Pricing**: Yahoo Finance provides real-time entry prices for immediate execution
- **Probability Modeling**: AI calculates probability of 200%+ returns based on historical patterns and current market conditions
- **Risk Management**: Focuses on liquid options with sufficient volume and tight bid-ask spreads
- **Performance Learning**: Tracks outcomes to improve future recommendations

*Output: Specific options contracts with strike prices, entry prices, target sell prices, and probability scores based on historical performance.*

### Analyze Function

The `analyze` command employs advanced volatility prediction:

- **Sentiment Analysis**: Processes news sentiment using Alpha Vantage data to identify stocks with building momentum
- **Technical Pattern Recognition**: Analyzes Polygon.io price data for pre-volatility patterns and technical setups
- **Earnings Calendar Integration**: Factors in upcoming earnings dates and historical post-earnings volatility
- **Economic Event Correlation**: Considers Federal Reserve announcements and economic data releases
- **Volatility Prediction**: AI models predict which currently stable stocks will experience increased volatility
- **Timeframe Optimization**: Provides specific timeframes for expected volatility increases

*Output: Stocks with high probability of volatility increase, including timeframes and confidence scores.*

### Earnings Function

The `earnings` command provides comprehensive earnings intelligence:

- **Earnings Calendar**: Automatically identifies all earnings announcements for the current week using Alpha Vantage
- **Historical Analysis**: Analyzes past earnings reactions using Polygon.io historical data
- **Sentiment Scoring**: Evaluates pre-earnings news sentiment and analyst expectations
- **Options Activity**: Monitors unusual options activity and implied volatility changes
- **Liquidity Requirements**: Filters for stocks priced $2+ with adequate trading volume
- **Directional Bias**: Identifies earnings plays with clear bullish/bearish catalysts

*Output: Earnings plays with expected direction, probability scores, and optimal options strategies.*

### Announcements Function

The `announcements` command delivers critical market intelligence:

- **Economic Calendar**: Monitors Federal Reserve meetings, economic data releases, and policy announcements
- **Market Impact Analysis**: Evaluates historical market reactions to similar announcements
- **Sector Impact**: Identifies which sectors and stocks are most affected by specific announcements
- **Timing Optimization**: Provides precise timing for market reactions and trading opportunities
- **Importance Ranking**: Categorizes announcements by expected market impact level
- **Cross-Asset Analysis**: Considers impact on bonds, currencies, and commodities

*Output: Economic events with market impact predictions, affected sectors, and trading implications.*

## Automated Scheduling

Mya runs automated analysis tasks on a schedule to keep recommendations fresh and learn from market outcomes:

### Morning Analysis (8 AM & 10 AM EST)
- **News Scanning**: Analyzes overnight news and pre-market developments
- **Announcements**: Gathers economic data and Federal Reserve updates
- **Analyze**: Updates volatility predictions based on new market data
- **Earnings**: Refreshes earnings calendar and identifies upcoming opportunities

### Evening Performance Tracking (8 PM EST)
- **Benchmark**: Tracks recommendation performance and learns from outcomes
- **Model Updates**: Adjusts AI parameters based on trading results
- **Portfolio Analytics**: Analyzes success rates and improves future predictions

This automation ensures that when you run CLI commands, you get the most current analysis based on fresh data and continuously improving AI models.

## Warnings & Disclaimers

- **Trading Risk**: Options trading involves significant risk of loss. Only trade with capital you can afford to lose.
- **No Guarantee**: While Mya aims for high-probability recommendations using advanced AI and comprehensive data analysis, market conditions change rapidly and past performance doesn't guarantee future results.
- **Not Financial Advice**: All recommendations provided by Mya are for informational purposes only and should not be considered financial advice. Please consult with a qualified financial advisor.
- **Data Accuracy**: While we use premium data sources (Alpha Vantage, Polygon.io), market data can have delays or inaccuracies. Always verify information independently.
- **Market Volatility**: AI predictions are based on historical patterns and current data, but unprecedented market events can affect outcomes.

## Technical Requirements

- **Node.js**: Version 16.0.0 or higher
- **Internet Connection**: Required for real-time data from Alpha Vantage and Polygon.io
- **API Access**: Mya handles all API integrations transparently—no API keys required from users
- **Memory**: Minimum 512MB RAM for optimal AI processing performance

## Troubleshooting

If you encounter issues:
- Update to the latest version: `npm update -g mya-cli-ai`
- Check your internet connection (required for real-time data)
- Verify authentication status with `mya status`
- For persistent issues, the system includes automatic error recovery and retry mechanisms

## Frequently Asked Questions

### Q: How does Mya work without me providing stock symbols?
A: Mya automatically scans thousands of news articles daily using Alpha Vantage, extracts relevant stock symbols using AI, then fetches detailed market data from Polygon.io. The entire process is automated—you just run the command and get intelligent recommendations.

### Q: What data sources does Mya use?
A: Mya uses two premium data sources:
- **Alpha Vantage**: Real-time news, earnings announcements, economic indicators, and market sentiment
- **Polygon.io**: Live stock prices, options data, historical patterns, and market microstructure data

### Q: How accurate are the recommendations?
A: Mya aims for 85%+ probability recommendations by combining multiple data sources and AI analysis. However, market conditions can change rapidly, and past performance doesn't guarantee future results.

### Q: Do I need API keys for Alpha Vantage or Polygon.io?
A: No! Mya handles all API integrations transparently. You don't need to sign up for any external services or manage API keys.

### Q: How often is the data updated?
A: News and market data are updated continuously throughout trading hours. The AI models analyze this data in real-time to provide the most current recommendations.

### Q: Can I customize the analysis parameters?
A: Mya is designed to be fully automated for optimal ease of use. The AI automatically selects the best parameters based on current market conditions and historical performance.

## System Architecture

### Backend Infrastructure
- **Cloudflare Workers**: Serverless backend for optimal performance and global distribution
- **KV Storage**: Distributed caching system for session management and data persistence
- **AutoRAG**: Intelligent caching layer for Alpha Vantage and Polygon.io data with automatic TTL management
- **AI Processing**: Advanced machine learning models for pattern recognition and prediction

### Data Pipeline
- **Real-time Ingestion**: Continuous data flow from Alpha Vantage and Polygon.io
- **Intelligent Caching**: Optimized data storage with automatic invalidation and refresh
- **Parallel Processing**: Multiple AI models working simultaneously for comprehensive analysis
- **Quality Assurance**: Automated data validation and error handling throughout the pipeline

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
