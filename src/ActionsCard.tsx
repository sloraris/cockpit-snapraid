/*
 * SPDX-License-Identifier: LGPL-2.1-or-later
 */

import React, { useState } from 'react';
import { Alert } from "@patternfly/react-core/dist/esm/components/Alert/index.js";
import { Button } from "@patternfly/react-core/dist/esm/components/Button/index.js";
import { Card, CardBody, CardTitle } from "@patternfly/react-core/dist/esm/components/Card/index.js";
import { Checkbox } from "@patternfly/react-core/dist/esm/components/Checkbox/index.js";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@patternfly/react-core/dist/esm/components/Modal/index.js";
import { Progress } from "@patternfly/react-core/dist/esm/components/Progress/index.js";
import { Switch } from "@patternfly/react-core/dist/esm/components/Switch/index.js";
import { Flex, FlexItem } from "@patternfly/react-core/dist/esm/layouts/Flex/index.js";

import cockpit from 'cockpit';

import { requestRefresh, scheduleCommands, setHoldOff, startMaintenance, stopActiveTask } from './daemon';
import { TaskStatusLabel } from './StatusLabel';
import type { ArrayInfo, Command, StateResponse, TasksResponse } from './types';

const _ = cockpit.gettext;

const COMMAND_LABEL: Record<string, string> = {
    diff: _("Diff"),
    sync: _("Sync"),
    scrub: _("Scrub"),
};

const MaintenanceDialog = (
    { onClose, onConfirm }: {
        onClose: () => void,
        onConfirm: (opts: { ignore_thresholds: boolean, spindown_on_finish: boolean }) => void
    }
) => {
    const [ignoreThresholds, setIgnoreThresholds] = useState(false);
    const [spindownOnFinish, setSpindownOnFinish] = useState(false);

    return (
        <Modal isOpen onClose={ onClose } variant="small">
            <ModalHeader title={ _("Start full maintenance sequence?") } />
            <ModalBody>
                <p className="snapraid-mb-md">
                    { _("Runs diff, sync, and scrub in sequence, followed by a report.") }
                </p>
                <Checkbox
                    id="maintenance-ignore-thresholds"
                    label={ _("Ignore delete/update safety thresholds") }
                    isChecked={ ignoreThresholds }
                    onChange={ (_ev, checked) => setIgnoreThresholds(checked) }
                    className="snapraid-mb-sm"
                />
                <Checkbox
                    id="maintenance-spindown-on-finish"
                    label={ _("Spin down all disks once finished") }
                    isChecked={ spindownOnFinish }
                    onChange={ (_ev, checked) => setSpindownOnFinish(checked) }
                />
            </ModalBody>
            <ModalFooter>
                <Button
                    variant="primary"
                    onClick={ () => onConfirm({ ignore_thresholds: ignoreThresholds, spindown_on_finish: spindownOnFinish }) }
                >
                    {_("Start maintenance")}
                </Button>
                <Button variant="link" onClick={ onClose }>{_("Cancel")}</Button>
            </ModalFooter>
        </Modal>
    );
};

export const formatEta = (seconds?: number): string | null => {
    if (seconds === undefined)
        return null;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    // eslint-disable-next-line no-template-curly-in-string -- cockpit.format() placeholder syntax, not a template literal
    return cockpit.format(_("${0}m ${1}s remaining"), m, s.toString().padStart(2, '0'));
};

export const ActionsCard = (
    { state, tasks, array }: {
        state?: StateResponse | undefined, tasks?: TasksResponse | undefined, array?: ArrayInfo | undefined
    }
) => {
    const [error, setError] = useState<string | null>(null);
    const [triggering, setTriggering] = useState<Command | null>(null);
    const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
    const [maintaining, setMaintaining] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [togglingHoldOff, setTogglingHoldOff] = useState(false);

    const active = tasks?.active?.[0];
    const pendingCount = tasks?.pending?.length ?? 0;
    const isBusy = !!active || !!state?.active_command;
    const isBadHealth = array?.health === 'failing' || array?.health === 'prefail';

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

    const runMaintenance = (opts: { ignore_thresholds: boolean, spindown_on_finish: boolean }) => {
        setShowMaintenanceDialog(false);
        setError(null);
        setMaintaining(true);
        startMaintenance(opts)
                .catch(err => setError(cockpit.message(err)))
                .finally(() => setMaintaining(false));
    };

    const runRefresh = () => {
        setError(null);
        setRefreshing(true);
        requestRefresh()
                .catch(err => setError(cockpit.message(err)))
                .finally(() => setRefreshing(false));
    };

    const toggleHoldOff = (checked: boolean) => {
        setError(null);
        setTogglingHoldOff(true);
        setHoldOff(checked)
                .catch(err => setError(cockpit.message(err)))
                .finally(() => setTogglingHoldOff(false));
    };

    return (
        <Card>
            <CardTitle>{_("Maintenance")}</CardTitle>
            <CardBody>
                { error && <Alert variant="danger" isInline title={ _("Action failed") }>{ error }</Alert> }

                <Flex className="snapraid-mb-md">
                    <FlexItem>
                        <Button
                            variant="primary"
                            isLoading={ maintaining }
                            isDisabled={ isBusy }
                            onClick={ () => setShowMaintenanceDialog(true) }
                        >
                            {_("Run maintenance")}
                        </Button>
                    </FlexItem>
                    { isBadHealth &&
                        <FlexItem>
                            <Button variant="secondary" isLoading={ refreshing } onClick={ runRefresh }>
                                {_("Refresh array state")}
                            </Button>
                        </FlexItem> }
                </Flex>

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

                <div className="snapraid-mt-md">
                    <Switch
                        id="hold-off"
                        label={ _("Hold off next scheduled maintenance") }
                        isChecked={ !!array?.hold_off }
                        isDisabled={ togglingHoldOff }
                        onChange={ (_ev, checked) => toggleHoldOff(checked) }
                    />
                </div>
            </CardBody>

            { showMaintenanceDialog &&
                <MaintenanceDialog onClose={ () => setShowMaintenanceDialog(false) } onConfirm={ runMaintenance } /> }
        </Card>
    );
};
