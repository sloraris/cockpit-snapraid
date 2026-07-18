/*
 * SPDX-License-Identifier: LGPL-2.1-or-later
 */

import React, { useState } from 'react';
import { Alert } from "@patternfly/react-core/dist/esm/components/Alert/index.js";
import { Button } from "@patternfly/react-core/dist/esm/components/Button/index.js";
import { Card, CardBody, CardTitle } from "@patternfly/react-core/dist/esm/components/Card/index.js";
import { Checkbox } from "@patternfly/react-core/dist/esm/components/Checkbox/index.js";
import {
    DescriptionList, DescriptionListDescription, DescriptionListGroup, DescriptionListTerm,
} from "@patternfly/react-core/dist/esm/components/DescriptionList/index.js";
import { EmptyState, EmptyStateBody } from "@patternfly/react-core/dist/esm/components/EmptyState/index.js";
import { Label } from "@patternfly/react-core/dist/esm/components/Label/index.js";
import { Spinner } from "@patternfly/react-core/dist/esm/components/Spinner/index.js";
import { TextArea } from "@patternfly/react-core/dist/esm/components/TextArea/index.js";
import { Gallery } from "@patternfly/react-core/dist/esm/layouts/Gallery/index.js";
import { Stack, StackItem } from "@patternfly/react-core/dist/esm/layouts/Stack/index.js";

import cockpit from 'cockpit';

import { ListingTable } from 'cockpit-components-table';
import type { ListingTableRowProps } from 'cockpit-components-table';

import { ConfirmModal } from './ConfirmModal';
import { healArray, undeleteFiles } from './daemon';
import type { ArrayInfo } from './types';

const _ = cockpit.gettext;

