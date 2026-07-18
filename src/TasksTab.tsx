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

import { COMMAND_LABEL, HISTORY_INITIAL_LIMIT, HistoryCard } from './HistoryCard';
import { TaskStatusLabel } from './StatusLabel';
import type { Task, TasksResponse } from './types';

const _ = cockpit.gettext;

const elapsedSince = (start?: string): string => {
    if (!start)
        return "—";
    const seconds = Math.max(0, Math.round((Date.now() - new Date(start).getTime()) / 1000));
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    // eslint-disable-next-line no-template-curly-in-string -- cockpit.format() placeholder syntax, not a template literal
    return m > 0 ? cockpit.format(_("${0}m ${1}s"), m, s) : cockpit.format(_("${0}s"), s);
};

const taskRows = (tasks: Task[], timeField: 'scheduled_at' | 'started_at'): ListingTableRowProps[] =>
    tasks.map(t => ({
        props: { key: t.number },
        columns: [
            { title: `#${t.number}` },
            { title: COMMAND_LABEL[t.command] ?? t.command },
            { title: <TaskStatusLabel task={ t } isCompact /> },
            { title: t[timeField] ? timeformat.dateTime(new Date(t[timeField]!)) : "—" },
        ],
    }));

// Active tasks show the same columns as the queue/history tables plus a
// live-elapsed column, so build on taskRows() rather than restating them.
const activeRows = (tasks: Task[]): ListingTableRowProps[] =>
    taskRows(tasks, 'started_at').map((row, i) => ({
        ...row,
        columns: [...row.columns, { title: elapsedSince(tasks[i].started_at) }],
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
                            columns={ [_("ID"), _("Command"), _("Status"), _("Started"), _("Duration")] }
                            rows={ activeRows(tasks.active) }
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
