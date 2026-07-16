/*
 * SPDX-License-Identifier: LGPL-2.1-or-later
 *
 * Status badges shared across the SnapRAID cards, using PatternFly Label's
 * built-in status colors/icons to match Cockpit's Storage tab conventions.
 */

import React from 'react';
import { Label } from "@patternfly/react-core/dist/esm/components/Label/index.js";
import { Tooltip } from "@patternfly/react-core/dist/esm/components/Tooltip/index.js";
import CheckCircleIcon from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import ExclamationTriangleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import InProgressIcon from '@patternfly/react-icons/dist/esm/icons/in-progress-icon';
import PendingIcon from '@patternfly/react-icons/dist/esm/icons/pending-icon';
import PowerOffIcon from '@patternfly/react-icons/dist/esm/icons/power-off-icon';
import TimesCircleIcon from '@patternfly/react-icons/dist/esm/icons/times-circle-icon';

import cockpit from 'cockpit';

import type { Health, Power, TaskStatus } from './types';

const _ = cockpit.gettext;

const HEALTH_LABEL: Record<Health, { status: 'success' | 'warning' | 'danger' | 'info', text: string }> = {
    passed: { status: 'success', text: _("Passed") },
    corrupt: { status: 'danger', text: _("Corrupt") },
    prefail: { status: 'warning', text: _("Prefail") },
    failing: { status: 'danger', text: _("Failing") },
    pending: { status: 'info', text: _("Pending") },
};

export const HealthLabel = ({ health, reason, isCompact = false }: { health: Health, reason?: string | undefined, isCompact?: boolean }) => {
    const info = HEALTH_LABEL[health];
    const label = <Label status={info.status} isCompact={isCompact}>{info.text}</Label>;
    if (!reason)
        return label;
    return <Tooltip content={reason}>{label}</Tooltip>;
};

export const PowerLabel = ({ power, isCompact = false }: { power: Power, isCompact?: boolean }) => {
    switch (power) {
    case 'active':
        return <Label color="green" isCompact={isCompact}>{_("Active")}</Label>;
    case 'standby':
        return <Label color="grey" icon={<PowerOffIcon />} isCompact={isCompact}>{_("Standby")}</Label>;
    default:
        return <Label color="blue" isCompact={isCompact}>{_("Pending")}</Label>;
    }
};

const TASK_STATUS_LABEL: Record<TaskStatus, { color: 'grey' | 'blue' | 'orange', icon: React.ReactNode, text: string }> = {
    queued: { color: 'grey', icon: <PendingIcon />, text: _("Queued") },
    starting: { color: 'blue', icon: <InProgressIcon />, text: _("Starting") },
    processing: { color: 'blue', icon: <InProgressIcon />, text: _("Processing") },
    finalizing: { color: 'blue', icon: <InProgressIcon />, text: _("Finalizing") },
    stopping: { color: 'orange', icon: <PendingIcon />, text: _("Stopping") },
    terminated: { color: 'grey', icon: <CheckCircleIcon />, text: _("Terminated") },
    signaled: { color: 'orange', icon: <ExclamationTriangleIcon />, text: _("Signaled") },
    canceled: { color: 'grey', icon: <TimesCircleIcon />, text: _("Canceled") },
};

export const TaskStatusLabel = ({ status, isCompact = false }: { status: TaskStatus, isCompact?: boolean }) => {
    const info = TASK_STATUS_LABEL[status];
    return <Label color={info.color} icon={info.icon} isCompact={isCompact}>{info.text}</Label>;
};
