#!/usr/bin/env node
/**
 * Module: MYA CLI - HTTP Client
 * Purpose: Main CLI entry point for MYA trading platform
 * Dependencies: commander (CLI), chalk (colors), ora (spinners), modules in cli/ and shared/
 * Used by: CLI users, bin/mya.cjs
 *
 * This is the main CLI orchestrator that handles all user commands.
 * Business logic is split into modules in cli/ for easier maintenance:
 * - cli/auth.ts - Authentication and session validation
 * - cli/session.ts - Session persistence and config
 * - cli/api-client.ts - HTTP API communication
 * - cli/analysis.ts - Analysis request handling
 * - cli/display.ts - Result formatting and display
 * - cli/market.ts - Market utilities and timestamps
 */
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
// Import auth and session management
import { authenticateUser, ensureAuthenticated, validateSession } from './cli/auth.js';
import { loadSession, clearSession } from './cli/session.js';
import { apiRequest } from './cli/api-client.js';
// Import analysis and results
import { submitAnalysisRequest, getAnalysisResult, _logoutUser } from './cli/analysis.js';
// Import display utilities
import { displayAnalysisResults, displayFallbackNotice, printSystemStatus, startYahooCooldownPolling } from './cli/display.js';
// Import market utilities
import { getMarketStatusMessage, fetchSystemStatus, getHuggingFaceFreshness } from './cli/market.js';
/**
 * Main CLI program
 */
