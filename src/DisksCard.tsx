/*
 * SPDX-License-Identifier: LGPL-2.1-or-later
 */

import React from 'react';
import { Card, CardBody, CardTitle } from "@patternfly/react-core/dist/esm/components/Card/index.js";
import { EmptyState, EmptyStateBody } from "@patternfly/react-core/dist/esm/components/EmptyState/index.js";
import { Spinner } from "@patternfly/react-core/dist/esm/components/Spinner/index.js";

import cockpit from 'cockpit';

import { ListingTable } from 'cockpit-components-table';
import type { ListingTableRowProps } from 'cockpit-components-table';

import { HealthLabel, PowerLabel } from './StatusLabel';
import type { Disk, DisksResponse } from './types';

const _ = cockpit.gettext;

const smartSummary = (disk: Disk): string => {
    const dev = disk.devices.find(d => d.smart);
    if (!dev?.smart)
        return disk.devices.length ? _("No SMART data") : "—";

    const parts = [];
    if (dev.smart.temperature_celsius !== undefined)
        parts.push(cockpit.format(_("$0°C"), dev.smart.temperature_celsius));
    if (dev.smart.power_on_hours !== undefined)
        parts.push(cockpit.format(_("$0 h on"), dev.smart.power_on_hours));
    return parts.length ? parts.join(", ") : "—";
};

const diskRows = (disks: Disk[], role: string): ListingTableRowProps[] => disks.map(disk => ({
    props: { key: `${role}-${disk.name}` },
    columns: [
        { title: disk.name },
        { title: role },
        { title: <HealthLabel health={ disk.health } isCompact /> },
        { title: <PowerLabel power={ disk.power } isCompact /> },
        { title: disk.splits.map(s => s.path).join(", ") },
        { title: smartSummary(disk) },
    ],
}));

export const DisksCard = ({ disks }: { disks?: DisksResponse | undefined }) => {
    const rows = disks
        ? [
            ...diskRows(disks.data_disks, _("Data")),
            ...diskRows(disks.parity_disks, _("Parity")),
            ...diskRows(disks.extra_disks, _("Extra")),
        ]
        : [];

    return (
        <Card>
            <CardTitle>{_("Disks")}</CardTitle>
            <CardBody>
                { !disks &&
                    <EmptyState titleText={ _("Loading disks…") } icon={ Spinner }>
                        <EmptyStateBody />
                    </EmptyState> }
                { disks &&
                    <ListingTable
                        columns={ [_("Disk"), _("Role"), _("Health"), _("Power"), _("Mount"), _("SMART")] }
                        rows={ rows }
                        emptyCaption={ _("No disks reported") }
                        variant="compact"
                    /> }
            </CardBody>
        </Card>
    );
};
