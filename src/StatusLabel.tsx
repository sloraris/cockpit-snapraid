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

import type { Health, Power, Task } from './types';

const _ = cockpit.gettext;

type LabelStatus = 'success' | 'warning' | 'danger' | 'info';
type LabelColor = 'blue' | 'teal' | 'green' | 'orange' | 'purple' | 'red' | 'orangered' | 'grey' | 'yellow';

// 'corrupt' (silent data errors, fixable from parity) and 'failing' (a disk
// itself is dying) are different problems that both happening to map to
// PatternFly's "danger" status would flatten the distinction; 'corrupt' gets
// its own color instead, matching snapraid-daemon's own UI.
const HEALTH_LABEL: Record<Health, { status: LabelStatus, text: string } | { color: LabelColor, text: string }> = {
    passed: { status: 'success', text: _("Passed") },
    corrupt: { color: 'purple', text: _("Corrupt") },
    prefail: { status: 'warning', text: _("Prefail") },
    failing: { status: 'danger', text: _("Failing") },
    pending: { status: 'info', text: _("Pending") },
};

export const HealthLabel = ({ health, reason, isCompact = false }: { health: Health, reason?: string | undefined, isCompact?: boolean }) => {
    const info = HEALTH_LABEL[health];
    const colorProps = 'status' in info ? { status: info.status } : { color: info.color };
    const label = <Label { ...colorProps } isCompact={ isCompact }>{ info.text }</Label>;
    if (!reason)
        return label;
    return <Tooltip content={reason}>{label}</Tooltip>;
};

export const PowerLabel = ({ power, isCompact = false }: { power: Power, isCompact?: boolean }) => {
    switch (power) {
    case 'active':
        // Blue rather than green: "active" is a power state, not a health
        // verdict, and sharing green with HealthLabel's "passed" makes the
        // two easy to conflate when they're shown side by side.
        return <Label color="blue" isCompact={isCompact}>{_("Active")}</Label>;
    case 'standby':
        return <Label color="grey" icon={<PowerOffIcon />} isCompact={isCompact}>{_("Standby")}</Label>;
    default:
        return <Label color="purple" isCompact={isCompact}>{_("Pending")}</Label>;
    }
};

// In-flight statuses: shown as-is, colored by how noteworthy they are.
const IN_PROGRESS_LABEL: Record<string, { color: LabelColor, icon: React.ReactNode, text: string }> = {
    queued: { color: 'grey', icon: <PendingIcon />, text: _("Queued") },
    starting: { color: 'yellow', icon: <InProgressIcon />, text: _("Starting") },
    processing: { color: 'blue', icon: <InProgressIcon />, text: _("Processing") },
    finalizing: { color: 'purple', icon: <InProgressIcon />, text: _("Finalizing") },
    stopping: { color: 'purple', icon: <PendingIcon />, text: _("Stopping") },
};

// A finished task's raw 'status' only says the process ended without being
// killed — it says nothing about whether the run actually succeeded. Derive
// the same result snapraid-daemon's own UI shows: a clean exit is "Success",
// a 'diff' that found changes (exit code 2) is called out as "Differences"
// rather than an error, and anything else non-zero is "Error".
export const TaskStatusLabel = ({ task, isCompact = false }: { task: Task, isCompact?: boolean }) => {
    if (task.status === 'terminated') {
        if (task.command === 'diff' && task.exit_code === 2)
            return <Label color="yellow" icon={ <ExclamationTriangleIcon /> } isCompact={ isCompact }>{_("Differences")}</Label>;
        if (task.exit_code)
            return <Label color="red" icon={ <TimesCircleIcon /> } isCompact={ isCompact }>{_("Error")}</Label>;
        return <Label color="green" icon={ <CheckCircleIcon /> } isCompact={ isCompact }>{_("Success")}</Label>;
    }
    if (task.status === 'signaled')
        return <Label color="red" icon={ <ExclamationTriangleIcon /> } isCompact={ isCompact }>{_("Signaled")}</Label>;
    if (task.status === 'canceled')
        return <Label color="red" icon={ <TimesCircleIcon /> } isCompact={ isCompact }>{_("Canceled")}</Label>;

    const info = IN_PROGRESS_LABEL[task.status];
    return <Label color={ info.color } icon={ info.icon } isCompact={ isCompact }>{ info.text }</Label>;
};
