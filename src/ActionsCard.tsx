/*
 * SPDX-License-Identifier: LGPL-2.1-or-later
 */

import React, { useState } from 'react';
import { Alert } from "@patternfly/react-core/dist/esm/components/Alert/index.js";
import { Button } from "@patternfly/react-core/dist/esm/components/Button/index.js";
import { Card, CardBody, CardTitle } from "@patternfly/react-core/dist/esm/components/Card/index.js";
import { Progress } from "@patternfly/react-core/dist/esm/components/Progress/index.js";
import { Flex, FlexItem } from "@patternfly/react-core/dist/esm/layouts/Flex/index.js";

import cockpit from 'cockpit';

import { scheduleCommands, stopActiveTask } from './daemon';
import { TaskStatusLabel } from './StatusLabel';
import type { Command, StateResponse, TasksResponse } from './types';

const _ = cockpit.gettext;

const COMMAND_LABEL: Record<string, string> = {
    diff: _("Diff"),
    sync: _("Sync"),
    scrub: _("Scrub"),
};

const formatEta = (seconds?: number): string | null => {
    if (seconds === undefined)
        return null;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    // eslint-disable-next-line no-template-curly-in-string -- cockpit.format() placeholder syntax, not a template literal
    return cockpit.format(_("${0}m ${1}s remaining"), m, s.toString().padStart(2, '0'));
};

export const ActionsCard = ({ state, tasks }: { state?: StateResponse | undefined, tasks?: TasksResponse | undefined }) => {
    const [error, setError] = useState<string | null>(null);
    const [triggering, setTriggering] = useState<Command | null>(null);

    const active = tasks?.active?.[0];
    const pendingCount = tasks?.pending?.length ?? 0;
    const isBusy = !!active || !!state?.active_command;

    const trigger = (command: Command) => {
        setError(null);
        setTriggering(command);
        scheduleCommands([command])
                .catch(err => setError(cockpit.message(err)))
                .finally(() => setTriggering(null));
    };

    const stop = () => {
        setError(null);
        stopActiveTask().catch(err => setError(cockpit.message(err)));
    };

    return (
        <Card>
            <CardTitle>{_("Maintenance")}</CardTitle>
            <CardBody>
                { error && <Alert variant="danger" isInline title={ _("Action failed") }>{ error }</Alert> }

                <Flex>
                    { (['diff', 'sync', 'scrub'] as Command[]).map(cmd => (
                        <FlexItem key={ cmd }>
                            <Button
                                variant="secondary"
                                isDisabled={ isBusy }
                                isLoading={ triggering === cmd }
                                onClick={ () => trigger(cmd) }
                            >
                                { COMMAND_LABEL[cmd] }
                            </Button>
                        </FlexItem>
                    )) }
                    { isBusy &&
                        <FlexItem>
                            <Button variant="danger" onClick={ stop }>{_("Stop")}</Button>
                        </FlexItem> }
                </Flex>

                <br />

                { active &&
                    <>
                        <Flex alignItems={ { default: 'alignItemsCenter' } }>
                            <FlexItem>{ COMMAND_LABEL[active.command] ?? active.command }</FlexItem>
                            <FlexItem><TaskStatusLabel status={ active.status } isCompact /></FlexItem>
                        </Flex>
                        { active.progress !== undefined &&
                            <Progress
                                value={ active.progress }
                                title={ formatEta(active.eta_seconds) ?? undefined }
                                measureLocation="outside"
                            /> }
                    </> }

                { !active && state?.active_command &&
                    <Flex alignItems={ { default: 'alignItemsCenter' } }>
                        <FlexItem>{ COMMAND_LABEL[state.active_command] ?? state.active_command }</FlexItem>
                        { state.progress !== undefined &&
                            <FlexItem>
                                <Progress value={ state.progress } measureLocation="outside" />
                            </FlexItem> }
                    </Flex> }

                { !isBusy && <span className="snapraid-subtle">{_("Idle")}</span> }

                { pendingCount > 0 &&
                    <p>{ cockpit.format(cockpit.ngettext("$0 task queued", "$0 tasks queued", pendingCount), pendingCount) }</p> }
            </CardBody>
        </Card>
    );
};
