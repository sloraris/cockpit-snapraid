/*
 * SPDX-License-Identifier: LGPL-2.1-or-later
 */

import React, { useState } from 'react';
import { Alert } from "@patternfly/react-core/dist/esm/components/Alert/index.js";
import { Button } from "@patternfly/react-core/dist/esm/components/Button/index.js";
import { Card, CardBody, CardTitle } from "@patternfly/react-core/dist/esm/components/Card/index.js";
import { EmptyState, EmptyStateBody } from "@patternfly/react-core/dist/esm/components/EmptyState/index.js";
import { Spinner } from "@patternfly/react-core/dist/esm/components/Spinner/index.js";
import { Progress } from "@patternfly/react-core/dist/esm/components/Progress/index.js";
import { Label } from "@patternfly/react-core/dist/esm/components/Label/index.js";
import { Flex, FlexItem } from "@patternfly/react-core/dist/esm/layouts/Flex/index.js";
import { Gallery } from "@patternfly/react-core/dist/esm/layouts/Gallery/index.js";
import CheckCircleIcon from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';

import cockpit from 'cockpit';

import { scheduleCommands } from './daemon';
import { HealthLabel, PowerLabel } from './StatusLabel';
import { SmartDetailModal } from './SmartDetailModal';
import { TempSparkline } from './TempSparkline';
import type { Device, Disk, DisksResponse } from './types';

const _ = cockpit.gettext;

const tempColor = (temp?: number): string | undefined => {
    if (temp === undefined)
        return undefined;
    if (temp >= 50)
        return 'var(--pf-t--global--text--color--status--danger--default)';
    if (temp >= 40)
        return 'var(--pf-t--global--text--color--status--warning--default)';
    return undefined;
};

// timeformat's distanceToNow() spells out "less than a minute ago", which is
// by far the longest string it produces and stands out awkwardly next to
// "9h ago"-style results. Use a terser scale for this compact context.
/* eslint-disable no-template-curly-in-string -- cockpit.format() placeholder syntax, not a template literal */
const formatCompactAgo = (date: Date): string => {
    const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
    if (seconds < 60)
        return _("just now");
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60)
        return cockpit.format(_("${0}m ago"), minutes);
    const hours = Math.floor(minutes / 60);
    if (hours < 24)
        return cockpit.format(_("${0}h ago"), hours);
    return cockpit.format(_("${0}d ago"), Math.floor(hours / 24));
};
/* eslint-enable no-template-curly-in-string */

// A bold colored pill for every device's SMART status, when the overwhelming
// majority read "passed", just reads as visual noise. Only flag it with a
// pill when there's something worth noticing; a clean pass gets a quiet
// check mark instead, still clickable through to the full attribute list.
const SmartStatus = ({ device, onClick }: { device: Device, onClick: () => void }) => {
    const smart = device.smart;

    if (smart?.failing)
        return <Label isCompact status="danger" onClick={ onClick } style={ { cursor: 'pointer' } }>{_("SMART failing")}</Label>;
    if (smart?.prefail)
        return <Label isCompact status="warning" onClick={ onClick } style={ { cursor: 'pointer' } }>{_("SMART prefail")}</Label>;

    if (!smart?.measured_at)
        return <Label isCompact status="info" onClick={ onClick } style={ { cursor: 'pointer' } }>{_("SMART pending")}</Label>;

    const notes = [];
    if (smart.prefail_logged)
        notes.push(_("prefail logged"));
    if (smart.error_logged)
        notes.push(_("error logged"));
    if (smart.selftest_error_logged)
        notes.push(_("self-test error logged"));

    if (notes.length) {
        return (
            <Label isCompact status="warning" onClick={ onClick } style={ { cursor: 'pointer' } }>
                { cockpit.format(_("SMART passed ($0)"), notes.join(", ")) }
            </Label>
        );
    }

    return (
        <span
            className="snapraid-quiet-status snapraid-text-sm"
            role="button"
            tabIndex={ 0 }
            onClick={ onClick }
            onKeyDown={ ev => { if (ev.key === 'Enter' || ev.key === ' ') onClick(); } }
        >
            <CheckCircleIcon className="snapraid-icon-success" /> {_("SMART passed")}
        </span>
    );
};

