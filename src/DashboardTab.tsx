/*
 * SPDX-License-Identifier: LGPL-2.1-or-later
 */

import React from 'react';
import { Gallery } from "@patternfly/react-core/dist/esm/layouts/Gallery/index.js";
import { Stack, StackItem } from "@patternfly/react-core/dist/esm/layouts/Stack/index.js";

import { ActionsCard } from './ActionsCard';
import { ActivityCard } from './ActivityCard';
import { ArrayStatusCard } from './ArrayStatusCard';
import { SystemCard } from './SystemCard';
import type { ActivityResponse, ArrayInfo, StateResponse, SystemInfo, TasksResponse } from './types';

export const DashboardTab = (
    { array, state, tasks, system, activity }: {
        array?: ArrayInfo | undefined, state?: StateResponse | undefined, tasks?: TasksResponse | undefined,
        system?: SystemInfo | undefined, activity?: ActivityResponse | undefined
    }
) => (
    <Stack hasGutter>
        <StackItem>
            <ActivityCard activity={ activity } />
        </StackItem>
        <StackItem>
            <Gallery hasGutter minWidths={ { default: '100%', md: '480px' } }>
                <ArrayStatusCard array={ array } />
                <ActionsCard state={ state } tasks={ tasks } array={ array } />
                <SystemCard system={ system } />
            </Gallery>
        </StackItem>
    </Stack>
);
