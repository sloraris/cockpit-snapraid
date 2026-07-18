/*
 * SPDX-License-Identifier: LGPL-2.1-or-later
 *
 * Thin client for snapraid-daemon's local REST API, reached through
 * cockpit.http() (proxied via cockpit-bridge, so no CORS/CSP exposure
 * of the unauthenticated daemon port is needed).
 */

import cockpit from 'cockpit';

import type { CommandOptions, Config } from './types';

export const DAEMON_PORT = "7627";
export const DAEMON_ADDRESS = "127.0.0.1";

export function daemonClient() {
    return cockpit.http(DAEMON_PORT, { address: DAEMON_ADDRESS });
}

export async function getJSON<T>(
    http: ReturnType<typeof daemonClient>,
    path: string,
    params?: Record<string, string | number>
): Promise<T> {
    // Note: HttpInstance.get()'s convenience wrapper takes its second argument as
    // { params, headers }, but this pinned pkg/lib/cockpit.js build actually forwards
    // it verbatim as req.params (so { params: {...} } serializes as a single bogus
    // "params" query key, silently dropping our limits). request()'s params field
    // matches the real implementation, so use that instead.
    const text = await http.request({ path, method: "GET", body: "", ...(params ? { params } : {}) });
    return JSON.parse(text) as T;
}

// Like getJSON, but for endpoints that can return 204 No Content with an
// empty body instead of JSON (e.g. /activity before the daemon's first task).
// Kept separate rather than folded into getJSON: this project's
// exactOptionalPropertyTypes tsconfig means every other getJSON caller
// assigns straight into an optional SnapraidData field, where an explicit
// `undefined` value (as opposed to the key being merely absent) is a type
// error, so widening getJSON itself would push an `!== undefined` guard onto
// every one of those callers instead of just this one.
export async function getJSONOrUndefined<T>(
    http: ReturnType<typeof daemonClient>,
    path: string,
    params?: Record<string, string | number>
): Promise<T | undefined> {
    const text = await http.request({ path, method: "GET", body: "", ...(params ? { params } : {}) });
    return text ? JSON.parse(text) as T : undefined;
}

export async function scheduleCommands(commands: string[]): Promise<void> {
    const http = daemonClient();
    try {
        await http.post("/snapraid/v1/schedule", { tasks: commands.map(command => ({ command })) });
    } finally {
        http.close();
    }
}

export async function stopActiveTask(): Promise<void> {
    const http = daemonClient();
    try {
        await http.post("/snapraid/v1/stop");
    } finally {
        http.close();
    }
}

export async function undeleteFiles(filters?: string[], options?: Omit<CommandOptions, 'filters'>): Promise<void> {
    const http = daemonClient();
    try {
        await http.post("/snapraid/v1/undelete", { ...options, ...(filters?.length ? { filters } : {}) });
    } finally {
        http.close();
    }
}

export async function healArray(options?: CommandOptions): Promise<void> {
    const http = daemonClient();
    try {
        await http.post("/snapraid/v1/heal", { ...options });
    } finally {
        http.close();
    }
}

export async function startMaintenance(options?: CommandOptions): Promise<void> {
    const http = daemonClient();
    try {
        await http.post("/snapraid/v1/maintenance", { ...options });
    } finally {
        http.close();
    }
}

export async function requestRefresh(): Promise<void> {
    const http = daemonClient();
    try {
        await http.post("/snapraid/v1/refresh");
    } finally {
        http.close();
    }
}

export async function setHoldOff(enabled: boolean): Promise<void> {
    const http = daemonClient();
    try {
        await http.post("/snapraid/v1/hold_off", { enabled });
    } finally {
        http.close();
    }
}

export async function patchConfig(partial: Partial<Config>): Promise<void> {
    const http = daemonClient();
    try {
        // .post() JSON-encodes plain-object bodies for us, but it's hardcoded to
        // method POST, so PATCH has to go through request() and do that manually.
        await http.request({
            path: "/snapraid/v1/config",
            method: "PATCH",
            body: JSON.stringify(partial),
            headers: { "Content-Type": "application/json" },
        });
    } finally {
        http.close();
    }
}
