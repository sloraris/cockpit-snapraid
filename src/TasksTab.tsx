/*
 * SPDX-License-Identifier: LGPL-2.1-or-later
 */

import React from 'react';
import { Card, CardBody, CardTitle } from "@patternfly/react-core/dist/esm/components/Card/index.js";
import { Stack, StackItem } from "@patternfly/react-core/dist/esm/layouts/Stack/index.js";

import cockpit from 'cockpit';
import * as timeformat from 'timeformat';

import { ListingTable } from 'cockpit-components-table';
import type { ListingTableRowProps } from 'cockpit-components-table';

import { HISTORY_INITIAL_LIMIT, HistoryCard } from './HistoryCard';
import { TaskStatusLabel } from './StatusLabel';
import type { Task, TasksResponse } from './types';

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

const taskRows = (tasks: Task[], timeField: 'scheduled_at' | 'started_at'): ListingTableRowProps[] =>
    tasks.map(t => ({
        props: { key: t.number },
        columns: [
            { title: `#${t.number}` },
            { title: COMMAND_LABEL[t.command] ?? t.command },
            { title: <TaskStatusLabel status={ t.status } isCompact /> },
            { title: t[timeField] ? timeformat.dateTime(new Date(t[timeField]!)) : "—" },
        ],
    }));

export const TasksTab = (
    { tasks, historyLimit, onHistoryShowMore }: {
        tasks?: TasksResponse | undefined, historyLimit: number, onHistoryShowMore: () => void
    }
) => (
    <Stack hasGutter>
        { !!tasks?.pending.length &&
            <StackItem>
                <Card>
                    <CardTitle>{_("Queue")}</CardTitle>
                    <CardBody>
                        <ListingTable
                            columns={ [_("ID"), _("Command"), _("Status"), _("Scheduled")] }
                            rows={ taskRows(tasks.pending, 'scheduled_at') }
                            variant="compact"
                        />
                    </CardBody>
                </Card>
            </StackItem> }

        { !!tasks?.active.length &&
            <StackItem>
                <Card>
                    <CardTitle>{_("Active")}</CardTitle>
                    <CardBody>
                        <ListingTable
                            columns={ [_("ID"), _("Command"), _("Status"), _("Started")] }
                            rows={ taskRows(tasks.active, 'started_at') }
                            variant="compact"
                        />
                    </CardBody>
                </Card>
            </StackItem> }

        <StackItem>
            <HistoryCard tasks={ tasks } limit={ historyLimit } onShowMore={ onHistoryShowMore } />
        </StackItem>
    </Stack>
);

export { HISTORY_INITIAL_LIMIT };
