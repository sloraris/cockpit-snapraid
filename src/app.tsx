/*
 * SPDX-License-Identifier: LGPL-2.1-or-later
 *
 * Copyright (C) 2017 Red Hat, Inc.
 */

import React, { useState } from 'react';
import { Alert } from "@patternfly/react-core/dist/esm/components/Alert/index.js";
import { Stack, StackItem } from "@patternfly/react-core/dist/esm/layouts/Stack/index.js";

import cockpit from 'cockpit';

import { ActionsCard } from './ActionsCard';
import { ArrayStatusCard } from './ArrayStatusCard';
import { DisksCard } from './DisksCard';
import { HISTORY_INITIAL_LIMIT, HistoryCard } from './HistoryCard';
import { useSnapraidData } from './useSnapraidData';

const _ = cockpit.gettext;

export const Application = () => {
    const [historyLimit, setHistoryLimit] = useState(HISTORY_INITIAL_LIMIT);
    const data = useSnapraidData(historyLimit);

    return (
        <div className="snapraid-page">
            <Stack hasGutter>
                { data.error &&
                    <StackItem>
                        <Alert variant="danger" title={ _("Failed to reach snapraid-daemon") }>
                            { data.error }
                        </Alert>
                    </StackItem> }

                <StackItem>
                    <ArrayStatusCard array={ data.array } />
                </StackItem>

                <StackItem>
                    <ActionsCard state={ data.state } tasks={ data.tasks } />
                </StackItem>

                <StackItem>
                    <DisksCard disks={ data.disks } />
                </StackItem>

                <StackItem>
                    <HistoryCard
                        tasks={ data.tasks }
                        limit={ historyLimit }
                        onShowMore={ () => setHistoryLimit(l => l + HISTORY_INITIAL_LIMIT) }
                    />
                </StackItem>
            </Stack>
        </div>
    );
};
