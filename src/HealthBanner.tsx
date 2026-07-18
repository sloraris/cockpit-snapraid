/*
 * SPDX-License-Identifier: LGPL-2.1-or-later
 */

import React from 'react';
import { Banner } from "@patternfly/react-core/dist/esm/components/Banner/index.js";
import { Flex, FlexItem } from "@patternfly/react-core/dist/esm/layouts/Flex/index.js";

import cockpit from 'cockpit';

import type { ArrayInfo, Health } from './types';

const _ = cockpit.gettext;

// 'corrupt' (silent data errors, fixable from parity) and 'failing' (a disk
// itself is dying) are different problems; sharing "danger" here would flatten
// that distinction, so 'corrupt' gets its own color, matching HealthLabel and
// snapraid-daemon's own UI.
const HEALTH_BANNER: Record<Health, { status: 'success' | 'warning' | 'danger' | 'info' } | { color: 'purple' }> = {
    passed: { status: 'success' },
    corrupt: { color: 'purple' },
    prefail: { status: 'warning' },
    failing: { status: 'danger' },
    pending: { status: 'info' },
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

    const bannerProps = HEALTH_BANNER[array.health];

    return (
        <div className="snapraid-health-banner snapraid-mb-md">
            <Banner { ...bannerProps }>
                <Flex spaceItems={ { default: 'spaceItemsSm' } } justifyContent={ { default: 'justifyContentCenter' } }>
                    <FlexItem>{ HEALTH_TEXT[array.health] }</FlexItem>
                    { array.health_reason && <FlexItem>—</FlexItem> }
                    { array.health_reason && <FlexItem>{ array.health_reason }</FlexItem> }
                </Flex>
            </Banner>
        </div>
    );
};
