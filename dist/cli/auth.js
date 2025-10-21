/**
 * Module: CLI Authentication
 * Purpose: Handle user login, OTP verification, and session validation
 * Dependencies: chalk, ora, inquirer (CLI UI), apiRequest, initializeServices, session management
 * Used by: cli-http.ts
 *
 * Error Handling Improvements:
 * - Added specific troubleshooting for HTTP 503 errors from backend
 * - Detects when MYA_LLM_URL environment variable is not configured
 * - Provides clear guidance to users when backend is unavailable
 * - Reports non-JSON responses from backend gracefully
 */
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { apiRequest, checkServiceAvailability } from './api-client.js';
import { loadSession, saveSession, clearSession } from './session.js';
import { initializeServices } from '../shared/init.js';
export async function processAuth(email) {
    return apiRequest('/auth', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
    });
}
export async function verifyOtpAndCreateSession(email, otpCode, methodId) {
    return apiRequest('/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otpCode, methodId }),
    });
}
export async function validateSession(_userId, _machineId, _sessionId) {
    try {
        const session = loadSession();
        if (!session || !session.sessionJwt) {
            return false;
        }
        const result = await apiRequest('/auth/verify', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.sessionJwt}`,
            },
        });
        return result.valid;
    }
    catch {
        return false;
    }
}
export async function authenticateUser() {
    const spinner = ora('Checking service availability...').start();
    try {
        // Check if backend is reachable before proceeding
        const isServiceAvailable = await checkServiceAvailability();
        if (!isServiceAvailable) {
            spinner.fail('Service not available');
            console.error(chalk.red(' Backend service is not reachable.'));
            console.log(chalk.yellow('[TROUBLESHOOTING] Steps:'));
            console.log(chalk.gray('  - Check your internet connection'));
            console.log(chalk.gray('  - Verify you can access other websites'));
            console.log(chalk.gray('  - The service may be temporarily down - try again in a few minutes'));
            console.log(chalk.gray('  - Check service status at: https://status.your-service.com'));
            return null;
        }
        spinner.text = 'Initializing authentication...';
        await initializeServices(apiRequest);
        spinner.succeed('Services initialized');
        const { email } = await inquirer.prompt([
            {
                type: 'input',
                name: 'email',
                message: 'Enter your email:',
                validate: (input) => {
                    if (!input || !input.includes('@')) {
                        return 'Please enter a valid email address';
                    }
                    return true;
                },
            },
        ]);
        spinner.start('Sending authentication code...');
        let authResult;
        try {
            authResult = await processAuth(email);
            if (!authResult.success) {
                spinner.fail('Authentication failed');
                console.error(chalk.red('Authentication failed:'), authResult.error);
                console.error(chalk.red('Full response:'), JSON.stringify(authResult, null, 2));
                return null;
            }
            spinner.succeed('Authentication code sent');
        }
        catch (error) {
            spinner.fail('Authentication request failed');
            console.error(chalk.red('Error details:'), error);
            console.error(chalk.red('Error message:'), error instanceof Error ? error.message : 'Unknown error');
            // Try to get more details from the response
            if (error instanceof Error && error.message.includes('HTTP')) {
                console.error(chalk.red('This appears to be an HTTP error. Check the worker logs for more details.'));
                if (error.message.includes('503') || error.message.includes('Backend request failed')) {
                    console.log(chalk.yellow('\n[TROUBLESHOOTING] Backend service issues:'));
                    console.log(chalk.gray('  - Verify the backend service (mya-llm) is running'));
                    console.log(chalk.gray('  - Check that the worker environment variable MYA_LLM_URL is configured'));
                    console.log(chalk.gray('  - Verify the backend URL is correct in wrangler.toml secrets'));
                    console.log(chalk.gray('  - Check Cloudflare Worker logs for proxy errors'));
                }
            }
            return null;
        }
        const { otpCode } = await inquirer.prompt([
            {
                type: 'input',
                name: 'otpCode',
                message: 'Enter the 6-digit code from your email:',
                validate: (input) => {
                    if (!input || input.length !== 6 || !/^\d{6}$/.test(input)) {
                        return 'Please enter a valid 6-digit code';
                    }
                    return true;
                },
            },
        ]);
        const methodId = authResult.methodId || authResult.method_id;
        if (!methodId) {
            spinner.fail('Authentication failed');
            console.error(chalk.red('Authentication failed: No method ID received'));
            return null;
        }
        spinner.start('Verifying code and creating session...');
        const sessionResult = await verifyOtpAndCreateSession(email, otpCode, methodId);
        if (!sessionResult.success) {
            spinner.fail('Session creation failed');
            if (sessionResult.error?.includes('otp_code_not_found') || sessionResult.error?.includes('incorrect')) {
                console.error(chalk.red('Invalid verification code. Please check your email and try again.'));
                console.log(chalk.yellow('Tip: Make sure to enter the 6-digit code exactly as received in your email.'));
            }
            else {
                console.error(chalk.red('Session creation failed:'), sessionResult.error);
            }
            return null;
        }
        spinner.succeed('Session created successfully');
        const session = {
            userId: sessionResult.userId || '',
            machineId: sessionResult.machineId || '',
            sessionId: sessionResult.sessionToken || '',
            sessionJwt: sessionResult.sessionJwt || '',
            email,
            isActive: true,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        };
        saveSession(session);
        return session;
    }
    catch (error) {
        spinner.fail('Authentication error');
        console.error(chalk.red(' Authentication error:'), error);
        return null;
    }
}
export async function ensureAuthenticated() {
    let session = loadSession();
    if (session) {
        const spinner = ora('Validating session...').start();
        try {
            const isValid = await validateSession(session.userId, session.machineId, session.sessionId);
            if (isValid) {
                spinner.succeed('Session validated');
                saveSession(session); // Update last activity
                return session;
            }
            else {
                spinner.warn('Session expired or invalid');
                clearSession();
                session = null;
            }
        }
        catch (error) {
            spinner.fail('Session validation error');
            console.error(chalk.yellow('Session validation error:'), error);
            clearSession();
            session = null;
        }
    }
    if (!session) {
        console.log(chalk.blue('Please authenticate to continue'));
        session = await authenticateUser();
    }
    return session;
}
//# sourceMappingURL=auth.js.map