async function main() {
    const program = new Command();
    program
        .name('mya')
        .description('MYA - AI-Powered Stock & Options Analysis. Fully automated trading intelligence platform.')
        .version('1.0.0');
    // Login command
    program
        .command('login')
        .description('Authenticate and create a new session')
        .option('-f, --force', 'Force re-authentication even if already logged in')
        .action(async (options) => {
        try {
            // Check if already authenticated (unless force flag is used)
            if (!options.force) {
                const existingSession = loadSession();
                if (existingSession) {
                    const spinner = ora('Checking existing session...').start();
                    try {
                        const isValid = await validateSession(existingSession.userId, existingSession.machineId, existingSession.sessionId);
                        if (isValid) {
                            spinner.succeed('Already authenticated');
                            console.log(chalk.green('Already logged in as'), chalk.cyan(existingSession.email));
                            console.log(chalk.gray('Use "mya login --force" to re-authenticate'));
                            console.log(getMarketStatusMessage());
                            return;
                        }
                        else {
                            spinner.warn('Session expired, re-authenticating...');
                        }
                    }
                    catch (error) {
                        spinner.warn('Session validation failed, re-authenticating...');
                        console.warn('Session validation error', error);
                    }
                }
            }
            const session = await authenticateUser();
            if (session) {
                console.log(chalk.green('Successfully authenticated'));
                console.log(getMarketStatusMessage());
            }
        }
        catch (error) {
            console.error(chalk.red('Authentication failed:'), error);
        }
    });
    // Analyze command
    program
        .command('analyze')
        .description('Stock analysis with BUY/SELL/HOLD recommendations (CMT methodology)')
        .action(async () => {
        try {
            const session = await ensureAuthenticated();
            if (!session) {
                console.log(chalk.red('Authentication required'));
                process.exit(1);
            }
            console.log(getMarketStatusMessage());
            const sys = await fetchSystemStatus();
            if (sys?.yahooCooldown?.active) {
                const secs = Math.ceil((sys.yahooCooldown.remainingMs || 0) / 1000);
                console.log(chalk.yellow(` Yahoo cooldown active (~${secs}s). We'll wait as needed during fetches.`));
            }
            await getHuggingFaceFreshness();
            const spinner = ora('Analyzing market data from announcements...').start();
            const stopCooldownTicker = startYahooCooldownPolling(spinner, 'Analyzing market data from announcements...');
            try {
                const analysisResult = await submitAnalysisRequest(session.userId, session.machineId, 'analyze_cmt', {
                    sessionId: session.sessionId,
                    analysisType: 'cmt_analysis',
                    cmtLevel: 'Level_III',
                    requireEntryPrice: true,
                    requireTimeframe: true
                });
                if (analysisResult.success) {
                    stopCooldownTicker();
                    spinner.succeed('Market analysis completed');
                    console.log(chalk.green('Stock Analysis Results:'));
                    console.log(chalk.gray('Request ID:'), analysisResult.requestId);
                    if (analysisResult.result) {
                        console.log('\n' + chalk.blue('Market Analysis:'));
                        if (typeof analysisResult.result.aiAnalysis === 'string') {
                            console.log(analysisResult.result.aiAnalysis);
                        }
                        else {
                            console.log(JSON.stringify(analysisResult.result, null, 2));
                        }
                        if (analysisResult.result.dataPoints) {
                            console.log(chalk.gray(`\nAnalyzed ${analysisResult.result.dataPoints} market data points`));
                        }
                        displayFallbackNotice(analysisResult.result);
                    }
                }
                else {
                    stopCooldownTicker();
                    spinner.fail('Market analysis failed');
                    console.error(chalk.red('Analysis request failed:'), analysisResult.error);
                }
            }
            catch (error) {
                stopCooldownTicker();
                spinner.fail('Market analysis error');
                console.error(chalk.red('Analysis request error:'), error);
            }
        }
        catch (error) {
            console.error(chalk.red('Analyze command failed:'), error);
        }
    });
    // Double command
    program
        .command('double')
        .description('Find 200%+ return opportunities (CMT analysis)')
        .action(async () => {
        try {
            const session = await ensureAuthenticated();
            if (!session) {
                console.log(chalk.red('Authentication required'));
                process.exit(1);
            }
            console.log(getMarketStatusMessage());
            const sys = await fetchSystemStatus();
            if (sys?.yahooCooldown?.active) {
                const secs = Math.ceil((sys.yahooCooldown.remainingMs || 0) / 1000);
                console.log(chalk.yellow(` Yahoo cooldown active (~${secs}s). We'll wait as needed during fetches.`));
            }
            await getHuggingFaceFreshness();
            const spinner = ora('Analyzing for 200%+ return opportunities...').start();
            const stopCooldownTicker = startYahooCooldownPolling(spinner, 'Analyzing for 200%+ return opportunities...');
            try {
                const analysisResult = await submitAnalysisRequest(session.userId, session.machineId, 'double_cmt', {
                    sessionId: session.sessionId,
                    analysisType: 'cmt_double',
                    cmtLevel: 'Level_III',
                    minReturnTarget: 200,
                    requireEntryPrice: true,
                    requireTimeframe: true,
                    includeOptions: true,
                    includeStocks: true
                });
                if (analysisResult.success) {
                    stopCooldownTicker();
                    spinner.succeed('Double capital analysis completed');
                    console.log(chalk.green('200%+ Return Analysis Results:'));
                    console.log(chalk.gray('Request ID:'), analysisResult.requestId);
                    if (analysisResult.result) {
                        console.log('\n' + chalk.blue('Market Analysis - 200%+ Opportunities:'));
                        if (typeof analysisResult.result.aiAnalysis === 'string') {
                            console.log(analysisResult.result.aiAnalysis);
                        }
                        else {
                            console.log(JSON.stringify(analysisResult.result, null, 2));
                        }
                        if (analysisResult.result.dataPoints) {
                            console.log(chalk.gray(`\nAnalyzed ${analysisResult.result.dataPoints} potential 200%+ return opportunities`));
                        }
                        displayFallbackNotice(analysisResult.result);
                    }
                }
                else {
                    stopCooldownTicker();
                    spinner.fail('Double capital analysis failed');
                    console.error(chalk.red('Analysis request failed:'), analysisResult.error);
                }
            }
            catch (error) {
                stopCooldownTicker();
                spinner.fail('Double capital analysis error');
                console.error(chalk.red('Analysis request error:'), error);
            }
        }
        catch (error) {
            console.error(chalk.red('Double capital command failed:'), error);
        }
    });
    // Earnings command
    program
        .command('earnings')
        .description('CMT analysis of stocks with earnings THIS WEEK ONLY')
        .action(async () => {
        try {
            const session = await ensureAuthenticated();
            if (!session) {
                console.log(chalk.red(' Authentication required'));
                process.exit(1);
            }
            console.log(getMarketStatusMessage());
            const sys = await fetchSystemStatus();
            if (sys?.yahooCooldown?.active) {
                const secs = Math.ceil((sys.yahooCooldown.remainingMs || 0) / 1000);
                console.log(chalk.yellow(` Yahoo cooldown active (~${secs}s). We'll wait as needed during fetches.`));
            }
            await getHuggingFaceFreshness();
            const spinner = ora('Finding stocks with earnings THIS WEEK only...').start();
            const stopCooldownTicker = startYahooCooldownPolling(spinner, 'Finding stocks with earnings THIS WEEK only...');
            try {
                const analysisResult = await submitAnalysisRequest(session.userId, session.machineId, 'earnings_cmt', {
                    sessionId: session.sessionId,
                    analysisType: 'cmt_earnings',
                    earningsWeekOnly: true,
                    strictEarningsFilter: true,
                    cmtLevel: 'Level_III',
                    requireBuyPrice: true,
                    requireTimeframe: true
                });
                if (analysisResult.success) {
                    stopCooldownTicker();
                    spinner.succeed('Current week earnings analysis completed');
                    console.log(chalk.green('This Week\'s Earnings Analysis:'));
                    console.log(chalk.gray('Request ID:'), analysisResult.requestId);
                    if (analysisResult.result) {
                        console.log('\n' + chalk.blue('Earnings This Week:'));
                        const symbols = Array.isArray(analysisResult.result.symbols) ? analysisResult.result.symbols : [];
                        const count = typeof analysisResult.result.dataPoints === 'number' ? analysisResult.result.dataPoints : symbols.length;
                        if (count > 0 && symbols.length > 0) {
                            console.log(chalk.gray(`Found ${count} stocks with earnings this week`));
                            console.log(chalk.white('\nStocks with earnings this week:'), chalk.cyan(symbols.join(', ')));
                        }
                        else {
                            console.log(chalk.yellow('No stocks with earnings this week.'));
                        }
                    }
                }
                else {
                    stopCooldownTicker();
                    spinner.fail('Earnings analysis failed');
                    console.error(chalk.red('Analysis request failed:'), analysisResult.error);
                }
            }
            catch (error) {
                stopCooldownTicker();
                spinner.fail('Earnings analysis error');
                console.error(chalk.red('Analysis request error:'), error);
            }
        }
        catch (error) {
            console.error(chalk.red('Earnings command failed:'), error);
        }
    });
    // Announcements command
    program
        .command('announcements')
        .description('Market news review and fundamentals data collection')
        .action(async () => {
        try {
            const session = await ensureAuthenticated();
            if (!session) {
                console.log(chalk.red(' Authentication required'));
                process.exit(1);
            }
            console.log(getMarketStatusMessage());
            await getHuggingFaceFreshness();
            const spinner = ora('Reviewing market news and fundamentals data...').start();
            try {
                const analysisResult = await submitAnalysisRequest(session.userId, session.machineId, 'announcements_cmt', {});
                if (analysisResult.success && analysisResult.result) {
                    spinner.succeed('Market news review completed');
                    console.log(chalk.green('Market News Review:'));
                    console.log(chalk.gray('Request ID:'), analysisResult.requestId || 'N/A');
                    const result = analysisResult.result;
                    if (result.aiAnalysis) {
                        console.log('\n' + chalk.blue('Market News Review:'));
                        console.log(result.aiAnalysis);
                    }
                    if (result.symbols && result.symbols.length > 0) {
                        console.log(chalk.white('\nStocks identified for analysis:'), chalk.cyan(result.symbols.join(', ')));
                    }
                    if (result.timestamp) {
                        console.log(chalk.gray(`\nGenerated: ${new Date(result.timestamp).toLocaleString()}`));
                    }
                    displayFallbackNotice(analysisResult.result);
                }
                else {
                    spinner.fail('Market news review failed');
                    console.error(chalk.red('Analysis request failed:'), analysisResult.error || 'Unknown error');
                }
            }
            catch (error) {
                spinner.fail('Market news review error');
                console.error(chalk.red('Analysis request error:'), error);
            }
        }
        catch (error) {
            console.error(chalk.red('Announcements command failed:'), error);
        }
    });
    // Results command
    program
        .command('results [requestId]')
        .description('Get analysis results (optionally specify request ID)')
        .action(async (requestId) => {
        try {
            const session = await ensureAuthenticated();
            if (!session) {
                console.log(chalk.red(' Authentication required'));
                process.exit(1);
            }
            if (requestId) {
                await displayAnalysisResults(requestId, session, getAnalysisResult);
            }
            else {
                const spinner = ora('Retrieving most recent analysis results...').start();
                try {
                    const result = await apiRequest('/recent-results', {
                        headers: {
                            'Authorization': `Bearer ${session.sessionJwt}`,
                        },
                    });
                    if (result.success && result.requestId) {
                        spinner.succeed('Recent results retrieved');
                        await displayAnalysisResults(result.requestId, session, getAnalysisResult);
                    }
                    else {
                        spinner.fail('No recent results found');
                        console.log(chalk.yellow('No recent analysis results found.'));
                        console.log(chalk.blue('Run one of the analysis commands first'));
                    }
                }
                catch (error) {
                    spinner.fail('Failed to retrieve recent results');
                    console.log(chalk.yellow('No recent analysis results found.'));
                    console.warn('Recent results retrieval error', error);
                }
            }
        }
        catch (error) {
            console.error(chalk.red(' Results command failed:'), error);
        }
    });
    // Status command
    program
        .command('status')
        .description('Show current authentication status and session information')
        .action(async () => {
        try {
            const session = loadSession();
            if (!session) {
                console.log(chalk.red('Not authenticated'));
                console.log(chalk.blue('Run "mya login" to authenticate'));
                return;
            }
            const now = Date.now();
            const timeLeft = session.expiresAt - now;
            const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            console.log(chalk.green('Authenticated'));
            console.log(chalk.white('Email:'), chalk.cyan(session.email));
            console.log(chalk.white('User ID:'), chalk.gray(session.userId));
            console.log(chalk.white('Machine ID:'), chalk.gray(session.machineId.substring(0, 8) + '...'));
            console.log(chalk.white('Session created:'), chalk.gray(new Date(session.createdAt).toLocaleString()));
            console.log(chalk.white('Last activity:'), chalk.gray(new Date(session.lastActivity).toLocaleString()));
            if (timeLeft > 0) {
                console.log(chalk.white('Session expires:'), chalk.yellow(`in ${hoursLeft}h ${minutesLeft}m`));
                console.log(chalk.white('Expiry date:'), chalk.gray(new Date(session.expiresAt).toLocaleString()));
            }
            else {
                console.log(chalk.red('Session expired'));
                console.log(chalk.blue('Run "mya login" to re-authenticate'));
            }
            console.log('\n' + getMarketStatusMessage());
            const systemStatus = await fetchSystemStatus();
            printSystemStatus(systemStatus);
        }
        catch (error) {
            console.error(chalk.red('Status check failed:'), error);
        }
    });
    // Logout command
    program
        .command('logout')
        .description('Log out and clear session')
        .action(async () => {
        try {
            const session = loadSession();
            if (!session) {
                console.log(chalk.yellow('Not currently logged in'));
                return;
            }
            const spinner = ora('Logging out...').start();
            try {
                await _logoutUser(session.userId, session.machineId);
                spinner.succeed('Logged out from server');
            }
            catch (error) {
                spinner.warn('Server logout failed, clearing local session');
                console.warn('Server logout error', error);
            }
            clearSession();
            console.log(chalk.green('Session cleared successfully'));
            console.log(chalk.blue('Run "mya login" to authenticate again'));
        }
        catch (error) {
            console.error(chalk.red('Logout failed:'), error);
        }
    });
    // Agent commands
    program
        .command('ingest')
        .description('Run data ingestion pipeline for AI agent')
        .action(async () => {
        try {
            const session = await ensureAuthenticated();
            if (!session) {
                console.log(chalk.red('Authentication required'));
                process.exit(1);
            }
            const spinner = ora('Running data ingestion...').start();
            try {
                const result = await apiRequest('/agent/ingest', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.sessionJwt}`,
                    },
                    body: JSON.stringify({}),
                });
                spinner.succeed('Data ingestion completed');
                console.log(chalk.green('Ingestion Results:'));
                console.log(result);
            }
            catch (error) {
                spinner.fail('Data ingestion failed');
                console.error(chalk.red('Ingestion error:'), error);
            }
        }
        catch (error) {
            console.error(chalk.red('Ingest command failed:'), error);
        }
    });
    program
        .command('predict')
        .description('Run prediction pipeline for AI agent')
        .action(async () => {
        try {
            const session = await ensureAuthenticated();
            if (!session) {
                console.log(chalk.red('Authentication required'));
                process.exit(1);
            }
            const spinner = ora('Running predictions...').start();
            try {
                const result = await apiRequest('/agent/predict', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.sessionJwt}`,
                    },
                    body: JSON.stringify({}),
                });
                spinner.succeed('Predictions completed');
                console.log(chalk.green('Prediction Results:'));
                console.log(result);
            }
            catch (error) {
                spinner.fail('Predictions failed');
                console.error(chalk.red('Prediction error:'), error);
            }
        }
        catch (error) {
            console.error(chalk.red('Predict command failed:'), error);
        }
    });
    program
        .command('benchmark')
        .description('Run benchmark pipeline for AI agent')
        .action(async () => {
        try {
            const session = await ensureAuthenticated();
            if (!session) {
                console.log(chalk.red('Authentication required'));
                process.exit(1);
            }
            const spinner = ora('Running benchmark...').start();
            try {
                const result = await apiRequest('/agent/benchmark', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.sessionJwt}`,
                    },
                    body: JSON.stringify({}),
                });
                spinner.succeed('Benchmark completed');
                console.log(chalk.green('Benchmark Results:'));
                console.log(result);
            }
            catch (error) {
                spinner.fail('Benchmark failed');
                console.error(chalk.red('Benchmark error:'), error);
            }
        }
        catch (error) {
            console.error(chalk.red('Benchmark command failed:'), error);
        }
    });
    program
        .command('agent-status')
        .description('Get AI agent status and accuracy metrics')
        .action(async () => {
        try {
            const session = await ensureAuthenticated();
            if (!session) {
                console.log(chalk.red('Authentication required'));
                process.exit(1);
            }
            const spinner = ora('Fetching agent status...').start();
            try {
                const result = await apiRequest('/agent/status', {
                    headers: {
                        'Authorization': `Bearer ${session.sessionJwt}`,
                    },
                });
                spinner.succeed('Agent status retrieved');
                console.log(chalk.green('Agent Status:'));
                console.log(result);
            }
            catch (error) {
                spinner.fail('Failed to get agent status');
                console.error(chalk.red('Status error:'), error);
            }
        }
        catch (error) {
            console.error(chalk.red('Agent status command failed:'), error);
        }
    });
    // Version command
    program
        .command('version')
        .description('Show version information')
        .action(() => {
        console.log(chalk.blue('MYA - AI-Powered Stock & Options Analysis'));
        console.log(chalk.white('Version:'), chalk.green('1.0.0'));
        console.log(chalk.white('Node.js:'), chalk.gray(process.version));
        console.log(chalk.white('Platform:'), chalk.gray(process.platform));
    });
    // Parse command line arguments
    program.parse();
}
// Enhanced error handler
function handleCliError(error) {
    console.error(chalk.red(' CLI Error:'), error.message || error);
    if (error.message?.includes('ENOTFOUND') || error.message?.includes('network')) {
        console.log(chalk.yellow('[NETWORK] Issue Detected:'));
        console.log(chalk.gray('  - Check your internet connection'));
        console.log(chalk.gray('  - Verify you can access external websites'));
    }
    else if (error.message?.includes('Authentication') || error.message?.includes('401')) {
        console.log(chalk.yellow('[AUTH] Issue:'));
        console.log(chalk.gray('  - Run "mya login" to authenticate'));
        console.log(chalk.gray('  - Check if your session has expired with "mya status"'));
    }
    else {
        console.log(chalk.yellow('[INFO] Troubleshooting Tips:'));
        console.log(chalk.gray('  - Check your authentication: "mya status"'));
        console.log(chalk.gray('  - Verify internet connection'));
        console.log(chalk.gray('  - Try "mya login" if authentication expired'));
    }
}
// Run the CLI
main().catch(handleCliError);
//# sourceMappingURL=cli-http.js.map