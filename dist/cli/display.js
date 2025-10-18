/**
 * Module: CLI Display Utilities
 * Purpose: Format and display analysis results, system status, and fallback notices
 * Dependencies: chalk (color output), ora (spinners), AnalysisResult, SystemStatus types
 * Used by: cli-http.ts
 */
import chalk from 'chalk';
import ora from 'ora';
import { getMarketStatusMessage, fetchSystemStatus } from './market.js';
export function displayFallbackNotice(result) {
    if (!result?.fallback) {
        return;
    }
    const fallback = result.fallback;
    const when = fallback.timestamp ? new Date(fallback.timestamp).toLocaleString() : 'unknown time';
    const reason = fallback.reason ? fallback.reason.replace(/_/g, ' ') : 'unspecified';
    const mode = fallback.mode ? fallback.mode.replace(/_/g, ' ') : 'alternate path';
    console.log(chalk.yellow('\n[WARNING] AI fallback active'));
    console.log(chalk.yellow(`   Reason: ${reason}`));
    console.log(chalk.yellow(`   Mode: ${mode}`));
    console.log(chalk.yellow(`   Activated: ${when}`));
    console.log(chalk.gray('   Tip: Run "mya health" to inspect LaunchDarkly + AI status.'));
}
export function startYahooCooldownPolling(spinner, baseText) {
    let stopped = false;
    let polling = false;
    let lastShown = false;
    const interval = setInterval(async () => {
        if (stopped || polling)
            return;
        polling = true;
        try {
            const status = await fetchSystemStatus();
            const cd = status?.yahooCooldown;
            if (cd?.active && typeof cd.remainingMs === 'number') {
                const secs = Math.max(0, Math.ceil(cd.remainingMs / 1000));
                spinner.text = `${baseText} ${chalk.yellow(`(waiting for Yahoo cooldown ~${secs}s)`)}`;
                lastShown = true;
            }
            else if (lastShown) {
                spinner.text = baseText;
                lastShown = false;
            }
        }
        catch {
            // Ignore polling errors
        }
        finally {
            polling = false;
        }
    }, 2000);
    return () => {
        stopped = true;
        clearInterval(interval);
    };
}
export function printSystemStatus(status) {
    if (!status) {
        console.log(chalk.red('Unable to load system status.'));
        console.log(chalk.gray('Verify network connectivity or run "mya health" later.'));
        return;
    }
    console.log(chalk.blue('\n[SYSTEM HEALTH SNAPSHOT]'));
    console.log(chalk.gray('   Captured at:'), chalk.white(new Date(status.timestamp).toLocaleString()));
    console.log(chalk.gray('   Agent mode:'), status.agentMode.enabled ? chalk.green('ENABLED') : chalk.yellow('DISABLED'));
    const ldStatus = status.launchDarkly;
    const ldLine = ldStatus.ready ? chalk.green('READY') : chalk.red('UNAVAILABLE');
    console.log(chalk.gray('   LaunchDarkly:'), ldLine, ldStatus.model ? chalk.gray(`(model: ${ldStatus.model})`) : '');
    if (!ldStatus.ready && ldStatus.error) {
        console.log(chalk.yellow(`   LD error: ${ldStatus.error}`));
    }
    const ldFallback = status.fallbacks.launchdarkly;
    if (ldFallback.count > 0) {
        console.log(chalk.yellow(`   LaunchDarkly fallbacks: ${ldFallback.count} (last ${ldFallback.lastTimestamp ? new Date(ldFallback.lastTimestamp).toLocaleString() : 'unknown'})`));
    }
    else {
        console.log(chalk.gray('   LaunchDarkly fallbacks: 0'));
    }
    const aiFallback = status.fallbacks.ai;
    if (aiFallback.count > 0) {
        console.log(chalk.yellow(`   AI fallbacks: ${aiFallback.count} (last ${aiFallback.lastTimestamp ? new Date(aiFallback.lastTimestamp).toLocaleString() : 'unknown'})`));
    }
    if (status.vectorize?.lastAnnouncementsUpdate) {
        console.log(chalk.gray('   Last Vectorize refresh:'), chalk.white(new Date(status.vectorize.lastAnnouncementsUpdate).toLocaleString()));
    }
    if (status.trading.halted) {
        console.log(chalk.red('   Trading halt ACTIVE'), status.trading.reason ? chalk.red(`- ${status.trading.reason}`) : '');
        if (status.trading.since) {
            console.log(chalk.red(`   Halt since: ${new Date(status.trading.since).toLocaleDateString()}`));
        }
    }
    else {
        console.log(chalk.green('   Trading halt: none'));
    }
    console.log(chalk.gray('\n   Recent cron activity:'));
    Object.entries(status.cron).forEach(([label, value]) => {
        const formatted = value ? new Date(value).toLocaleString() : 'never';
        console.log(chalk.gray(`     - ${label}: `), value ? chalk.white(formatted) : chalk.yellow('never recorded'));
    });
    if (status.yahooCooldown?.active) {
        const secs = Math.ceil((status.yahooCooldown.remainingMs || 0) / 1000);
        console.log(chalk.yellow(`\n Yahoo cooldown active: waiting ~${secs}s (attempt ${status.yahooCooldown.attemptCount || 1})`));
    }
}
export async function displayAnalysisResults(requestId, session, getAnalysisResult) {
    const spinner = ora('Retrieving analysis results...').start();
    try {
        const result = await getAnalysisResult(requestId, session.userId);
        if (result.status === 'completed') {
            spinner.succeed('Analysis completed');
            console.log(chalk.green('Analysis Results:'));
            // Check if result has data field or use the whole result
            const resultData = 'result' in result ? result.result : result;
            // Format the results nicely instead of raw JSON
            if (resultData && typeof resultData === 'object') {
                if (resultData.aiAnalysis) {
                    console.log(chalk.white(resultData.aiAnalysis));
                }
                else if (resultData.analysis) {
                    console.log(chalk.white(resultData.analysis));
                }
                else {
                    // Fallback to formatted JSON, but filter out technical details
                    const cleanResult = { ...resultData };
                    delete cleanResult.timestamp;
                    delete cleanResult.requestId;
                    delete cleanResult.dataPoints;
                    delete cleanResult.marketContext;
                    console.log(JSON.stringify(cleanResult, null, 2));
                }
                // Show symbols analyzed if available
                if (resultData.symbols) {
                    console.log(chalk.gray('\nSymbols analyzed:'), resultData.symbols.join(', '));
                }
                // Show market status
                const marketStatus = getMarketStatusMessage();
                console.log(chalk.blue('\nMarket Status:'), marketStatus);
                displayFallbackNotice(resultData);
            }
            else {
                console.log(JSON.stringify(resultData, null, 2));
            }
        }
        else if (result.status === 'failed') {
            spinner.fail('Analysis failed');
            console.log(chalk.red(`Analysis failed: ${result.error || 'Unknown error'}`));
        }
        else if (result.status === 'processing') {
            spinner.warn('Analysis still processing');
            console.log(chalk.yellow('Analysis still processing...'));
        }
        else {
            spinner.info('Analysis status retrieved');
            console.log(chalk.gray('Analysis status:'), result.status);
            if ('message' in result && result.message) {
                console.log(chalk.gray('Message:'), result.message);
            }
        }
    }
    catch (error) {
        spinner.fail('Failed to retrieve results');
        console.error(chalk.red('Failed to retrieve results:'), error);
    }
}
//# sourceMappingURL=display.js.map