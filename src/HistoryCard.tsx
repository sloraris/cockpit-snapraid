/*
 * SPDX-License-Identifier: LGPL-2.1-or-later
 */

import React, { useState } from 'react';
import { Button } from "@patternfly/react-core/dist/esm/components/Button/index.js";
import { Card, CardBody, CardTitle } from "@patternfly/react-core/dist/esm/components/Card/index.js";
import { EmptyState, EmptyStateBody } from "@patternfly/react-core/dist/esm/components/EmptyState/index.js";
import { Flex, FlexItem } from "@patternfly/react-core/dist/esm/layouts/Flex/index.js";
import { Label } from "@patternfly/react-core/dist/esm/components/Label/index.js";
import { Spinner } from "@patternfly/react-core/dist/esm/components/Spinner/index.js";
import { Switch } from "@patternfly/react-core/dist/esm/components/Switch/index.js";

import cockpit from 'cockpit';
import * as timeformat from 'timeformat';

import { ListingTable } from 'cockpit-components-table';
import type { ListingTableRowProps } from 'cockpit-components-table';

import { HealthLabel, TaskStatusLabel } from './StatusLabel';
import type { Message, Task, TasksResponse } from './types';

const _ = cockpit.gettext;

export const COMMAND_LABEL: Record<string, string> = {
    probe: _("Probe"),
    up: _("Up"),
    down: _("Down"),
    smart: _("SMART"),
    diff: _("Diff"),
    sync: _("Sync"),
    scrub: _("Scrub"),
    check: _("Check"),
    fix: _("Fix"),
    report: _("Report"),
    down_idle: _("Down (idle)"),
};

export const duration = (start?: string, end?: string): string | null => {
    if (!start || !end)
        return null;
    const seconds = Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000));
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    // eslint-disable-next-line no-template-curly-in-string -- cockpit.format() placeholder syntax, not a template literal
    return m > 0 ? cockpit.format(_("${0}m ${1}s"), m, s) : cockpit.format(_("${0}s"), s);
};

const MESSAGE_CLASS: Record<Message['level'], string> = {
    fatal: 'ct-icon-times-circle',
    error: 'ct-icon-exclamation-triangle',
    info: '',
    verbose: 'snapraid-subtle',
};

// Common signals worth naming; anything else just shows the raw number.
const SIGNAL_NAMES: Record<number, string> = {
    1: 'SIGHUP',
    2: 'SIGINT',
    3: 'SIGQUIT',
    6: 'SIGABRT',
    9: 'SIGKILL',
    11: 'SIGSEGV',
    13: 'SIGPIPE',
    15: 'SIGTERM',
};

export const MessageLine = ({ m }: { m: Message }) => (
    <div className={ `snapraid-text-sm ${MESSAGE_CLASS[m.level]}` }>
        { m.type === 'hardware' &&
            <Label isCompact status="danger" className="snapraid-mr-sm">{_("Hardware")}</Label> }
        { m.text }
    </div>
);

