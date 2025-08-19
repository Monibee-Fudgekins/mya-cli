import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
// Production API URL - points to deployed worker
const API_BASE_URL = process.env.MYA_API_URL || 'https://mya-production.monibee-fudgekin.workers.dev';
async function makeRequest(endpoint, data = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
}
async function loadSession() {
    try {
        const fs = await import('fs');
        const path = await import('path');
        const os = await import('os');
        const sessionPath = path.join(os.homedir(), '.mya-session.json');
        if (fs.existsSync(sessionPath)) {
            const sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
            return sessionData;
        }
    }
    catch (error) {
        // Session file doesn't exist or is invalid
    }
    return null;
}
async function saveSession(session) {
    const fs = await import('fs');
    const path = await import('path');
    const os = await import('os');
    const sessionPath = path.join(os.homedir(), '.mya-session.json');
    fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
}
async function ensureAuthenticated() {
    const session = await loadSession();
    if (session) {
        try {
            // Validate session with API
            await makeRequest('/api/validate-session', session);
            return session;
        }
        catch (error) {
            // Session is invalid, need to re-authenticate
        }
    }
    console.log(chalk.yellow('Authentication required. Please login.'));
    return null;
}
function getMarketStatusMessage() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    const isWeekend = day === 0 || day === 6;
    const isMarketHours = hour >= 9 && hour < 16;
    if (isWeekend) {
        return chalk.yellow('Market is CLOSED (Weekend) - Next open: Monday 9:30 AM EST');
    }
    else if (!isMarketHours) {
        return chalk.yellow('Market is CLOSED (After-hours) - Next open: 9:30 AM EST tomorrow');
    }
    else {
        return chalk.green('Market is OPEN (Regular hours)');
    }
}
async function submitAnalysisRequest(userId, machineId, analysisType, data = {}) {
    return makeRequest('/api/analyze', {
        userId,
        machineId,
        analysisType,
        ...data
    });
}
// CLI Commands
const program = new Command();
program
    .name('mya')
    .description('AI-powered stock and options analysis CLI tool')
    .version('0.1.0');
