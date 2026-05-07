/**
 * Module: CLI Spinner Utilities
 * Purpose: Provide ora spinners configured for STANDARDS.md compliance (plain ASCII only, no Unicode symbols)
 * Dependencies: ora (spinners)
 * Used by: auth.ts, display.ts, cli-http.ts
 */
import ora from 'ora';
export const spinnerConfig = {
    prefixText: '',
    isEnabled: true,
    stream: process.stderr,
    isSilent: false,
    text: '',
    discardStdin: true,
    hideCursor: true,
};
export function createSpinner(text) {
    const spinner = ora({
        ...spinnerConfig,
        text,
        spinner: 'dots',
        prefixText: '',
    });
    // Override succeed/fail/warn/info to use plain ASCII prefixes instead of Unicode symbols
    const originalSucceed = spinner.succeed.bind(spinner);
    const originalFail = spinner.fail.bind(spinner);
    const originalWarn = spinner.warn.bind(spinner);
    const originalInfo = spinner.info.bind(spinner);
    spinner.succeed = (msg) => originalSucceed(msg ? `[OK] ${msg}` : '[OK]');
    spinner.fail = (msg) => originalFail(msg ? `[ERROR] ${msg}` : '[ERROR]');
    spinner.warn = (msg) => originalWarn(msg ? `[WARN] ${msg}` : '[WARN]');
    spinner.info = (msg) => originalInfo(msg ? `[INFO] ${msg}` : '[INFO]');
    return spinner;
}
//# sourceMappingURL=spinner.js.map