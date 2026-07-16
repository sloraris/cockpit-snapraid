/*
 * SPDX-License-Identifier: LGPL-2.1-or-later
 */

import React from 'react';
import { Banner } from "@patternfly/react-core/dist/esm/components/Banner/index.js";
import { Flex, FlexItem } from "@patternfly/react-core/dist/esm/layouts/Flex/index.js";

import cockpit from 'cockpit';

import type { ArrayInfo, Health } from './types';

const _ = cockpit.gettext;

const HEALTH_STATUS: Record<Health, 'success' | 'warning' | 'danger' | 'info'> = {
    passed: 'success',
    corrupt: 'danger',
    prefail: 'warning',
    failing: 'danger',
    pending: 'info',
};

const HEALTH_TEXT: Record<Health, string> = {
    passed: _("Array is healthy"),
    corrupt: _("Array has silent data errors"),
    prefail: _("A disk is reporting pre-failure warnings"),
    failing: _("A disk is failing"),
    pending: _("Array health not yet determined"),
};

export const HealthBanner = ({ array }: { array?: ArrayInfo | undefined }) => {
    if (!array)
        return null;

    return (
        <div className="snapraid-health-banner snapraid-mb-md">
            <Banner status={ HEALTH_STATUS[array.health] }>
                <Flex spaceItems={ { default: 'spaceItemsSm' } } justifyContent={ { default: 'justifyContentCenter' } }>
                    <FlexItem>{ HEALTH_TEXT[array.health] }</FlexItem>
                    { array.health_reason && <FlexItem>—</FlexItem> }
                    { array.health_reason && <FlexItem>{ array.health_reason }</FlexItem> }
                </Flex>
            </Banner>
        </div>
    );
};
