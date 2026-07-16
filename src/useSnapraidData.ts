/*
 * SPDX-License-Identifier: LGPL-2.1-or-later
 *
 * Polls snapraid-daemon for array/disk/task state.
 *
 * /snapraid/v1/state is cheap and polled on a fixed interval. Its `pulse`
 * counters tell us whether the heavier /array, /disks, /tasks payloads
 * have actually changed since the last fetch, so we only refetch those
 * when their specific counter moves (per the daemon's documented
 * cache-invalidation contract).
 */

import { useEffect, useState } from 'react';

import cockpit from 'cockpit';

import { daemonClient, getJSON } from './daemon';
import type { ArrayInfo, DisksResponse, Pulse, StateResponse, TasksResponse } from './types';

const POLL_INTERVAL_MS = 3000;
const LIMIT_MESSAGES = 10;
const LIMIT_DIFFS = 50;
const LIMIT_FIXES = 50;

export interface SnapraidData {
    state?: StateResponse;
    array?: ArrayInfo;
    disks?: DisksResponse;
    tasks?: TasksResponse;
    error?: string | undefined;
    loading: boolean;
}

export function useSnapraidData(historyLimit: number): SnapraidData {
    const [data, setData] = useState<SnapraidData>({ loading: true });

    useEffect(() => {
        let cancelled = false;
        const http = daemonClient();
        let lastPulse: Pulse | null = null;

        async function refreshArray() {
            const array = await getJSON<ArrayInfo>(http, "/snapraid/v1/array",
                                                   { limit_diffs: LIMIT_DIFFS, limit_fixes: LIMIT_FIXES });
            if (!cancelled)
                setData(d => ({ ...d, array }));
        }

        async function refreshDisks() {
            const disks = await getJSON<DisksResponse>(http, "/snapraid/v1/disks");
            if (!cancelled)
                setData(d => ({ ...d, disks }));
        }

        async function refreshTasks() {
            const tasks = await getJSON<TasksResponse>(http, "/snapraid/v1/tasks",
                                                       { limit_history: historyLimit, limit_messages: LIMIT_MESSAGES });
            if (!cancelled)
                setData(d => ({ ...d, tasks }));
        }

        async function poll() {
            try {
                const state = await getJSON<StateResponse>(http, "/snapraid/v1/state");
                if (cancelled)
                    return;
                setData(d => ({ ...d, state, error: undefined, loading: false }));

                const prev = lastPulse;
                lastPulse = state.pulse;

                if (!prev) {
                    await Promise.all([refreshArray(), refreshDisks(), refreshTasks()]);
                    return;
                }

                const jobs = [];
                if (state.pulse.array !== prev.array || state.pulse.config !== prev.config)
                    jobs.push(refreshArray());
                if (state.pulse.disks !== prev.disks)
                    jobs.push(refreshDisks());
                if (state.pulse.tasks !== prev.tasks || state.pulse.activity !== prev.activity)
                    jobs.push(refreshTasks());
                await Promise.all(jobs);
            } catch (err) {
                if (!cancelled)
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    setData(d => ({ ...d, error: cockpit.message(err as any), loading: false }));
            }
        }

        poll();
        const interval = setInterval(poll, POLL_INTERVAL_MS);

        return () => {
            cancelled = true;
            clearInterval(interval);
            http.close();
        };
    }, [historyLimit]);

    return data;
}
