/*
 * SPDX-License-Identifier: LGPL-2.1-or-later
 */

import React from 'react';
import { Modal, ModalBody, ModalHeader } from "@patternfly/react-core/dist/esm/components/Modal/index.js";
import { Label } from "@patternfly/react-core/dist/esm/components/Label/index.js";

import cockpit from 'cockpit';

import { ListingTable } from 'cockpit-components-table';
import type { ListingTableRowProps } from 'cockpit-components-table';

import type { Device } from './types';

const _ = cockpit.gettext;

const WHEN_FAILED_COLOR: Record<string, 'green' | 'orange' | 'red'> = {
    never: 'green',
    past: 'orange',
    now: 'red',
};

export const SmartDetailModal = ({ device, onClose }: { device: Device | null, onClose: () => void }) => {
    const attributes = device?.smart?.attributes ?? [];

    const rows: ListingTableRowProps[] = attributes.map(attr => ({
        props: { key: attr.name },
        columns: [
            { title: attr.name },
            { title: attr.type ?? "—" },
            {
                title: attr.when_failed && attr.when_failed !== 'never'
                    ? <Label isCompact color={ WHEN_FAILED_COLOR[attr.when_failed] }>{ attr.when_failed }</Label>
                    : "—",
            },
            { title: attr.raw ?? "—" },
            { title: attr.norm ?? "—" },
            { title: attr.worst ?? "—" },
            { title: attr.thresh ?? "—" },
        ],
    }));

    return (
        <Modal isOpen={ !!device } onClose={ onClose } variant="large">
            <ModalHeader
                title={ device ? cockpit.format(_("SMART attributes — $0"), device.serial ?? device.node) : "" }
            />
            <ModalBody>
                <ListingTable
                    columns={ [_("Attribute"), _("Type"), _("Failed"), _("Raw"), _("Normalized"), _("Worst"), _("Threshold")] }
                    rows={ rows }
                    emptyCaption={ _("No SMART attribute data available") }
                    variant="compact"
                />
            </ModalBody>
        </Modal>
    );
};