export const RecoveryTab = ({ array }: { array?: ArrayInfo | undefined }) => {
    const [error, setError] = useState<string | null>(null);
    const [patterns, setPatterns] = useState("");
    const [undeleting, setUndeleting] = useState(false);
    const [healing, setHealing] = useState(false);
    const [pendingAction, setPendingAction] = useState<'undelete' | 'heal' | null>(null);
    const [spindownOnFinish, setSpindownOnFinish] = useState(false);

    if (!array) {
        return (
            <EmptyState titleText={ _("Loading recovery…") } icon={ Spinner }>
                <EmptyStateBody />
            </EmptyState>
        );
    }

    const filters = patterns.split("\n").map(l => l.trim())
            .filter(Boolean);

    const runUndelete = () => {
        setError(null);
        setUndeleting(true);
        undeleteFiles(filters, { spindown_on_finish: spindownOnFinish })
                .catch(err => setError(cockpit.message(err)))
                .finally(() => {
                    setUndeleting(false);
                    setPendingAction(null);
                });
    };

    const runHeal = () => {
        setError(null);
        setHealing(true);
        healArray({ spindown_on_finish: spindownOnFinish })
                .catch(err => setError(cockpit.message(err)))
                .finally(() => {
                    setHealing(false);
                    setPendingAction(null);
                });
    };

    const fixes = array.fixes ?? [];
    const rows: ListingTableRowProps[] = fixes.map((f, i) => ({
        props: { key: i },
        columns: [
            { title: <Label isCompact status={ f.result === 'recovered' ? 'success' : 'danger' }>{ f.result }</Label> },
            { title: f.disk },
            { title: f.path },
        ],
    }));

    return (
        <Stack hasGutter>
            { error &&
                <StackItem>
                    <Alert variant="danger" isInline title={ _("Recovery action failed") }>{ error }</Alert>
                </StackItem> }

            <StackItem>
                <Checkbox
                    id="recovery-spindown-on-finish"
                    label={ _("Spin down all disks once the task finishes") }
                    isChecked={ spindownOnFinish }
                    onChange={ (_ev, checked) => setSpindownOnFinish(checked) }
                />
            </StackItem>

            <StackItem>
                <Gallery hasGutter minWidths={ { default: '100%', md: '420px' } }>
                    <Card>
                        <CardTitle>{_("Undelete files")}</CardTitle>
                        <CardBody>
                            <p className="snapraid-subtle snapraid-mb-md">
                                { _("Recover accidentally deleted files. Enter file path patterns (e.g. *.mp4), one per line. Leave empty to attempt recovery of all missing files.") }
                            </p>
                            <TextArea
                                value={ patterns }
                                onChange={ (_ev, v) => setPatterns(v) }
                                rows={ 5 }
                                resizeOrientation="vertical"
                                placeholder={ "*.mp4\nfamily_docs/*\nlost_file.txt" }
                                aria-label={ _("Undelete file patterns") }
                                className="snapraid-mb-md"
                            />
                            <Button variant="primary" isLoading={ undeleting } onClick={ () => setPendingAction('undelete') }>
                                {_("Undelete files")}
                            </Button>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardTitle>{_("Silent data errors")}</CardTitle>
                        <CardBody>
                            <p className="snapraid-subtle snapraid-mb-md">
                                { _("Detect and heal silent data corruption using parity information.") }
                            </p>
                            <DescriptionList isCompact isHorizontal className="snapraid-mb-md">
                                <DescriptionListGroup>
                                    <DescriptionListTerm>{_("Bad blocks")}</DescriptionListTerm>
                                    <DescriptionListDescription>
                                        <Label isCompact status={ array.blocks_bad ? 'danger' : 'success' }>
                                            { array.blocks_bad ?? 0 }
                                        </Label>
                                    </DescriptionListDescription>
                                </DescriptionListGroup>
                            </DescriptionList>
                            <Button
                                variant="danger"
                                isLoading={ healing }
                                isDisabled={ !array.blocks_bad }
                                onClick={ () => setPendingAction('heal') }
                            >
                                {_("Heal silent errors")}
                            </Button>
                            { !array.blocks_bad &&
                                <p className="snapraid-subtle snapraid-text-sm snapraid-mt-sm">
                                    { _("No silent errors detected.") }
                                </p> }
                        </CardBody>
                    </Card>
                </Gallery>
            </StackItem>

            <StackItem>
                <Card>
                    <CardTitle>{_("Recovery summary")}</CardTitle>
                    <CardBody>
                        <Label isCompact status="success" className="snapraid-mr-sm">
                            { cockpit.format(_("$0 recovered"), array.fix_recovered ?? 0) }
                        </Label>
                        { !!array.fix_unrecoverable &&
                            <Label isCompact status="danger" className="snapraid-mb-md">
                                { cockpit.format(_("$0 unrecoverable"), array.fix_unrecoverable) }
                            </Label> }
                        <ListingTable
                            columns={ [_("Result"), _("Disk"), _("Path")] }
                            rows={ rows }
                            emptyCaption={ _("No recovery history") }
                            variant="compact"
                        />
                    </CardBody>
                </Card>
            </StackItem>

            <ConfirmModal
                isOpen={ pendingAction === 'undelete' }
                title={ _("Undelete files?") }
                confirmLabel={ _("Undelete") }
                isBusy={ undeleting }
                onConfirm={ runUndelete }
                onCancel={ () => setPendingAction(null) }
                message={ filters.length
                    ? cockpit.format(_("This will attempt to recover files matching: $0"), filters.join(", "))
                    : _("No patterns entered — this will attempt to recover every missing file across the entire array.") }
            />

            <ConfirmModal
                isOpen={ pendingAction === 'heal' }
                title={ _("Heal silent errors?") }
                confirmLabel={ _("Heal") }
                isBusy={ healing }
                onConfirm={ runHeal }
                onCancel={ () => setPendingAction(null) }
                message={ cockpit.format(
                    _("This will rewrite $0 corrupt block(s) on the data disks using parity. This cannot be undone."),
                    array.blocks_bad ?? 0
                ) }
            />
        </Stack>
    );
};
