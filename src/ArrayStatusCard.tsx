/*
 * SPDX-License-Identifier: LGPL-2.1-or-later
 */

import React from 'react';
import { Card, CardBody, CardTitle } from "@patternfly/react-core/dist/esm/components/Card/index.js";
import {
    DescriptionList, DescriptionListDescription, DescriptionListGroup, DescriptionListTerm,
} from "@patternfly/react-core/dist/esm/components/DescriptionList/index.js";
import { Flex, FlexItem } from "@patternfly/react-core/dist/esm/layouts/Flex/index.js";
import { Label } from "@patternfly/react-core/dist/esm/components/Label/index.js";
import { EmptyState, EmptyStateBody } from "@patternfly/react-core/dist/esm/components/EmptyState/index.js";
import { Spinner } from "@patternfly/react-core/dist/esm/components/Spinner/index.js";

import cockpit from 'cockpit';
import * as timeformat from 'timeformat';

import { HealthLabel } from './StatusLabel';
import type { ArrayInfo } from './types';

const _ = cockpit.gettext;

const Timestamp = ({ t }: { t?: string | undefined }) => {
    if (!t)
        return <>{_("Never")}</>;
    const d = new Date(t);
    return <span title={ timeformat.dateTimeSeconds(d) }>{ timeformat.distanceToNow(d) }</span>;
};

const DIFF_LABELS: [key: keyof ArrayInfo, label: string][] = [
    ["diff_added", _("added")],
    ["diff_removed", _("removed")],
    ["diff_updated", _("updated")],
    ["diff_moved", _("moved")],
    ["diff_copied", _("copied")],
    ["diff_relocated", _("relocated")],
    ["diff_restored", _("restored")],
];

const PendingChanges = ({ array }: { array: ArrayInfo }) => {
    const parts = DIFF_LABELS
            .map(([key, label]) => [array[key] as number | undefined, label] as const)
            .filter(([count]) => !!count);

    if (parts.length === 0)
        return <>{_("None")}</>;

    return (
        <Flex spaceItems={ { default: 'spaceItemsSm' } }>
            { parts.map(([count, label]) => (
                <FlexItem key={ label }>
                    <Label isCompact color="blue">{ cockpit.format("$0 $1", count, label) }</Label>
                </FlexItem>
            )) }
        </Flex>
    );
};

export const ArrayStatusCard = ({ array }: { array?: ArrayInfo | undefined }) => {
    return (
        <Card>
            <CardTitle>
                <Flex alignItems={ { default: 'alignItemsCenter' } }>
                    <FlexItem>{_("Array status")}</FlexItem>
                    { array && <FlexItem><HealthLabel health={ array.health } reason={ array.health_reason } /></FlexItem> }
                </Flex>
            </CardTitle>
            <CardBody>
                { !array &&
                    <EmptyState titleText={ _("Loading array status…") } icon={ Spinner }>
                        <EmptyStateBody />
                    </EmptyState> }
                { array &&
                    <DescriptionList isHorizontal isCompact>
                        <DescriptionListGroup>
                            <DescriptionListTerm>{_("Disks")}</DescriptionListTerm>
                            <DescriptionListDescription>
                                { cockpit.format(_("$0 data, $1 parity, $2 extra"),
                                                 array.data_disks_count ?? 0,
                                                 array.parity_disks_count ?? 0,
                                                 array.extra_disks_count ?? 0) }
                            </DescriptionListDescription>
                        </DescriptionListGroup>

                        <DescriptionListGroup>
                            <DescriptionListTerm>{_("In sync")}</DescriptionListTerm>
                            <DescriptionListDescription>
                                { !array.blocks_unsynced &&
                                    <Label isCompact status="success">{_("Yes")}</Label> }
                                { !!array.blocks_unsynced &&
                                    <Label isCompact status="warning">
                                        { cockpit.format(_("No, $0 blocks pending"), array.blocks_unsynced) }
                                    </Label> }
                            </DescriptionListDescription>
                        </DescriptionListGroup>

                        <DescriptionListGroup>
                            <DescriptionListTerm>{_("Pending changes")}</DescriptionListTerm>
                            <DescriptionListDescription>
                                <PendingChanges array={ array } />
                            </DescriptionListDescription>
                        </DescriptionListGroup>

                        <DescriptionListGroup>
                            <DescriptionListTerm>{_("Last diff")}</DescriptionListTerm>
                            <DescriptionListDescription><Timestamp t={ array.last_diff_at } /></DescriptionListDescription>
                        </DescriptionListGroup>

                        <DescriptionListGroup>
                            <DescriptionListTerm>{_("Last sync")}</DescriptionListTerm>
                            <DescriptionListDescription><Timestamp t={ array.last_sync_at } /></DescriptionListDescription>
                        </DescriptionListGroup>

                        <DescriptionListGroup>
                            <DescriptionListTerm>{_("Last scrub")}</DescriptionListTerm>
                            <DescriptionListDescription>
                                <Timestamp t={ array.last_scrub_at } />
                                { !!array.blocks_unscrubbed &&
                                    <>
                                        {' '}
                                        <Label isCompact color="blue">
                                            { cockpit.format(_("$0 blocks never scrubbed"), array.blocks_unscrubbed) }
                                        </Label>
                                    </> }
                            </DescriptionListDescription>
                        </DescriptionListGroup>

                        { !!array.blocks_bad &&
                            <DescriptionListGroup>
                                <DescriptionListTerm>{_("Bad blocks")}</DescriptionListTerm>
                                <DescriptionListDescription>
                                    <Label isCompact status="danger">
                                        { cockpit.format(_("$0 blocks corrupt — run heal"), array.blocks_bad) }
                                    </Label>
                                </DescriptionListDescription>
                            </DescriptionListGroup> }

                        <DescriptionListGroup>
                            <DescriptionListTerm>{_("Files tracked")}</DescriptionListTerm>
                            <DescriptionListDescription>{ array.files_count ?? 0 }</DescriptionListDescription>
                        </DescriptionListGroup>

                        { (array.free_space_bytes !== undefined && array.total_space_bytes !== undefined) &&
                            <DescriptionListGroup>
                                <DescriptionListTerm>{_("Data space")}</DescriptionListTerm>
                                <DescriptionListDescription>
                                    { cockpit.format(_("$0 free of $1"),
                                                     cockpit.format_bytes(array.free_space_bytes),
                                                     cockpit.format_bytes(array.total_space_bytes)) }
                                </DescriptionListDescription>
                            </DescriptionListGroup> }

                        <DescriptionListGroup>
                            <DescriptionListTerm>{_("SnapRAID version")}</DescriptionListTerm>
                            <DescriptionListDescription>
                                { cockpit.format(_("daemon $0, engine $1"), array.daemon_version, array.engine_version ?? "?") }
                            </DescriptionListDescription>
                        </DescriptionListGroup>
                    </DescriptionList> }
            </CardBody>
        </Card>
    );
};