// The collapsed row already shows a one-line result; expanding a task is
// for digging into what actually happened, so surface everything the API
// gives us: exit/signal/cancel status, fatal messages first (most likely
// to explain a failure), the health verdict's reason, where the full CLI
// log landed on disk, remaining messages, and any generated report text.
const TaskDetail = ({ task }: { task: Task }) => {
    const fatal = task.messages.filter(m => m.level === 'fatal');
    const other = task.messages.filter(m => m.level !== 'fatal');

    /* eslint-disable no-template-curly-in-string -- cockpit.format() placeholder syntax, not a template literal */
    return (
        <div className="snapraid-task-detail">
            { task.status === 'terminated' && !!task.exit_code &&
                <div className="ct-icon-exclamation-triangle snapraid-text-sm snapraid-mb-xs">
                    { cockpit.format(_("Exit code: ${0}"), task.exit_code) }
                </div> }
            { task.status === 'signaled' &&
                <div className="ct-icon-times-circle snapraid-text-sm snapraid-mb-xs">
                    { cockpit.format(_("Exit signal: ${0}"),
                                     task.exit_sig !== undefined ? (SIGNAL_NAMES[task.exit_sig] ?? task.exit_sig) : "?") }
                </div> }
            { task.status === 'canceled' && task.exit_msg &&
                <div className="snapraid-subtle snapraid-text-sm snapraid-mb-xs">{ task.exit_msg }</div> }

            { fatal.map((m, i) => <MessageLine key={ `fatal-${i}` } m={ m } />) }

            { task.health_reason &&
                <div className="snapraid-text-sm snapraid-mb-xs">
                    <HealthLabel health={ task.health } isCompact /> { task.health_reason }
                </div> }

            { task.log_file &&
                <div className="snapraid-subtle snapraid-text-sm snapraid-mb-xs">
                    { cockpit.format(_("Log file: ${0}"), task.log_file) }
                </div> }

            { other.map((m, i) => <MessageLine key={ `other-${i}` } m={ m } />) }

            { fatal.length === 0 && other.length === 0 && !task.report_output &&
                <i className="snapraid-subtle">{_("No log messages")}</i> }

            { task.report_output && <pre className="snapraid-report-output">{ task.report_output }</pre> }
        </div>
    );
    /* eslint-enable no-template-curly-in-string */
};

const historyRows = (history: Task[]): ListingTableRowProps[] => history.map(task => ({
    props: { key: task.number },
    columns: [
        { title: COMMAND_LABEL[task.command] ?? task.command },
        { title: <TaskStatusLabel task={ task } isCompact /> },
        { title: <HealthLabel health={ task.health } reason={ task.health_reason } isCompact /> },
        { title: task.started_at ? timeformat.dateTime(new Date(task.started_at)) : "—" },
        { title: duration(task.started_at, task.finished_at) ?? "—" },
        { title: task.exit_msg ?? (task.exit_code !== undefined ? cockpit.format(_("exit $0"), task.exit_code) : "—") },
    ],
    expandedContent: <TaskDetail task={ task } />,
}));

export const HISTORY_INITIAL_LIMIT = 15;

export const HistoryCard = (
    { tasks, limit, onShowMore }: { tasks?: TasksResponse | undefined, limit: number, onShowMore: () => void }
) => {
    // snapraid-daemon's own UI hides 'probe' runs from history by default —
    // they happen every few minutes and drown out the tasks a user actually
    // cares about.
    const [hidePeriodic, setHidePeriodic] = useState(true);
    const history = tasks ? (hidePeriodic ? tasks.history.filter(t => t.command !== 'probe') : tasks.history) : [];

    return (
        <Card>
            <CardTitle>
                <Flex justifyContent={ { default: 'justifyContentSpaceBetween' } } alignItems={ { default: 'alignItemsCenter' } }>
                    <FlexItem>{_("Recent tasks")}</FlexItem>
                    <FlexItem>
                        <Switch
                            id="history-hide-periodic"
                            label={ _("Hide automatic probes") }
                            isChecked={ hidePeriodic }
                            onChange={ (_ev, checked) => setHidePeriodic(checked) }
                        />
                    </FlexItem>
                </Flex>
            </CardTitle>
            <CardBody>
                { !tasks &&
                    <EmptyState titleText={ _("Loading task history…") } icon={ Spinner }>
                        <EmptyStateBody />
                    </EmptyState> }
                { tasks &&
                    <>
                        <ListingTable
                            columns={ [_("Command"), _("Status"), _("Health"), _("Started"), _("Duration"), _("Result")] }
                            rows={ historyRows(history) }
                            emptyCaption={ _("No tasks have run yet") }
                            variant="compact"
                        />
                        { tasks.history.length >= limit &&
                            <Button variant="link" onClick={ onShowMore }>
                                { cockpit.format(_("Show $0 more"), HISTORY_INITIAL_LIMIT) }
                            </Button> }
                    </> }
            </CardBody>
        </Card>
    );
};
