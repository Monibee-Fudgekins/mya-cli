/**
 * Module: CLI Market Utilities
 * Purpose: Market hours checking, timezone handling, and system status fetching
 * Dependencies: apiRequest from api-client.ts, loadSession from session.ts
 * Used by: cli-http.ts, display.ts
 */
import { apiRequest } from './api-client.js';
import { loadSession } from './session.js';
export function getETParts() {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    }).formatToParts(now);
    const get = (t) => parts.find(p => p.type === t)?.value || '0';
    const hour = Number(get('hour'));
    const minute = Number(get('minute'));
    const tzAbbr = String(get('timeZoneName') || 'ET');
    const weekdayStr = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short' }).format(now);
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekdayStr);
    return { day, hour, minute, tzAbbr };
}
export function isMarketHours() {
    const { day, hour, minute } = getETParts();
    const timeInMinutes = hour * 60 + minute;
    if (day === 0 || day === 6)
        return false;
    const marketOpen = 9 * 60 + 30; // 9:30 AM ET
    const marketClose = 16 * 60; // 4:00 PM ET
    return timeInMinutes >= marketOpen && timeInMinutes <= marketClose;
}
export function getMarketStatusMessage() {
    const { day, hour, minute, tzAbbr } = getETParts();
    const now = new Date();
    const timeFmt = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        timeZoneName: 'short',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit'
    });
    const dateFmt = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    const etTime = timeFmt.format(now);
    const etDate = dateFmt.format(now);
    if (day === 0 || day === 6) {
        return `${etDate} ${etTime} - Market closed (weekend)`;
    }
    const timeInMinutes = hour * 60 + minute;
    const marketOpen = 9 * 60 + 30;
    const marketClose = 16 * 60;
    if (timeInMinutes < marketOpen) {
        const minutesUntilOpen = marketOpen - timeInMinutes;
        const hoursUntilOpen = Math.floor(minutesUntilOpen / 60);
        const minutesRemaining = minutesUntilOpen % 60;
        return `${etDate} ${etTime} - Market opens in ${hoursUntilOpen}h ${minutesRemaining}m`;
    }
    else if (timeInMinutes <= marketClose) {
        const minutesUntilClose = marketClose - timeInMinutes;
        const hoursUntilClose = Math.floor(minutesUntilClose / 60);
        const minutesRemaining = minutesUntilClose % 60;
        return `${etDate} ${etTime} - Market open (closes in ${hoursUntilClose}h ${minutesRemaining}m)`;
    }
    else {
        return `${etDate} ${etTime} - Market closed (opens tomorrow at 9:30 AM ${tzAbbr})`;
    }
}
export async function fetchSystemStatus() {
    try {
        const session = loadSession();
        const headers = {};
        if (session?.sessionJwt) {
            headers['Authorization'] = `Bearer ${session.sessionJwt}`;
        }
        return await apiRequest('/api/v1/system/status', { headers });
    }
    catch (error) {
        console.warn('System status unavailable:', error instanceof Error ? error.message : String(error));
        return null;
    }
}
export async function getHuggingFaceFreshness() {
    try {
        const status = await fetchSystemStatus();
        if (status?.vectorize?.lastAnnouncementsUpdate) {
            const lastUpdate = new Date(status.vectorize.lastAnnouncementsUpdate);
            console.log(`Last Hugging Face announcements update: ${lastUpdate.toLocaleString()}`);
        }
        else {
            console.log('Hugging Face announcements have not been updated yet');
        }
    }
    catch (error) {
        console.error('Error fetching Hugging Face freshness:', error);
    }
}
//# sourceMappingURL=market.js.map