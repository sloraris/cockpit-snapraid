/*
 * SPDX-License-Identifier: LGPL-2.1-or-later
 */

import React from 'react';
import { Card, CardBody, CardTitle } from "@patternfly/react-core/dist/esm/components/Card/index.js";
import {
    DescriptionList, DescriptionListDescription, DescriptionListGroup, DescriptionListTerm,
} from "@patternfly/react-core/dist/esm/components/DescriptionList/index.js";
import { EmptyState, EmptyStateBody } from "@patternfly/react-core/dist/esm/components/EmptyState/index.js";
import { Label } from "@patternfly/react-core/dist/esm/components/Label/index.js";
import { Progress } from "@patternfly/react-core/dist/esm/components/Progress/index.js";
import { Spinner } from "@patternfly/react-core/dist/esm/components/Spinner/index.js";

import cockpit from 'cockpit';

import type { SystemInfo } from './types';

const _ = cockpit.gettext;

const formatUptime = (seconds?: number): string => {
    if (seconds === undefined)
        return "—";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    /* eslint-disable no-template-curly-in-string -- cockpit.format() placeholder syntax, not a template literal */
    if (days > 0)
        return cockpit.format(_("${0}d ${1}h"), days, hours);
    if (hours > 0)
        return cockpit.format(_("${0}h ${1}m"), hours, minutes);
    return cockpit.format(_("${0}m"), minutes);
    /* eslint-enable no-template-curly-in-string */
};

export const SystemCard = ({ system }: { system?: SystemInfo | undefined }) => {
    if (!system) {
        return (
            <Card>
                <CardTitle>{_("System")}</CardTitle>
                <CardBody>
                    <EmptyState titleText={ _("Loading system info…") } icon={ Spinner }>
                        <EmptyStateBody />
                    </EmptyState>
                </CardBody>
            </Card>
        );
    }

    const hasMemory = system.memory_total_bytes !== undefined && system.memory_free_bytes !== undefined;
    const usedMemory = hasMemory ? system.memory_total_bytes! - system.memory_free_bytes! : 0;
    const percentUsed = hasMemory && system.memory_total_bytes ? (usedMemory / system.memory_total_bytes * 100) : 0;

    return (
        <Card>
            <CardTitle>{_("System")}</CardTitle>
            <CardBody>
                <DescriptionList isHorizontal isCompact horizontalTermWidthModifier={ { default: '9em' } }>
                    <DescriptionListGroup>
                        <DescriptionListTerm>{_("Uptime")}</DescriptionListTerm>
                        <DescriptionListDescription>{ formatUptime(system.uptime_seconds) }</DescriptionListDescription>
                    </DescriptionListGroup>

                    { hasMemory &&
                        <DescriptionListGroup>
                            <DescriptionListTerm>{_("Memory")}</DescriptionListTerm>
                            <DescriptionListDescription>
                                <Progress
                                    value={ percentUsed }
                                    title={ cockpit.format(_("$0 free of $1"),
                                                           cockpit.format_bytes(system.memory_free_bytes!),
                                                           cockpit.format_bytes(system.memory_total_bytes!)) }
                                    measureLocation="outside"
                                />
                                { system.is_ecc && <Label isCompact className="snapraid-mt-xs">{_("ECC")}</Label> }
                            </DescriptionListDescription>
                        </DescriptionListGroup> }

                    { system.hostname &&
                        <DescriptionListGroup>
                            <DescriptionListTerm>{_("Hostname")}</DescriptionListTerm>
                            <DescriptionListDescription>{ system.hostname }</DescriptionListDescription>
                        </DescriptionListGroup> }

                    { system.os_distribution &&
                        <DescriptionListGroup>
                            <DescriptionListTerm>{_("OS")}</DescriptionListTerm>
                            <DescriptionListDescription>{ system.os_distribution }</DescriptionListDescription>
                        </DescriptionListGroup> }

                    { system.os_kernel_version &&
                        <DescriptionListGroup>
                            <DescriptionListTerm>{_("Kernel")}</DescriptionListTerm>
                            <DescriptionListDescription className="snapraid-mono-sm">{ system.os_kernel_version }</DescriptionListDescription>
                        </DescriptionListGroup> }

                    { system.cpu_model &&
                        <DescriptionListGroup>
                            <DescriptionListTerm>{_("CPU")}</DescriptionListTerm>
                            <DescriptionListDescription className="snapraid-text-sm">{ system.cpu_model }</DescriptionListDescription>
                        </DescriptionListGroup> }

                    { system.motherboard &&
                        <DescriptionListGroup>
                            <DescriptionListTerm>{_("Board")}</DescriptionListTerm>
                            <DescriptionListDescription className="snapraid-text-sm">{ system.motherboard }</DescriptionListDescription>
                        </DescriptionListGroup> }
                </DescriptionList>
            </CardBody>
        </Card>
    );
};
