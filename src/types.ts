/*
 * SPDX-License-Identifier: LGPL-2.1-or-later
 *
 * Types matching /usr/share/doc/snapraid-daemon/snapraidd.yaml (SnapRAID API v1.0.0)
 */

export type Health = 'passed' | 'corrupt' | 'prefail' | 'failing' | 'pending';
export type Power = 'active' | 'standby' | 'pending';
export type Command =
    'probe' | 'up' | 'down' | 'smart' | 'diff' | 'sync' | 'scrub' | 'check' | 'fix' | 'report' | 'down_idle';
export type HighCommand = 'maintenance' | 'heal' | 'undelete' | 'suspend_idle';
export type TaskStatus =
    'queued' | 'starting' | 'processing' | 'finalizing' | 'stopping' | 'terminated' | 'signaled' | 'canceled';

export interface Pulse {
    current_at: string;
    array: number;
    config: number;
    disks: number;
    tasks: number;
    activity: number;
}

export interface Message {
    level: 'fatal' | 'error' | 'info' | 'verbose';
    type?: 'hardware' | 'soft';
    text: string;
}

export interface Task {
    number: number;
    command: Command;
    high_command?: HighCommand;
    health: Health;
    health_reason?: string;
    status: TaskStatus;
    exit_code?: number;
    exit_sig?: number;
    exit_msg?: string;
    scheduled_at?: string;
    started_at?: string;
    finished_at?: string;
    progress?: number;
    eta_seconds?: number;
    speed_mbs?: number;
    cpu_usage?: number;
    elapsed_seconds?: number;
    blocks_count?: number;
    blocks_done?: number;
    log_file?: string;
    report_output?: string;
    messages: Message[];
    error_soft?: number;
    error_io?: number;
    error_data?: number;
    error_unrecoverable?: number;
}

export interface SmartAttribute {
    name: string;
    critical?: boolean;
    type?: 'prefail' | 'oldage';
    when_failed?: 'never' | 'now' | 'past';
    raw?: number;
    norm?: number;
    worst?: number;
    thresh?: number;
}

export interface Smart {
    measured_at: string;
    attributes: SmartAttribute[];
    power_on_hours?: number;
    temperature_celsius?: number;
    temperature_min_celsius?: number;
    temperature_max_celsius?: number;
    failing?: boolean;
    prefail?: boolean;
    prefail_logged?: boolean;
    error_logged?: boolean;
    selftest_error_logged?: boolean;
}

export interface Device {
    node: string;
    ids: string[];
    split_index: number;
    health: 'passed' | 'prefail' | 'failing' | 'pending';
    power: Power;
    family?: string;
    model?: string;
    serial?: string;
    interface?: string;
    size_bytes?: number;
    rotational?: number;
    wear_level?: number;
    annual_failure_rate?: number;
    failure_probability?: number;
    temp_history_24h?: number[];
    smart?: Smart;
}

export interface Split {
    path: string;
    uuid?: string;
    stored_uuid?: string;
    label?: string;
    type?: string;
}

export interface Disk {
    name: string;
    health: Health;
    power: Power;
    total_space_bytes?: number;
    free_space_bytes?: number;
    error_io?: number;
    error_data?: number;
    splits: Split[];
    devices: Device[];
}

export interface Diff {
    change: 'added' | 'removed' | 'updated' | 'moved' | 'copied' | 'relocated' | 'restored';
    disk: string;
    path: string;
    source_disk?: string;
    source_path?: string;
}

export interface Fix {
    result: 'recovered' | 'unrecoverable';
    disk: string;
    path: string;
}

export interface StateResponse {
    pulse: Pulse;
    health: Health;
    health_reason?: string;
    active_command?: Command;
    next_command?: Command;
    progress?: number;
    eta_seconds?: number;
}

export interface DisksResponse {
    pulse: Pulse;
    data_disks: Disk[];
    parity_disks: Disk[];
    extra_disks: Disk[];
}

export interface TasksResponse {
    pulse: Pulse;
    pending: Task[];
    active: Task[];
    history: Task[];
}

export interface ArrayInfo {
    pulse: Pulse;
    daemon_version: string;
    daemon_conf: string;
    health: Health;
    health_reason?: string;
    engine_version?: string;
    block_size_bytes?: number;
    data_disks_count?: number;
    parity_disks_count?: number;
    extra_disks_count?: number;
    last_command_at?: string;
    last_command?: Command;
    total_space_bytes?: number;
    free_space_bytes?: number;
    files_count?: number;
    blocks_bad?: number;
    blocks_rehash?: number;
    blocks_unscrubbed?: number;
    blocks_unsynced?: number;
    blocks_count?: number;
    last_sync_at?: string;
    last_scrub_at?: string;
    last_diff_at?: string;
    last_fix_at?: string;
    hold_off?: boolean;
    diff_equal?: number;
    diff_added?: number;
    diff_removed?: number;
    diff_updated?: number;
    diff_moved?: number;
    diff_copied?: number;
    diff_relocated?: number;
    diff_restored?: number;
    diffs?: Diff[];
    fix_recovered?: number;
    fix_unrecoverable?: number;
    fixes?: Fix[];
}

export type LogLevel = 'critical' | 'error' | 'warning' | 'info';

export interface Config {
    pulse?: Pulse;
    config_full_access?: boolean;
    maintenance_schedule?: string;
    sync_threshold_deletes?: number;
    sync_threshold_updates?: number;
    sync_prehash?: boolean;
    sync_prevent_truncations?: boolean;
    scrub_percentage?: number;
    scrub_older_than?: number;
    touch_zero_subseconds?: boolean;
    probe_interval_minutes?: number;
    spindown_idle_minutes?: number;
    hook_run_as_user?: string;
    hook_script?: string;
    notify_syslog_enabled?: boolean;
    notify_syslog_level?: LogLevel;
    notify_run_as_user?: string;
    notify_heartbeat?: string;
    notify_result?: string;
    notify_result_level?: LogLevel;
    notify_differences?: boolean;
}