// Login command
program
    .command('login')
    .description('Authenticate with your account')
    .action(async () => {
    try {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'email',
                message: 'Email:',
                validate: (input) => input.includes('@') || 'Please enter a valid email'
            },
            {
                type: 'password',
                name: 'password',
                message: 'Password:',
                mask: '*'
            }
        ]);
        const spinner = ora('Authenticating...').start();
        try {
            const result = await makeRequest('/api/login', answers);
            if (result.success) {
                await saveSession(result.session);
                spinner.succeed('Authentication successful');
                console.log(chalk.green('✅ Logged in successfully'));
            }
            else {
                spinner.fail('Authentication failed');
                console.log(chalk.red('❌ Invalid credentials'));
            }
        }
        catch (error) {
            spinner.fail('Authentication error');
            console.error(chalk.red('Login failed:'), error);
        }
    }
    catch (error) {
        console.error(chalk.red('Login command failed:'), error);
    }
});
// Analysis commands
program
    .command('analyze')
    .description('Perform comprehensive market analysis with CMT technical analysis')
    .action(async () => {
    try {
        const session = await ensureAuthenticated();
        if (!session) {
            console.log(chalk.red('❌ Authentication required'));
            process.exit(1);
        }
        console.log(getMarketStatusMessage());
        const spinner = ora('Analyzing market data from announcements...').start();
        try {
            const analysisResult = await submitAnalysisRequest(session.userId, session.machineId, 'cmt_analysis', {});
            if (analysisResult.success && analysisResult.result) {
                spinner.succeed('Market analysis completed');
                console.log(chalk.green('Stock Analysis Results:'));
                console.log(chalk.gray('Request ID:'), analysisResult.requestId || 'N/A');
                const result = analysisResult.result;
                if (result.aiAnalysis) {
                    console.log('\n' + chalk.blue('Market Analysis:'));
                    console.log(result.aiAnalysis);
                }
                if (result.symbols && result.symbols.length > 0) {
                    console.log(chalk.white('\nAnalyzed'), chalk.cyan(result.symbols.length), chalk.white('market data points'));
                }
            }
            else {
                spinner.fail('Market analysis failed');
                console.error(chalk.red('Analysis request failed:'), analysisResult.error || 'Unknown error');
            }
        }
        catch (error) {
            spinner.fail('Market analysis error');
            console.error(chalk.red('Analysis request error:'), error);
        }
    }
    catch (error) {
        console.error(chalk.red('Analyze command failed:'), error);
    }
});
// Add other commands
program
    .command('announcements')
    .description('Market news review and fundamentals data collection for analysis functions')
    .action(async () => {
    try {
        const session = await ensureAuthenticated();
        if (!session) {
            console.log(chalk.red('❌ Authentication required'));
            process.exit(1);
        }
        console.log(getMarketStatusMessage());
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
program
    .command('earnings')
    .description('Earnings analysis and screening for upcoming opportunities')
    .action(async () => {
    const session = await ensureAuthenticated();
    if (!session) {
        console.log(chalk.red('❌ Authentication required'));
        process.exit(1);
    }
    console.log(getMarketStatusMessage());
    const spinner = ora('Analyzing earnings data...').start();
    try {
        const result = await submitAnalysisRequest(session.userId, session.machineId, 'earnings_cmt', {});
        spinner.succeed('Earnings analysis completed');
        console.log(chalk.green('Earnings Analysis Results:'));
        if (result.result?.aiAnalysis) {
            console.log('\n' + result.result.aiAnalysis);
        }
    }
    catch (error) {
        spinner.fail('Earnings analysis failed');
        console.error(chalk.red('Error:'), error);
    }
});
program
    .command('double')
    .description('Double-top and double-bottom pattern analysis')
    .action(async () => {
    const session = await ensureAuthenticated();
    if (!session) {
        console.log(chalk.red('❌ Authentication required'));
        process.exit(1);
    }
    console.log(getMarketStatusMessage());
    const spinner = ora('Analyzing double patterns...').start();
    try {
        const result = await submitAnalysisRequest(session.userId, session.machineId, 'double_cmt', {});
        spinner.succeed('Double pattern analysis completed');
        console.log(chalk.green('Double Pattern Analysis Results:'));
        if (result.result?.aiAnalysis) {
            console.log('\n' + result.result.aiAnalysis);
        }
    }
    catch (error) {
        spinner.fail('Double pattern analysis failed');
        console.error(chalk.red('Error:'), error);
    }
});
// Status command
program
    .command('status')
    .description('Show system status and API information')
    .action(async () => {
    try {
        const session = await loadSession();
        console.log(chalk.blue('🔍 MYA CLI Status Report'));
        console.log('═'.repeat(40));
        if (session) {
            console.log(chalk.green('✅ Authentication: Logged in'));
            console.log(chalk.gray(`   User ID: ${session.userId}`));
        }
        else {
            console.log(chalk.yellow('⚠️  Authentication: Not logged in'));
            console.log(chalk.gray('   Run "mya login" to authenticate'));
        }
        console.log(chalk.blue('\n📊 Market Status:'));
        console.log('  ' + getMarketStatusMessage());
        console.log(chalk.blue('\n🌐 API Configuration:'));
        console.log(chalk.gray(`   Endpoint: ${API_BASE_URL}`));
        console.log('\n' + chalk.green('✅ CLI is ready for use'));
    }
    catch (error) {
        console.error(chalk.red('Status check failed:'), error);
    }
});
// Cache command
program
    .command('cache')
    .description('Show cache status information')
    .action(async () => {
    console.log(chalk.blue('📊 Cache Status (CLI Version)'));
    console.log('═'.repeat(40));
    console.log(chalk.gray('Cache management is handled by the backend service.'));
    console.log(chalk.gray(`Backend: ${API_BASE_URL}`));
    console.log('\n' + chalk.green('✅ Cache is managed automatically'));
});
program.parse();
