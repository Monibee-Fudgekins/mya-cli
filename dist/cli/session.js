/**
 * Module: CLI Session Management
 * Purpose: Manage user session persistence and configuration
 * Dependencies: fs, path, os (Node.js built-ins)
 * Used by: cli-http.ts, auth.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
export function getCLIConfig() {
    // Determine the environment and corresponding API URL
    const explicitApiUrl = process.env.MYA_API_URL;
    let apiUrl;
    if (explicitApiUrl) {
        // Use explicit URL if provided
        apiUrl = explicitApiUrl;
    }
    else {
        // Production environment (default) - use production worker
        apiUrl = 'https://mya-production.monibee-fudgekin.workers.dev';
    }
    return {
        apiUrl,
        sessionFile: path.join(os.homedir(), '.mya-session.json'),
    };
}
export function loadSession() {
    try {
        const config = getCLIConfig();
        if (!fs.existsSync(config.sessionFile)) {
            return null;
        }
        const sessionData = JSON.parse(fs.readFileSync(config.sessionFile, 'utf8'));
        // Check if session is expired
        if (Date.now() > sessionData.expiresAt) {
            fs.unlinkSync(config.sessionFile);
            return null;
        }
        return sessionData;
    }
    catch (error) {
        console.error('Error loading session:', error);
        return null;
    }
}
export function saveSession(session) {
    try {
        const config = getCLIConfig();
        session.lastActivity = Date.now();
        fs.writeFileSync(config.sessionFile, JSON.stringify(session, null, 2));
    }
    catch (error) {
        console.error('Error saving session:', error);
    }
}
export function clearSession() {
    try {
        const config = getCLIConfig();
        if (fs.existsSync(config.sessionFile)) {
            fs.unlinkSync(config.sessionFile);
        }
    }
    catch (error) {
        console.error('Error clearing session:', error);
    }
}
//# sourceMappingURL=session.js.map