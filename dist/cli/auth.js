/**
 * Module: CLI Authentication
 * Purpose: Handle user login, OTP verification, and session validation
 * Dependencies: chalk, ora, inquirer (CLI UI), apiRequest, session management
 * Used by: cli-http.ts
 */
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { apiRequest, checkServiceAvailability } from './api-client.js';
import { saveSession, clearSession, loadSession } from './session.js';
import { createSpinner } from './spinner.js';
async function processAuth(email) {
    return apiRequest('/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
}
async function verifyOtpAndCreateSession(email, otpCode, methodId) {
    return apiRequest('/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp_code: otpCode, method_id: methodId }),
    });
}
export async function validateSession(userId, machineId, sessionId) {
    try {
        const result = await apiRequest('/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, machineId, sessionId }),
        });
        return result && result.success === true;
    }
    catch {
        return false;
    }
}
export async function authenticateUser() {
    const spinner = ora();
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
            return null;
        }
        spinner.text = 'Initializing authentication...';
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
        // NEW: Check for existing session in KV via backend
        spinner.start('Checking for existing session...');
        let kvSession = null;
        // Try to get local machineId if available
        let machineId = '';
        try {
            const os = await import('os');
            machineId = os.hostname?.() || '';
        }
        catch (error) {
            console.warn(chalk.yellow('Unable to read machine hostname'), error);
        }
        try {
            kvSession = await apiRequest('/auth/session-by-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, machineId }),
            });
        }
        catch {
            kvSession = null;
        }
        if (kvSession && kvSession.success && kvSession.sessionJwt && kvSession.sessionToken) {
            spinner.succeed('Existing session found. Logging in...');
            const session = {
                userId: kvSession.userId || '',
                machineId: kvSession.machineId || '',
                sessionId: kvSession.sessionToken || '',
                sessionJwt: kvSession.sessionJwt || '',
                email,
                isActive: true,
                createdAt: kvSession.createdAt || Date.now(),
                lastActivity: Date.now(),
                expiresAt: kvSession.expiresAt || (Date.now() + (24 * 60 * 60 * 1000)),
            };
            saveSession(session);
            return session;
        }
        spinner.text = 'No existing session found. Proceeding with OTP authentication...';
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
        const spinner = createSpinner('Validating session...').start();
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