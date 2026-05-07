/**
 * Module: CLI Spinner Utilities
 * Purpose: Provide ora spinners configured for STANDARDS.md compliance (plain ASCII only, no Unicode symbols)
 * Dependencies: ora (spinners)
 * Used by: auth.ts, display.ts, cli-http.ts
 */
export declare const spinnerConfig: {
    prefixText: string;
    isEnabled: boolean;
    stream: NodeJS.WriteStream & {
        fd: 2;
    };
    isSilent: boolean;
    text: string;
    discardStdin: boolean;
    hideCursor: boolean;
};
export declare function createSpinner(text: string): import("ora").Ora;