const DeviceRow = ({ device, onShowSmart }: { device: Device, onShowSmart: (d: Device) => void }) => {
    const smart = device.smart;
    const powerOnYears = smart?.power_on_hours ? (smart.power_on_hours / (24 * 365)).toFixed(1) : undefined;

    let interfaceLabel = device.interface ?? "";
    if (interfaceLabel === 'SATA' && device.rotational !== undefined)
        interfaceLabel = device.rotational >= 1 ? 'HDD' : 'SSD';

    return (
        <div className="snapraid-device-row">
            <Flex justifyContent={ { default: 'justifyContentSpaceBetween' } } alignItems={ { default: 'alignItemsCenter' } }>
                <FlexItem>
                    <strong>{ device.serial ?? device.node }</strong>
                    <div className="snapraid-text-sm snapraid-subtle">
                        { [interfaceLabel, device.model].filter(Boolean).join(" ") }
                        { /* eslint-disable-next-line no-template-curly-in-string -- cockpit.format() placeholder syntax */ }
                        { powerOnYears && cockpit.format(_(" · ${0}y on"), powerOnYears) }
                    </div>
                </FlexItem>
                <FlexItem>
                    <Flex spaceItems={ { default: 'spaceItemsSm' } }>
                        <FlexItem><PowerLabel power={ device.power } isCompact /></FlexItem>
                        { device.health !== 'passed' &&
                            <FlexItem><HealthLabel health={ device.health } isCompact /></FlexItem> }
                    </Flex>
                </FlexItem>
            </Flex>

            { smart?.temperature_celsius !== undefined &&
                <div className="snapraid-mt-xs">
                    <div>
                        <span style={ { color: tempColor(smart.temperature_celsius) } }>
                            { cockpit.format(_("$0°C"), smart.temperature_celsius) }
                        </span>
                        { smart.measured_at &&
                            <span className="snapraid-subtle snapraid-text-sm">
                                { ' ' }({ formatCompactAgo(new Date(smart.measured_at)) })
                            </span> }
                    </div>
                    { device.temp_history_24h &&
                        <TempSparkline history={ device.temp_history_24h } /> }
                </div> }

            { (device.failure_probability !== undefined || device.wear_level !== undefined) &&
                <div className="snapraid-text-sm snapraid-subtle">
                    { device.failure_probability !== undefined
                        ? cockpit.format(_("$0% failure probability / year"), (device.failure_probability * 100).toFixed(0))
                        : cockpit.format(_("$0% wear"), device.wear_level) }
                </div> }

            <div className="snapraid-mt-xs">
                <SmartStatus device={ device } onClick={ () => onShowSmart(device) } />
            </div>
        </div>
    );
};

