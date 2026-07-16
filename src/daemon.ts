/*
 * SPDX-License-Identifier: LGPL-2.1-or-later
 *
 * Thin client for snapraid-daemon's local REST API, reached through
 * cockpit.http() (proxied via cockpit-bridge, so no CORS/CSP exposure
 * of the unauthenticated daemon port is needed).
 */

import cockpit from 'cockpit';

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
