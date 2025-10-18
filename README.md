# MYA - Autonomous AI Trading Intelligence Platform

[![Code Quality](https://github.com/Monibee-Fudgekins/mya/actions/workflows/code-quality.yml/badge.svg)](https://github.com/Monibee-Fudgekins/mya/actions/workflows/code-quality.yml)
[![Deploy Backend](https://github.com/Monibee-Fudgekins/mya/actions/workflows/deploy-backend.yml/badge.svg)](https://github.com/Monibee-Fudgekins/mya/actions/workflows/deploy-backend.yml)

MYA is an **autonomous AI-powered trading intelligence platform** that continuously learns, adapts, and optimizes its trading recommendations through advanced machine learning techniques. The system features **automated daily data updates**, multi-layer risk management, real-time market analysis, and self-improving algorithms designed to achieve consistent high-probability trading opportunities.

## Automated Daily Updates - CRUCIAL FEATURE

MYA runs **fully automated cron jobs** that ensure fresh data is available daily:

### Automated Schedule (EST Time)
- **8:00 AM EST (13:00 UTC)** → Market news scan & announcements
  - Fetches latest market news from AlphaVantage
  - Extracts significant stocks from news
  - Stores data in Vectorize for other functions
  - **12-hour data freshness guarantee**
  
- **8:30 AM EST (13:30 UTC)** → Double opportunities analysis
  - Identifies 200%+ return potential trades
  - Analyzes options and stock positions
  
- **10:00 AM EST (15:00 UTC)** → CMT technical analysis
  - Full market technical analysis
  - BUY/SELL/HOLD recommendations
  
- **8:00 PM EST (01:00 UTC)** → Benchmark & optimization
  - Performance tracking
  - Risk mode evaluation
  - Metrics push to Grafana Cloud
  - Advanced calibration updates
  - Adaptive weight tuning
  - Shadow strategy testing

### Data Freshness Policy
- **Announcements data**: Expires after 12 hours (strict enforcement)
- **No stale data**: System rejects data older than 12 hours automatically
- **User guidance**: If data expired, user is prompted to run `mya announcements`
- **Fresh on demand**: User can manually trigger updates anytime with `mya announcements`

## 🧠 Autonomous Intelligence Features

### Self-Learning & Adaptation
- **Recommendation Lifecycle Tracking**: Monitors every trade from creation to close with performance metrics
- **Advanced Calibration**: Isotonic regression with decay weighting for probability calibration drift detection
- **Factor Attribution Analysis**: Real-time analysis of which scoring factors drive successful outcomes
- **Adaptive Weight Tuning**: Automatic scoring weight adjustments based on historical factor performance
- **Shadow A/B Testing**: Continuous testing of alternative strategies with statistical promotion criteria

### Multi-Layer Risk Management
- **Dynamic Risk Modes**: NORMAL/TIGHT/RESTRICTIVE modes based on performance expectancy and calibration drift
- **Volatility Regime Detection**: Automatic market condition classification with adaptive parameter scaling
- **Exposure & Correlation Control**: Beta-weighted position sizing with correlation-based diversification limits
- **Trailing Stop Optimization**: ATR-based adaptive trailing stops with automated backtest optimization
- **Auto-Halt Protection**: Persistent risk mode triggers with manual override capabilities

### Continuous Market Intelligence
- **Automated Daily Updates**: Scheduled cron jobs ensure fresh data at 8AM, 8:30AM, 10AM, and 8PM EST
- **12-Hour Freshness Guarantee**: Stock symbols expire after 12 hours - no stale data
- **Vectorize Storage**: Fast, reliable data storage with automatic expiration
- **Real-time News Processing**: AI-powered extraction of trading opportunities from market news
- **Earnings Intelligence**: Automated earnings calendar monitoring with strategy optimization
- **Performance Benchmarking**: Daily accuracy tracking with 85%+ success rate targeting

## Quick Start

### For Traders
```bash
# Install the CLI
npm install -g mya-cli

# Authenticate once
mya login

# RECOMMENDED: Start with fresh data (or wait for 8 AM EST auto-update)
mya announcements  # Fetch latest market news & stocks (stores for 12 hours)

# Get autonomous recommendations (uses data from announcements)
mya analyze        # AI technical analysis with entry prices
mya double         # 200%+ return opportunities  
mya earnings       # This week's earnings plays
mya benchmark      # Performance tracking

# Monitor system intelligence
mya status         # Authentication & system status
mya results        # Recent analysis results
```

### Daily Workflow
1. **Morning (8 AM EST)** - Automated news scan runs in background
2. **Anytime After** - Run `mya analyze`, `mya double`, `mya earnings` to get fresh analysis
3. **If data expired** - Run `mya announcements` to refresh (manual override)
4. **Evening (8 PM EST)** - Automated benchmark tracking and system optimization

### For Developers
```bash
git clone <repo-url>
cd mya
npm install
npm run build
npm test
```

## 🏗️ Architecture

### Core Infrastructure
- **Cloudflare Workers**: Globally distributed serverless API
- **Cloudflare KV**: Low-latency data persistence and session management
- **TypeScript**: Full type safety across the entire platform
- **Scheduled Cron Jobs**: Automated market analysis and system optimization

### Intelligence Services
- **Recommendation Engine**: Multi-factor scoring with adaptive weight optimization
- **Risk Management**: Dynamic exposure control with volatility regime detection  
- **Calibration System**: Advanced probability calibration with drift monitoring
- **Backtest Framework**: Automated parameter optimization with statistical validation
- **Shadow Testing**: A/B testing framework for strategy validation

### Data Sources
- **Yahoo Finance**: Real-time market data and options chains (unlimited)
- **Alpha Vantage**: Market news, earnings calendar, economic indicators
- **Polygon.io**: Historical data and technical indicators
- **Cloudflare AI**: Advanced language processing for market analysis

## 🧬 Intelligent Systems

### Recommendation Lifecycle
1. **Creation**: Multi-factor scoring with calibrated probabilities
2. **Monitoring**: Real-time price tracking with adaptive trailing stops
3. **Execution**: Automatic rule-based closing (stop-loss, targets, time decay)
4. **Analysis**: Performance attribution and factor efficacy measurement
5. **Learning**: Weight adaptation and strategy improvement

### Risk Intelligence
- **Exposure Limits**: Dynamic gross/net beta limits based on market regime and risk mode
- **Correlation Gating**: Average pairwise correlation limits to prevent concentration
- **Position Sizing**: Risk mode scaling (TIGHT: 75%, RESTRICTIVE: 50% of normal)
- **Auto-Halt Logic**: 3 consecutive RESTRICTIVE days triggers trading suspension

### Adaptive Learning
- **Factor Statistics**: Daily analysis of which factors correlate with winning trades
- **Weight Proposals**: Automatic scoring weight adjustments based on 3-day factor stability
- **Backtest Validation**: Historical performance testing before implementing changes
- **Statistical Promotion**: Shadow strategies promoted only after meeting significance criteria

## Performance Intelligence

### Real-time Metrics & Monitoring
- **Expectancy Tracking**: Daily risk-adjusted expected returns
- **Calibration Monitoring**: Probability accuracy with Brier score analysis
- **Factor Attribution**: Contribution analysis for each scoring component
- **Risk Mode History**: Dynamic risk posture adjustments over time
- **Grafana Cloud Integration**: Comprehensive metrics dashboard with Prometheus-compatible endpoints
- **Automated Alerting**: Real-time notifications for performance thresholds and system health

### Metrics Dashboard
- **Trading Performance**: Win rate, expectancy, returns, drawdown tracking
- **Risk Management**: Position exposure, correlation analysis, volatility regime monitoring
- **System Health**: Active recommendations, trading halt status, cron job execution
- **Calibration Quality**: Probability accuracy across confidence buckets with drift detection
- **Factor Effectiveness**: Correlation heatmaps and attribution analysis for all scoring factors

### Automated Optimization Loops

**Morning Data Refresh** (8:00 AM EST / 13:00 UTC):
1. Market news scan from AlphaVantage
2. Stock symbol extraction (AI-powered)
3. Vectorize storage (12-hour expiration)
4. Announcements data preparation

**Morning Analysis** (8:30 AM EST / 13:30 UTC):
1. Double opportunities scan
2. 200%+ return potential identification

**Mid-Morning Analysis** (10:00 AM EST / 15:00 UTC):
1. Full CMT technical analysis
2. BUY/SELL/HOLD recommendations

**Nightly Optimization** (8:00 PM EST / 01:00 UTC):
1. Benchmark performance tracking
2. Recommendation auto-close evaluation  
3. Daily metrics aggregation
4. **Grafana Cloud metrics push**
5. Volatility regime refresh
6. Advanced calibration recompute
7. Risk mode evaluation (with auto-halt if needed)
8. Adaptive weight proposals
9. Shadow strategy testing
10. Guardrail evaluation

## 🛡️ Enterprise Security & Reliability

### Authentication & Authorization
- **Stytch Integration**: Enterprise-grade email authentication
- **JWT Session Management**: Secure token-based API access
- **Role-based Access**: Admin endpoints with proper authorization
- **Session Persistence**: Global session storage with automatic expiration

### Operational Excellence
- **Health Monitoring**: Comprehensive system health checks and cron job status
- **Error Handling**: Graceful degradation with fallback mechanisms
- **Audit Logging**: Complete audit trail for all configuration changes
- **Disaster Recovery**: KV backup strategies and data versioning

## Development & Deployment

### Local Development
```bash
# Backend development
npx wrangler dev

# CLI development  
npm run build:dev
npm link

# Testing
npm test
npm run lint
```

### Production Deployment
```bash
# Automated via GitHub Actions
git push origin main  # Auto-deploys backend

# Manual CLI release
npm run build:prod
npm version patch
npm publish
```

### Environment Configuration
- **Development**: `NODE_ENV=development` uses dev Worker endpoint
- **Production**: Default configuration uses production Worker
- **Custom**: Override with `MYA_API_URL` environment variable

## 📈 Advanced Analytics

### Factor Intelligence
- **Real-time Attribution**: Understanding which factors drive successful trades
- **Stability Detection**: 3-day consistency requirements for weight adjustments  
- **Correlation Analysis**: Factor correlation with positive trade outcomes
- **Drift Monitoring**: Detection of factor effectiveness degradation

### Performance Analytics
- **Equity Curve Tracking**: Real-time portfolio performance visualization
- **Drawdown Analysis**: Maximum adverse excursion monitoring
- **Giveback Metrics**: Tracking of profit retracement patterns
- **Benchmark Comparison**: Performance vs market indices

## Production Readiness Status

### Implemented (Complete)
- Core trading intelligence and recommendation engine
- Multi-layer risk management with auto-halt protection
- Advanced calibration and factor attribution analysis
- Automated parameter optimization with statistical validation
- Shadow A/B testing framework with promotion criteria
- Comprehensive audit logging and performance tracking

### Production Hardening Required ⚠️
- Authentication/authorization for admin endpoints
- Input validation with schema enforcement (Zod/TypeBox)
- Structured logging with trace IDs and error alerting
- Unit/integration test coverage for core services
- Statistical significance testing for shadow promotions
- Configuration versioning and rollback capabilities

## Documentation

Detailed documentation is embedded as code comments throughout the codebase:
- `src/services/`: Core intelligence services with implementation details
- `src/utils/`: Utility functions and helper classes
- `etl/`: ETL pipeline documentation and setup instructions

## 🤝 Contributing

1. Fork the repository and create a feature branch
2. Follow TypeScript best practices and existing patterns
3. Add comprehensive tests for new functionality
4. Ensure ESLint compliance and type safety
5. Submit pull request with detailed description

## 📄 License

Licensed under the terms specified in the [LICENSE](./LICENSE) file.

---

**MYA** - Where AI Meets Alpha Generation  
*Autonomous. Adaptive. Intelligent.*

## 🏗️ Architecture Overview

MYA uses a modern serverless architecture optimized for **automated daily updates with fresh data**:

### Core Infrastructure
- **Cloudflare Workers**: Serverless API endpoints for global availability
- **Cloudflare KV**: Session storage and distributed data caching  
- **Cloudflare AI**: Advanced machine learning for market analysis
- **Cloudflare Vectorize**: Time-based data storage with automatic expiration (12-hour freshness)
- **Stytch**: Secure user authentication
- **Automated Cron Jobs**: 4 daily scheduled tasks ensuring fresh market data

### Data Freshness Architecture
```
┌─────────────────────────────────────────────────────────────┐
│  8:00 AM EST → ANNOUNCEMENTS CRON (Automated)              │
│  ├─ Fetch market news from AlphaVantage                    │
│  ├─ Extract stock symbols (AI-powered)                     │
│  ├─ Store in Vectorize with timestamp                      │
│  └─ Data expires after 12 hours                            │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  USER COMMANDS → Use Fresh Data from Vectorize              │
│  ├─ mya analyze   → Queries Vectorize for symbols          │
│  ├─ mya double    → Uses fresh symbols                     │
│  ├─ mya earnings  → Checks current week earnings           │
│  └─ If expired    → Prompts user to run 'mya announcements'│
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  8:00 PM EST → BENCHMARK CRON (Automated)                  │
│  ├─ Track performance of today's recommendations           │
│  ├─ Update calibration models                              │
│  ├─ Push metrics to Grafana Cloud                          │
│  └─ Optimize system parameters                             │
└─────────────────────────────────────────────────────────────┘
```

### Vectorize Data Flow
1. **Storage**: Announcements service stores symbols with enriched content
2. **Query**: Analysis functions query Vectorize with semantic search
3. **Filtering**: Strict 12-hour timestamp filtering (no stale data)
4. **Expiration**: Data automatically expires after 12 hours
5. **Refresh**: User can manually refresh anytime with `mya announcements`

### Data Pipeline
- **Real-time Ingestion**: Fresh market data from multiple sources daily
- **AlphaVantage**: News sentiment and economic data
- **Polygon.io**: Historical data and comprehensive options chains
- **Yahoo Finance**: Real-time price feeds and market indicators

### Automated Analysis
- **Scheduled Jobs**: Daily market scans at 8AM, 8:30AM, 10AM, and 8PM EST
- **News Processing**: AI-powered extraction of trading opportunities
- **Technical Analysis**: Advanced pattern recognition and volatility detection
- **Performance Tracking**: Continuous learning and accuracy improvement

### CLI Interface
Primary user interaction for accessing daily predictions:
```bash
mya analyze    # Daily market volatility predictions
mya double     # 200%+ profit opportunity identification  
mya earnings   # Weekly earnings analysis
mya announcements  # Economic data and Fed announcements
mya benchmark  # Performance tracking and learning insights
```

GitHub OAuth MCP Server:
- SSE URL: `https://mya-mcp-github-oauth.monibee-fudgekin.workers.dev/sse`
- First-time setup:
  - Create a GitHub OAuth App with:
    - Homepage URL: `https://mya-mcp-github-oauth.monibee-fudgekin.workers.dev`
    - Callback URL: `https://mya-mcp-github-oauth.monibee-fudgekin.workers.dev/callback`
  - In the MCP Worker, set secrets:
    - `wrangler secret put GITHUB_CLIENT_ID`
    - `wrangler secret put GITHUB_CLIENT_SECRET`
    - `wrangler secret put COOKIE_ENCRYPTION_KEY` (random 32 bytes)
  - Ensure a KV namespace is bound as `OAUTH_KV` in `wrangler.jsonc`.
- Connect via MCP client and complete GitHub OAuth.
- Same toolset as authless server (above).

Runtime bindings (optional overrides):
- `VECTORIZE_ID` (defaults to `mya`)
- `MYA_BASE_URL` (defaults to production Worker URL)

### Key Components

1. **CLI Client** (`src/cli-http.ts`)
   - Fully automated commands (no arguments required)
   - HTTP API communication
   - Real-time progress updates

2. **Backend API** (`src/worker.ts`)
   - Cloudflare Workers-based HTTP endpoints
   - Session management via KV storage
   - Queue coordination with RabbitMQ

3. **Hybrid Context Manager** (`src/utils/hybrid-user-context.ts`)
   - Unified interface for HTTP queue and session management
   - Fallback mechanisms for reliability
   - Multi-user support

4. **Analysis Services** (`src/services/`)
   - Modular analysis engines
   - AI-powered recommendations
   - 85%+ success probability threshold

## Analysis Functions

MYA provides five core CMT-powered analysis functions with clear separation of responsibilities:

**Data Flow**: `announcements` → `analyze` → `double` + `earnings` + `benchmark`

### Chartered Market Technician (CMT) Integration

All analysis functions now operate using **CMT Level III methodology**, providing professional-grade technical analysis with specific entry prices, timeframes, and risk management strategies.

### Function Responsibilities

1. **`announcements`**: CMT News Review & Data Collection - **ENHANCED STOCK DISCOVERY**
   - **Multi-Source News Fetching**: General market + ETF + sector-specific news
   - **Advanced Stock Extraction**: AlphaVantage ticker_sentiment + regex + AI-powered extraction
   - **Auto RAG Integration**: Discovered stocks automatically stored for other functions
   - **Comprehensive Filtering**: Expanded common word filtering for better accuracy 
2. **`analyze`**: CMT Technical Analysis with BUY/SELL/HOLD + Entry Prices
3. **`earnings`**: CMT Earnings Analysis for This Week Only + Specific Strategies
4. **`double`**: CMT 200%+ Return Analysis with Precise Entry/Exit
5. **`benchmark`**: CMT Performance Evaluation with Actual Accuracy %

### 1. Double Capital Opportunities (`mya double`)
- **CMT Level III Analysis**: Professional technical analysis for 200%+ opportunities
- **Specific Entry Prices**: Exact buy prices with technical justification
- **Timeframe Requirements**: Clear holding periods (days/weeks/months)
- **Options + Stocks**: Both options strategies and stock positions
- **Risk Management**: Stop-loss levels and profit targets
- **Technical Patterns**: Focus on breakouts, cup-and-handle, ascending triangles
- **High Return Focus**: Includes opportunities with 300%, 400%, 500%+ potential

### 2. Stock Analysis (`mya analyze`)
- **CMT Technical Recommendations**: Professional BUY/SELL/HOLD decisions
- **Entry Price Strategy**: Specific buy/sell prices with technical rationale
- **Complete Chart Analysis**: Trend analysis, support/resistance, volume patterns
- **Risk/Reward Ratios**: Calculated based on chart patterns
- **Timeframe Specific**: Swing trades, position trades with clear duration
- **Multi-source Integration**: Uses data from announcements function
- **Professional Format**: [SYMBOL] - [BUY/SELL/HOLD] at $[PRICE] | Stop: $[PRICE] | Target: $[PRICE]

### 3. Earnings Opportunities (`mya earnings`)
- **This Week Only**: Analyzes ONLY stocks with confirmed earnings this week
- **CMT Earnings Strategy**: Pre-earnings technical setups and post-earnings targets
- **Entry Prices Required**: Specific buy prices before earnings announcements
- **Options vs Stock**: Recommends optimal strategy for each earnings play
- **Time Decay Awareness**: Options strategies account for theta decay
- **Earnings Calendar Integration**: Uses AlphaVantage earnings calendar for accuracy
- **NO Mag 7 Fallback**: Only returns stocks with actual earnings this week

### 4. Market Announcements (`mya announcements`)
- **CMT News Review**: Professional analysis of market-moving news
- **Enhanced Stock Discovery**: Uses AlphaVantage ticker sentiment data + AI extraction
- **Multi-Source News**: General market news + sector-specific news + ETF-related news
- **Technical Context**: How news affects chart patterns and support/resistance
- **Volume & Gap Analysis**: Notes significant price gaps and volume spikes
- **Real Stock Extraction**: Enhanced pattern matching + AI extraction for broader stock discovery
- **NO Mag 7 Fallback**: Discovers actual stocks from news, not just major stocks
- **Auto RAG Storage**: Stores findings for context in other analysis functions

### 5. Benchmark Performance (`mya benchmark`)
- **Actual Accuracy Calculation**: Uses real closing prices for exact performance metrics
- **CMT Performance Review**: Analyzes which chart patterns performed best/worst
- **Individual Trade Results**: Shows profit/loss for each recommendation
- **Improvement Suggestions**: Specific CMT methodology refinements
- **Market Comparison**: MYA performance vs overall market performance
- **85% Target Tracking**: Color-coded results showing progress toward accuracy goal
- **Pattern Analysis**: Identifies most/least successful technical patterns

## 🤖 Automated Market Intelligence

MYA features a sophisticated automated system that runs in the background to continuously gather and analyze market data:

### Scheduled News Scanning
- **Enhanced Timing**: Automatically runs at 8 AM, 10 AM, and 8 PM EST daily for comprehensive market coverage
- **Comprehensive Data Sources**: AlphaVantage News + Polygon real-time data + earnings calendar
- **Mag 7 Current Prices**: Always includes current/closing prices for Magnificent 7 stocks
- **Volatility & Volume Analysis**: Identifies high-volume (>1M daily) volatile stocks with double potential
- **Earnings Detection**: Finds stocks with earnings in current week using AlphaVantage earnings calendar
- **Political & Economic Events**: Categorizes news by impact type (political, economic, general)
- **AI Processing**: Cloudflare AI Gateway extracts significant stocks from news content
- **Smart Filtering**: Volume & price filters (>$2, >100K daily volume) for tradeable opportunities
- **Auto RAG Storage**: All findings stored for 3 weeks to enhance analysis context

### Intelligent Fallback System
- **Primary**: Uses stocks identified from significant market news via enhanced extraction
- **Secondary**: Queries Auto RAG for previously discovered stocks from news scans
- **Tertiary**: Prompts user to run 'mya announcements' first to discover stocks from current news
- **Contextual**: Auto RAG provides historical context for better decision making

### Real-time Data Integration
- **Yahoo Finance**: Primary source for real-time stock prices and comprehensive options data (free, reliable, no rate limits)
  - Real-time stock quotes during market hours
  - Complete options chains with strikes, expirations, bid/ask, volume, open interest
  - Implied volatility and Greeks data for options analysis
  - No API key required, unlimited requests
- **AlphaVantage**: Specialized for market intelligence and fundamental data
  - Market news with sentiment analysis (NEWS_SENTIMENT)
  - Earnings calendar and estimates
  - Economic indicators (GDP, inflation, unemployment)
  - Insider trading transactions
  - Corporate announcements and events
- **Polygon.io**: Historical and technical analysis data (free tier fallback)
  - Previous close pricing when other sources fail
  - Historical aggregates for technical indicators
  - Basic options contracts information
- **Cloudflare AI**: Advanced language processing for news analysis and stock recommendations
- **Smart Market Detection**: Automatically switches between real-time and historical data based on market hours
- **Technical Analysis**: Fidelity-based methodology with permanent storage in Auto RAG for consistent application

## Technology Stack

### Backend
- **Cloudflare Workers**: Serverless API endpoints
- **HTTP API**: RESTful processing endpoints
- **Cloudflare KV**: Session and cache storage
- **Stytch**: Authentication provider
- **TypeScript**: Full type safety

### CLI
- **Node.js**: Runtime environment
- **Commander.js**: CLI framework
- **Chalk**: Terminal styling
- **Ora**: Progress indicators

### Data Sources
- **Polygon.io**: Real-time market data and comprehensive technical indicators
- **Alpha Vantage**: Financial fundamentals and market news

## API Efficiency & Rate Limiting

The application includes intelligent rate limiting and caching to stay within API provider limits while maintaining optimal performance:

### Rate Limiting
- **AlphaVantage**: 20 calls per day with smart daily reset tracking
- **Polygon**: 5 calls per minute with intelligent wait times  
- **Yahoo Finance**: 100 calls per minute with automatic rate management
- **Smart Waiting**: Automatically waits when rate limits are reached
- **Status Monitoring**: Real-time tracking of remaining calls and reset times

### Automatic Cache Warming
- **Pre-analysis Optimization**: All analysis commands (`double`, `analyze`, `earnings`, `announcements`) automatically pre-warm cache
- **Major Symbols**: Pre-loads AAPL, MSFT, GOOGL, AMZN, TSLA, META, NVDA for instant access
- **User Feedback**: Shows "🔥 Optimizing cache for analysis..." during pre-warming
- **API Efficiency**: Reduces redundant API calls by pre-caching frequently needed data

### Multi-layer Caching
- **Local Memory Cache**: Instant access to recently fetched data
- **Vectorize Persistence**: Long-term storage with intelligent TTL management
- **TTL-based Expiration**: 
  - Real-time quotes: 30 seconds
  - Market news: 15 minutes  
  - Company data: 24 hours
- **Provider-specific**: Separate cache zones for each API provider

### Cache Management
```bash
mya cache          # Show comprehensive cache status and rate limiting info
mya cache --warm   # Manually pre-warm cache with major symbols
mya cache --clear  # Clear cache if needed
```

**Cache Features:**
- Hit/miss ratio tracking
- Memory usage monitoring  
- Optimization suggestions
- Provider-specific statistics
- Automatic cleanup of expired entries

This system ensures reliable data access while respecting API limits and providing optimal user experience.

## Project Structure

```
mya/
├── src/
│   ├── api/                    # Generated API client and types
│   ├── auth/                   # Authentication management
│   ├── services/               # Core analysis services
│   │   ├── double.ts          # Double capital opportunities
│   │   ├── analyze.ts         # Stock analysis engine  
│   │   ├── earnings.ts        # Earnings analysis
│   │   ├── announcements.ts   # Market announcements
│   │   └── service-manager.ts # Service coordination
│   ├── storage/                # Session and cache storage
│   ├── utils/                  # Utility functions
│   │   ├── hybrid-user-context.ts  # Hybrid context manager
│   │   ├── simple-queue.ts         # HTTP-based queue
│   │   └── cloudflare-session-store.ts # KV session store
│   ├── cli-http.ts            # Main CLI implementation
│   ├── worker.ts              # Cloudflare Workers entry
│   └── index.ts               # Backend API entry
├── .github/workflows/         # CI/CD pipelines
│   ├── deploy-backend.yml     # Auto-deploy backend
│   ├── deploy-cli.yml         # Manual CLI deployment
│   └── code-quality.yml       # Linting and testing
├── wrangler.toml             # Cloudflare Workers config
└── package.json              # Dependencies and scripts
```

## Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Cloudflare account (for deployment)

### Local Development
```bash
# Clone and install
git clone <repo-url>
cd mya
npm install

# Build the project
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Start local development
npm link  # Makes `mya` command available globally
```

### Backend Development
```bash
# Start Cloudflare Workers locally
npx wrangler dev

# Deploy to development environment
npx wrangler deploy --env dev
```

### Environment Variables
Required environment variables (set in Cloudflare dashboard or wrangler.toml):
```bash
STYTCH_PROJECT_ID=your-project-id
STYTCH_SECRET=your-secret
JWT_SECRET=your-jwt-secret
POLYGON_API_KEY=your-polygon-key
ALPHAVANTAGE_API_KEY=your-alpha-vantage-key
```

## Environment Configuration & Deployment

### CLI Environment Configuration

The MYA CLI automatically detects and connects to the appropriate backend environment:

#### Environment Detection
- **Production**: Default environment, uses `https://mya-production.monibee-fudgekin.workers.dev`
- **Development**: Activated with `NODE_ENV=development`, uses `https://mya-dev.monibee-fudgekin.workers.dev`
- **Custom**: Override with `MYA_API_URL` environment variable

#### Build Scripts
```bash
# Development builds (default)
npm run build:dev        # Build CLI for dev environment
npm run build:full:dev    # Full build with API generation for dev

# Production builds  
npm run build:prod       # Build CLI for production environment
npm run build:full:prod  # Full build with API generation for production

# Worker deployment
npm run deploy:dev       # Deploy worker to dev environment
npm run deploy:prod      # Deploy worker to production environment
```

#### Deployment Script
Use the automated deployment script for complete environment setup:

```bash
# Deploy to development
./deploy.sh dev

# Deploy to production  
./deploy.sh prod
```

#### CLI Usage by Environment
```bash
# Production environment (default)
mya login
mya analyze
mya double

# Development environment
NODE_ENV=development mya login
NODE_ENV=development mya analyze
NODE_ENV=development mya double

# Custom endpoint
MYA_API_URL=https://custom-endpoint.com mya login
```

### Worker Configuration

The project uses a Cloudflare Worker for production:

- **Production**: `https://mya-production.monibee-fudgekin.workers.dev`

Configuration includes:
- Stytch authentication configuration
- API keys and secrets
- KV namespace for session storage
- Scheduled cron jobs for market analysis

### Cloudflare Worker Secrets Setup

Before deploying, configure the required secrets for production environment:

Configuration: JWT_SECRET
Purpose: JWT token signing and verification for API authentication
Set with: wrangler secret put JWT_SECRET --env production

Configuration: MYA_LLM_URL
Purpose: Backend LLM service URL for request forwarding
Set with: wrangler secret put MYA_LLM_URL --env production

CI/CD Automatic Setup (GitHub Actions):
Secrets are automatically uploaded by the deploy workflow if CLOUDFLARE_API_TOKEN and CF_ACCOUNT_ID secrets are configured in GitHub repository settings.

## Deployment

### Automated Deployment

#### Backend (Auto-deploy)
- Pushes to `main` branch automatically deploy the backend
- Cloudflare Workers with global distribution
- Environment-specific configurations (dev/production)

#### CLI (Manual deployment)
- Manual workflow trigger for NPM publishing
- Semantic versioning and release notes
- Distribution via NPM registry

### Manual Deployment
```bash
# Deploy backend to Cloudflare Workers
npx wrangler deploy --env production

# Publish CLI to NPM (maintainers only)
npm version patch|minor|major
npm publish
```

### GitHub Actions Workflows
1. **deploy-backend.yml**: Auto-deploys backend on push to main
2. **deploy-cli.yml**: Manual CLI deployment to NPM
3. **code-quality.yml**: Linting, testing, and quality checks

## 🔒 Security & Authentication

### User Authentication
- **Stytch Integration**: Secure email-based authentication
- **Session Management**: Cloudflare KV with automatic expiration
- **CLI Session Storage**: Local session file (`~/.mya-session.json`) for CLI convenience
- **Machine Fingerprinting**: Prevents session hijacking
- **JWT Tokens**: Secure API communication

### Security Features
- Rate limiting on all API endpoints
- Input validation and sanitization
- Audit logging for security events
- Environment-based configuration management
- No hardcoded secrets or API keys

## 📈 Performance & Scalability

### Hybrid Architecture Benefits
- **Queue Management**: HTTP-based processing for reliable background processing
- **Session Storage**: Cloudflare KV for global, low-latency access
- **Auto-scaling**: Cloudflare Workers scale automatically
- **Fallback Systems**: Graceful degradation when services unavailable

### Performance Optimizations
- Connection pooling and caching
- Optimized data structures and algorithms
- Minimal API calls with intelligent batching
- Background processing for heavy computations

## Available Scripts

```bash
# Build and compilation
npm run build              # Full build pipeline
npm run openapi:generate   # Generate API client
npm run openapi:patch      # Patch generated client

# Development
npm run dev               # Start development mode
npm run lint              # ESLint with auto-fix
npm test                  # Run test suite

# Deployment
npx wrangler dev          # Local Cloudflare Workers
npx wrangler deploy       # Deploy to Cloudflare
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the coding standards
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Commit changes (`git commit -m 'Add amazing feature'`)
7. Push to branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Coding Standards
- TypeScript for all new code
- JSDoc comments for public APIs
- Follow existing patterns and architecture
- Comprehensive error handling
- Unit tests for new features
- ESLint compliance (max 30 warnings)

## Documentation

- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contributing guidelines and standards
- API Documentation - Auto-generated from OpenAPI specification
- JSDoc Comments - Inline code documentation

## Troubleshooting

### Common Issues

**CLI Authentication Problems**
```bash
# Clear stored session and re-authenticate
rm -rf ~/.mya-session.json
mya login
```

**Note**: The CLI stores session information locally in `~/.mya-session.json` for convenience, while the backend maintains the authoritative session data in Cloudflare KV storage. Local session files contain only the session token and basic user info.

**Build Failures**
```bash
# Clean and rebuild
rm -rf dist/ node_modules/
npm install
npm run build
```

### Getting Help
- Check existing issues on GitHub
- Review the architecture documentation
- Join our community discussions
- Contact maintainers for critical issues

## 📄 License

This project is licensed under the terms specified in the [LICENSE](./LICENSE) file.

## 🙏 Acknowledgments

- **Stytch**: Authentication services
- **Polygon.io**: Real-time market data
- **Alpha Vantage**: Financial data APIs
- **Cloudflare**: Workers and KV infrastructure

---

**MYA** - AI-Powered Trading Intelligence
Built with ❤️ for traders and developers
# Last updated: Mon Jul  7 12:24:29 PM EDT 2025