const DiskCard = ({ disk, role, onShowSmart }: { disk: Disk, role: string, onShowSmart: (d: Device) => void }) => {
    const hasUsage = disk.total_space_bytes !== undefined && disk.free_space_bytes !== undefined;
    const usedSpace = hasUsage ? (disk.total_space_bytes! - disk.free_space_bytes!) : 0;
    const percentUsed = hasUsage && disk.total_space_bytes ? (usedSpace / disk.total_space_bytes * 100) : 0;

    return (
        <Card className="snapraid-disk-card">
            <CardTitle>
                <Flex justifyContent={ { default: 'justifyContentSpaceBetween' } } alignItems={ { default: 'alignItemsCenter' } }>
                    <FlexItem>{ disk.name }<span className="snapraid-subtle snapraid-text-sm"> · { role }</span></FlexItem>
                    <FlexItem className="snapraid-card-title-badge"><HealthLabel health={ disk.health } isCompact /></FlexItem>
                </Flex>
            </CardTitle>
            <CardBody>
                { hasUsage &&
                    <Progress
                        value={ percentUsed }
                        title={ cockpit.format(_("$0 free of $1"),
                                               cockpit.format_bytes(disk.free_space_bytes!),
                                               cockpit.format_bytes(disk.total_space_bytes!)) }
                        measureLocation="outside"
                        className="snapraid-mb-sm"
                    /> }

                { !!disk.error_data &&
                    <Label isCompact status="danger" className="snapraid-mb-xs">
                        { cockpit.format(_("$0 silent data errors"), disk.error_data) }
                    </Label> }
                { !!disk.error_io &&
                    <Label isCompact status="warning" className="snapraid-mb-xs">
                        { cockpit.format(_("$0 I/O errors"), disk.error_io) }
                    </Label> }

                { disk.devices.length === 0 &&
                    <p className="snapraid-subtle snapraid-text-sm">{ disk.splits.map(s => s.path).join(", ") }</p> }

                { disk.devices.map(device => (
                    <DeviceRow key={ device.node } device={ device } onShowSmart={ onShowSmart } />
                )) }
            </CardBody>
        </Card>
    );
};

export const DisksCard = ({ disks }: { disks?: DisksResponse | undefined }) => {
    const [smartDevice, setSmartDevice] = useState<Device | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [spinning, setSpinning] = useState<'up' | 'down' | null>(null);

    const spin = (direction: 'up' | 'down') => {
        setError(null);
        setSpinning(direction);
        scheduleCommands([direction])
                .catch(err => setError(cockpit.message(err)))
                .finally(() => setSpinning(null));
    };

    return (
        <Card>
            <CardTitle>
                <Flex justifyContent={ { default: 'justifyContentSpaceBetween' } } alignItems={ { default: 'alignItemsCenter' } }>
                    <FlexItem>{_("Disks")}</FlexItem>
                    <FlexItem>
                        <Flex spaceItems={ { default: 'spaceItemsSm' } }>
                            <FlexItem>
                                <Button
                                    variant="secondary" size="sm"
                                    isLoading={ spinning === 'up' } isDisabled={ !!spinning }
                                    onClick={ () => spin('up') }
                                >
                                    {_("Spin up")}
                                </Button>
                            </FlexItem>
                            <FlexItem>
                                <Button
                                    variant="secondary" size="sm"
                                    isLoading={ spinning === 'down' } isDisabled={ !!spinning }
                                    onClick={ () => spin('down') }
                                >
                                    {_("Spin down")}
                                </Button>
                            </FlexItem>
                        </Flex>
                    </FlexItem>
                </Flex>
            </CardTitle>
            <CardBody>
                { error && <Alert variant="danger" isInline title={ _("Action failed") } className="snapraid-mb-md">{ error }</Alert> }
                { !disks &&
                    <EmptyState titleText={ _("Loading disks…") } icon={ Spinner }>
                        <EmptyStateBody />
                    </EmptyState> }
                { disks &&
                    <Gallery hasGutter minWidths={ { default: '100%', md: '360px' } }>
                        { disks.data_disks.map(disk => (
                            <DiskCard key={ disk.name } disk={ disk } role={ _("data") } onShowSmart={ setSmartDevice } />
                        )) }
                        { disks.parity_disks.map(disk => (
                            <DiskCard key={ disk.name } disk={ disk } role={ _("parity") } onShowSmart={ setSmartDevice } />
                        )) }
                        { disks.extra_disks.map(disk => (
                            <DiskCard key={ disk.name } disk={ disk } role={ _("extra") } onShowSmart={ setSmartDevice } />
                        )) }
                    </Gallery> }
            </CardBody>
            <SmartDetailModal device={ smartDevice } onClose={ () => setSmartDevice(null) } />
        </Card>
    );
};
