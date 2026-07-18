/*
 * SPDX-License-Identifier: LGPL-2.1-or-later
 *
 * Mirrors snapraid-daemon's own "hero" dashboard card: a highlighted view of
 * the active task while one is running (progress, throughput, live log),
 * falling back to a quiet summary of the last completed task when idle.
 */

import React from 'react';
import { Card, CardBody, CardTitle } from "@patternfly/react-core/dist/esm/components/Card/index.js";
import { Progress } from "@patternfly/react-core/dist/esm/components/Progress/index.js";
import { Flex, FlexItem } from "@patternfly/react-core/dist/esm/layouts/Flex/index.js";

import cockpit from 'cockpit';

import { formatEta } from './ActionsCard';
import { Timestamp } from './ArrayStatusCard';
import { COMMAND_LABEL, duration, MessageLine } from './HistoryCard';
import { HealthLabel, isTaskFinished, TaskStatusLabel } from './StatusLabel';
import type { ActivityResponse } from './types';

const _ = cockpit.gettext;

const HIGH_COMMAND_LABEL: Record<string, string> = {
    maintenance: _("Maintenance"),
    heal: _("Heal"),
    undelete: _("Undelete"),
    suspend_idle: _("Suspend idle"),
};

const formatFullCommand = (t: ActivityResponse): string => {
    const command = COMMAND_LABEL[t.command] ?? t.command;
    return t.high_command ? `${HIGH_COMMAND_LABEL[t.high_command] ?? t.high_command} · ${command}` : command;
};

export const ActivityCard = ({ activity }: { activity?: ActivityResponse | undefined }) => {
    if (!activity) {
        return (
            <Card>
                <CardTitle>{_("Activity")}</CardTitle>
                <CardBody>
                    <p className="snapraid-subtle">{_("No task has run since the daemon last started.")}</p>
                </CardBody>
            </Card>
        );
    }

    const isActive = !isTaskFinished(activity.status);
    const messages = activity.messages.filter(m => m.level !== 'verbose');

    if (isActive) {
        return (
            <Card className="snapraid-glow">
                <CardTitle>
                    <Flex justifyContent={ { default: 'justifyContentSpaceBetween' } } alignItems={ { default: 'alignItemsCenter' } }>
                        <FlexItem>
                            { cockpit.format(_("Active: $0"), formatFullCommand(activity)) }
                            <div className="snapraid-subtle snapraid-text-sm">
                                {_("Started")} <Timestamp t={ activity.started_at } />
                            </div>
                        </FlexItem>
                        <FlexItem><TaskStatusLabel task={ activity } /></FlexItem>
                    </Flex>
                </CardTitle>
                <CardBody>
                    { activity.status === 'processing' &&
                        <>
                            <Progress
                                value={ activity.progress ?? 0 }
                                title={ formatEta(activity.eta_seconds) ?? undefined }
                                measureLocation="outside"
                                className="snapraid-mb-md"
                            />
                            <Flex className="snapraid-mb-md">
                                { activity.speed_mbs !== undefined &&
                                    <FlexItem>
                                        <span className="snapraid-subtle snapraid-text-sm">{_("Speed")}</span>
                                        <div>{ cockpit.format(_("$0 MB/s"), activity.speed_mbs) }</div>
                                    </FlexItem> }
                                { activity.size_done_bytes !== undefined &&
                                    <FlexItem>
                                        <span className="snapraid-subtle snapraid-text-sm">{_("Processed")}</span>
                                        <div>{ cockpit.format_bytes(activity.size_done_bytes) }</div>
                                    </FlexItem> }
                                { activity.cpu_usage !== undefined &&
                                    <FlexItem>
                                        <span className="snapraid-subtle snapraid-text-sm">{_("CPU")}</span>
                                        <div>{ cockpit.format(_("$0%"), activity.cpu_usage) }</div>
                                    </FlexItem> }
                            </Flex>
                        </> }

                    <div className="snapraid-log-window">
                        { messages.length === 0 && <i className="snapraid-subtle">{_("No messages yet")}</i> }
                        { messages.map((m, i) => <MessageLine key={ i } m={ m } />) }
                    </div>
                </CardBody>
            </Card>
        );
    }

    const taskDuration = duration(activity.started_at, activity.finished_at);

    return (
        <Card>
            <CardTitle>{_("Activity")}</CardTitle>
            <CardBody>
                <p className="snapraid-subtle snapraid-mb-sm">{_("Last task finished execution.")}</p>
                <Flex alignItems={ { default: 'alignItemsCenter' } }>
                    <FlexItem>{ formatFullCommand(activity) }</FlexItem>
                    <FlexItem><HealthLabel health={ activity.health } reason={ activity.health_reason } isCompact /></FlexItem>
                    <FlexItem><TaskStatusLabel task={ activity } isCompact /></FlexItem>
                    { taskDuration &&
                        <FlexItem className="snapraid-subtle snapraid-text-sm">
                            { cockpit.format(_("$0 duration"), taskDuration) }
                        </FlexItem> }
                </Flex>
            </CardBody>
        </Card>
    );
};
