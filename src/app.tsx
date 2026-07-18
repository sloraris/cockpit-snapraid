/*
 * SPDX-License-Identifier: LGPL-2.1-or-later
 *
 * Copyright (C) 2017 Red Hat, Inc.
 */

import React, { useState } from 'react';
import { Alert } from "@patternfly/react-core/dist/esm/components/Alert/index.js";
import { Tab, Tabs, TabTitleText } from "@patternfly/react-core/dist/esm/components/Tabs/index.js";

import cockpit from 'cockpit';

import { DashboardTab } from './DashboardTab';
import { DifferencesTab } from './DifferencesTab';
import { DisksCard } from './DisksCard';
import { HealthBanner } from './HealthBanner';
import { RecoveryTab } from './RecoveryTab';
import { SettingsTab } from './SettingsTab';
import { HISTORY_INITIAL_LIMIT, TasksTab } from './TasksTab';
import { useSnapraidData } from './useSnapraidData';

const _ = cockpit.gettext;

type TabKey = 'dashboard' | 'disks' | 'tasks' | 'differences' | 'recovery' | 'settings';

export const Application = () => {
    const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
    const [historyLimit, setHistoryLimit] = useState(HISTORY_INITIAL_LIMIT);
    const data = useSnapraidData(historyLimit);

    return (
        <div className="snapraid-page">
            <HealthBanner array={ data.array } />
            { data.error &&
            <Alert variant="danger" title={ _("Failed to reach snapraid-daemon") } className="snapraid-mb-md">
                { data.error }
            </Alert> }

            <Tabs
                    activeKey={ activeTab }
                    onSelect={ (_ev, key) => setActiveTab(key as TabKey) }
                    className="snapraid-mb-md"
            >
                <Tab eventKey="dashboard" title={ <TabTitleText>{_("Dashboard")}</TabTitleText> }>
                    <div className="snapraid-mt-md">
                        <DashboardTab
                                array={ data.array } state={ data.state } tasks={ data.tasks }
                                system={ data.system } activity={ data.activity }
                        />
                    </div>
                </Tab>
                <Tab eventKey="disks" title={ <TabTitleText>{_("Disks")}</TabTitleText> }>
                    <div className="snapraid-mt-md">
                        <DisksCard disks={ data.disks } />
                    </div>
                </Tab>
                <Tab eventKey="tasks" title={ <TabTitleText>{_("Tasks")}</TabTitleText> }>
                    <div className="snapraid-mt-md">
                        <TasksTab
                                tasks={ data.tasks }
                                historyLimit={ historyLimit }
                                onHistoryShowMore={ () => setHistoryLimit(l => l + HISTORY_INITIAL_LIMIT) }
                        />
                    </div>
                </Tab>
                <Tab eventKey="differences" title={ <TabTitleText>{_("Differences")}</TabTitleText> }>
                    <div className="snapraid-mt-md">
                        <DifferencesTab array={ data.array } />
                    </div>
                </Tab>
                <Tab eventKey="recovery" title={ <TabTitleText>{_("Recovery")}</TabTitleText> }>
                    <div className="snapraid-mt-md">
                        <RecoveryTab array={ data.array } />
                    </div>
                </Tab>
                <Tab eventKey="settings" title={ <TabTitleText>{_("Settings")}</TabTitleText> }>
                    <div className="snapraid-mt-md">
                        <SettingsTab config={ data.config } />
                    </div>
                </Tab>
            </Tabs>
        </div>
    );
};
