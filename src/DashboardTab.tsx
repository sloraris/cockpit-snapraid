/*
 * SPDX-License-Identifier: LGPL-2.1-or-later
 */

import React from 'react';
import { Gallery } from "@patternfly/react-core/dist/esm/layouts/Gallery/index.js";

import { ActionsCard } from './ActionsCard';
import { ArrayStatusCard } from './ArrayStatusCard';
import type { ArrayInfo, StateResponse, TasksResponse } from './types';

export const DashboardTab = (
    { array, state, tasks }: {
        array?: ArrayInfo | undefined, state?: StateResponse | undefined, tasks?: TasksResponse | undefined
    }
) => (
    <Gallery hasGutter minWidths={ { default: '100%', md: '480px' } }>
        <ArrayStatusCard array={ array } />
        <ActionsCard state={ state } tasks={ tasks } />
    </Gallery>
);
