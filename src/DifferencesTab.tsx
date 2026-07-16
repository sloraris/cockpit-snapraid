/*
 * SPDX-License-Identifier: LGPL-2.1-or-later
 */

import React, { useState } from 'react';
import { Alert } from "@patternfly/react-core/dist/esm/components/Alert/index.js";
import { Button } from "@patternfly/react-core/dist/esm/components/Button/index.js";
import { Card, CardBody, CardTitle } from "@patternfly/react-core/dist/esm/components/Card/index.js";
import { EmptyState, EmptyStateBody } from "@patternfly/react-core/dist/esm/components/EmptyState/index.js";
import { Label } from "@patternfly/react-core/dist/esm/components/Label/index.js";
import { Spinner } from "@patternfly/react-core/dist/esm/components/Spinner/index.js";
import { Flex, FlexItem } from "@patternfly/react-core/dist/esm/layouts/Flex/index.js";
import { Stack, StackItem } from "@patternfly/react-core/dist/esm/layouts/Stack/index.js";

import cockpit from 'cockpit';

import { ListingTable } from 'cockpit-components-table';
import type { ListingTableRowProps } from 'cockpit-components-table';

import { undeleteFiles } from './daemon';
import type { ArrayInfo, Diff } from './types';

const _ = cockpit.gettext;

const DIFF_COLOR: Record<Diff['change'], 'green' | 'red' | 'orange' | 'blue' | 'grey'> = {
    added: 'green',
    removed: 'red',
    updated: 'orange',
    moved: 'blue',
    copied: 'green',
    relocated: 'blue',
    restored: 'green',
};

const DIFF_COUNT_FIELDS: [key: keyof ArrayInfo, label: string][] = [
    ["diff_equal", _("Equal")],
    ["diff_added", _("Added")],
    ["diff_removed", _("Removed")],
    ["diff_updated", _("Updated")],
    ["diff_moved", _("Moved")],
    ["diff_copied", _("Copied")],
    ["diff_relocated", _("Relocated")],
    ["diff_restored", _("Restored")],
];

const UndeleteButton = (
    { path, undeleting, onClick }: { path: string, undeleting: string | null, onClick: (path: string) => void }
) => (
    <Button
        variant="secondary"
        size="sm"
        isLoading={ undeleting === path }
        isDisabled={ !!undeleting }
        onClick={ () => onClick(path) }
    >
        {_("Undelete")}
    </Button>
);

export const DifferencesTab = ({ array }: { array?: ArrayInfo | undefined }) => {
    const [error, setError] = useState<string | null>(null);
    const [undeleting, setUndeleting] = useState<string | null>(null);

    if (!array) {
        return (
            <EmptyState titleText={ _("Loading differences…") } icon={ Spinner }>
                <EmptyStateBody />
            </EmptyState>
        );
    }

    const undeleteOne = (path: string) => {
        setError(null);
        setUndeleting(path);
        undeleteFiles([path])
                .catch(err => setError(cockpit.message(err)))
                .finally(() => setUndeleting(null));
    };

    const diffs = array.diffs ?? [];
    const rows: ListingTableRowProps[] = diffs.map((d, i) => ({
        props: { key: i },
        columns: [
            { title: <Label isCompact color={ DIFF_COLOR[d.change] }>{ d.change }</Label> },
            { title: d.disk },
            { title: d.path },
            {
                title: d.change === 'removed'
                    ? <UndeleteButton path={ d.path } undeleting={ undeleting } onClick={ undeleteOne } />
                    : null,
            },
        ],
    }));

    return (
        <Stack hasGutter>
            { error &&
                <StackItem>
                    <Alert variant="danger" isInline title={ _("Undelete failed") }>{ error }</Alert>
                </StackItem> }

            <StackItem>
                <Card>
                    <CardTitle>{_("Change summary")}</CardTitle>
                    <CardBody>
                        <p className="snapraid-subtle snapraid-mb-md">
                            { _("Changes detected since the last sync. Cleared once the next maintenance cycle completes.") }
                        </p>
                        <Flex spaceItems={ { default: 'spaceItemsSm' } }>
                            { DIFF_COUNT_FIELDS
                                    .map(([key, label]) => [array[key] as number | undefined, label] as const)
                                    .filter(([count]) => !!count)
                                    .map(([count, label]) => (
                                        <FlexItem key={ label }>
                                            <Label isCompact>{ cockpit.format("$0 $1", count, label) }</Label>
                                        </FlexItem>
                                    )) }
                            { diffs.length === 0 && <FlexItem>{_("No changes detected")}</FlexItem> }
                        </Flex>
                    </CardBody>
                </Card>
            </StackItem>

            <StackItem>
                <Card>
                    <CardTitle>{_("Changed files")}</CardTitle>
                    <CardBody>
                        <ListingTable
                            columns={ [_("Change"), _("Disk"), _("Path"), ""] }
                            rows={ rows }
                            emptyCaption={ _("No file changes recorded") }
                            variant="compact"
                        />
                    </CardBody>
                </Card>
            </StackItem>
        </Stack>
    );
};
