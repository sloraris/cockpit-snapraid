/*
 * SPDX-License-Identifier: LGPL-2.1-or-later
 */

import React from 'react';
import { Button } from "@patternfly/react-core/dist/esm/components/Button/index.js";
import { Card, CardBody, CardTitle } from "@patternfly/react-core/dist/esm/components/Card/index.js";
import { EmptyState, EmptyStateBody } from "@patternfly/react-core/dist/esm/components/EmptyState/index.js";
import { Spinner } from "@patternfly/react-core/dist/esm/components/Spinner/index.js";

import cockpit from 'cockpit';
import * as timeformat from 'timeformat';

import { ListingTable } from 'cockpit-components-table';
import type { ListingTableRowProps } from 'cockpit-components-table';

import { HealthLabel, TaskStatusLabel } from './StatusLabel';
import type { Message, Task, TasksResponse } from './types';

const _ = cockpit.gettext;

const COMMAND_LABEL: Record<string, string> = {
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

const duration = (task: Task): string | null => {
    if (!task.started_at || !task.finished_at)
        return null;
    const seconds = Math.max(0, Math.round((new Date(task.finished_at).getTime() - new Date(task.started_at).getTime()) / 1000));
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? cockpit.format(_("$0m $1s"), m, s) : cockpit.format(_("$0s"), s);
};

const MESSAGE_CLASS: Record<Message['level'], string> = {
    fatal: 'ct-icon-times-circle',
    error: 'ct-icon-exclamation-triangle',
    info: '',
    verbose: '',
};

const TaskMessages = ({ messages }: { messages: Message[] }) => {
    if (messages.length === 0)
        return <i>{_("No log messages")}</i>;
    return (
        <div className="snapraid-task-messages">
            { messages.map((m, i) => (
                <div key={ i } className={ MESSAGE_CLASS[m.level] }>{ m.text }</div>
            )) }
        </div>
    );
};

const historyRows = (history: Task[]): ListingTableRowProps[] => history.map(task => ({
    props: { key: task.number },
    columns: [
        { title: COMMAND_LABEL[task.command] ?? task.command },
        { title: <TaskStatusLabel status={ task.status } isCompact /> },
        { title: <HealthLabel health={ task.health } reason={ task.health_reason } isCompact /> },
        { title: task.started_at ? timeformat.dateTime(new Date(task.started_at)) : "—" },
        { title: duration(task) ?? "—" },
        { title: task.exit_msg ?? (task.exit_code !== undefined ? cockpit.format(_("exit $0"), task.exit_code) : "—") },
    ],
    expandedContent: <TaskMessages messages={ task.messages } />,
}));

export const HISTORY_INITIAL_LIMIT = 15;

export const HistoryCard = (
    { tasks, limit, onShowMore }: { tasks?: TasksResponse | undefined, limit: number, onShowMore: () => void }
) => {
    return (
        <Card>
            <CardTitle>{_("Recent tasks")}</CardTitle>
            <CardBody>
                { !tasks &&
                    <EmptyState titleText={ _("Loading task history…") } icon={ Spinner }>
                        <EmptyStateBody />
                    </EmptyState> }
                { tasks &&
                    <>
                        <ListingTable
                            columns={ [_("Command"), _("Status"), _("Health"), _("Started"), _("Duration"), _("Result")] }
                            rows={ historyRows(tasks.history) }
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
