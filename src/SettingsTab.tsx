/*
 * SPDX-License-Identifier: LGPL-2.1-or-later
 */

import React, { useEffect, useState } from 'react';
import { Alert } from "@patternfly/react-core/dist/esm/components/Alert/index.js";
import { Button } from "@patternfly/react-core/dist/esm/components/Button/index.js";
import { Card, CardBody, CardTitle } from "@patternfly/react-core/dist/esm/components/Card/index.js";
import { EmptyState, EmptyStateBody } from "@patternfly/react-core/dist/esm/components/EmptyState/index.js";
import { Form, FormGroup } from "@patternfly/react-core/dist/esm/components/Form/index.js";
import { FormSelect, FormSelectOption } from "@patternfly/react-core/dist/esm/components/FormSelect/index.js";
import { Spinner } from "@patternfly/react-core/dist/esm/components/Spinner/index.js";
import { Switch } from "@patternfly/react-core/dist/esm/components/Switch/index.js";
import { TextInput } from "@patternfly/react-core/dist/esm/components/TextInput/index.js";
import { Gallery } from "@patternfly/react-core/dist/esm/layouts/Gallery/index.js";
import { Stack, StackItem } from "@patternfly/react-core/dist/esm/layouts/Stack/index.js";

import cockpit from 'cockpit';

import { patchConfig } from './daemon';
import type { Config, LogLevel } from './types';

const _ = cockpit.gettext;

const LOG_LEVELS: LogLevel[] = ['critical', 'error', 'warning', 'info'];

const TextField = (
    { form, field, label, help, disabled = false, onChange }: {
        form: Config, field: keyof Config, label: string, help?: string,
        disabled?: boolean, onChange: (field: keyof Config, value: string) => void
    }
) => (
    <FormGroup label={ label } fieldId={ field }>
        { help && <p className="snapraid-subtle snapraid-text-sm snapraid-mb-xs">{ help }</p> }
        <TextInput
            id={ field }
            value={ (form[field] as string | number | undefined) ?? "" }
            isDisabled={ disabled }
            onChange={ (_ev, v) => onChange(field, v) }
        />
    </FormGroup>
);

const SwitchField = (
    { form, field, label, help, disabled = false, onChange }: {
        form: Config, field: keyof Config, label: string, help?: string,
        disabled?: boolean, onChange: (field: keyof Config, value: boolean) => void
    }
) => (
    <FormGroup fieldId={ field }>
        <Switch
            id={ field }
            label={ label }
            isChecked={ !!form[field] }
            isDisabled={ disabled }
            onChange={ (_ev, checked) => onChange(field, checked) }
        />
        { help && <p className="snapraid-subtle snapraid-text-sm snapraid-mt-xs">{ help }</p> }
    </FormGroup>
);

export const SettingsTab = ({ config }: { config?: Config | undefined }) => {
    const [form, setForm] = useState<Config | null>(null);
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (config && !dirty)
            setForm(config);
    }, [config, dirty]);

    if (!form) {
        return (
            <EmptyState titleText={ _("Loading settings…") } icon={ Spinner }>
                <EmptyStateBody />
            </EmptyState>
        );
    }

    const fullAccess = form.config_full_access !== false;

    const setField = (field: keyof Config, value: string | number | boolean) => {
        setDirty(true);
        setSaved(false);
        setForm(f => (f ? { ...f, [field]: value } : f));
    };

    const save = () => {
        setError(null);
        setSaving(true);
        patchConfig(form)
                .then(() => {
                    setDirty(false);
                    setSaved(true);
                })
                .catch(err => setError(cockpit.message(err)))
                .finally(() => setSaving(false));
    };

    return (
        <Stack hasGutter>
            { !fullAccess &&
                <StackItem>
                    <Alert variant="info" isInline title={ _("Restricted access mode") }>
                        { _("Security-sensitive settings (scripts, commands, users) are read-only because net_config_full_access is disabled. Edit snapraidd.conf manually to change these values.") }
                    </Alert>
                </StackItem> }
            { error &&
                <StackItem>
                    <Alert variant="danger" isInline title={ _("Save failed") }>{ error }</Alert>
                </StackItem> }
            { saved &&
                <StackItem>
                    <Alert variant="success" isInline title={ _("Settings saved") } />
                </StackItem> }

            <StackItem>
                <Gallery hasGutter minWidths={ { default: '100%', md: '360px' } }>
                    <Card>
                        <CardTitle>{_("Automation")}</CardTitle>
                        <CardBody>
                            <Form>
                                <TextField
form={ form } field="maintenance_schedule" label={ _("Maintenance schedule") }
                                           help={ _("HH:MM or '<day> HH:MM'. Empty disables scheduled maintenance.") }
                                           onChange={ setField }
                                />
                                <TextField
form={ form } field="scrub_percentage" label={ _("Scrub percentage") }
                                           help={ _("Percent of the array verified per scheduled scrub. 0 disables scrub.") }
                                           onChange={ setField }
                                />
                                <TextField
form={ form } field="scrub_older_than" label={ _("Scrub older than (days)") }
                                           help={ _("Only scrub blocks not verified within this many days.") }
                                           onChange={ setField }
                                />
                                <SwitchField
form={ form } field="touch_zero_subseconds" label={ _("Touch zero subseconds") }
                                             help={ _("Align timestamps lacking sub-second precision before sync.") }
                                             onChange={ setField }
                                />
                            </Form>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardTitle>{_("Data integrity")}</CardTitle>
                        <CardBody>
                            <Form>
                                <TextField
form={ form } field="sync_threshold_deletes" label={ _("Deletes threshold") }
                                           help={ _("Suspend sync if deletions reach this count. 0 disables.") }
                                           onChange={ setField }
                                />
                                <TextField
form={ form } field="sync_threshold_updates" label={ _("Updates threshold") }
                                           help={ _("Suspend sync if updates reach this count. 0 disables.") }
                                           onChange={ setField }
                                />
                                <SwitchField
form={ form } field="sync_prehash" label={ _("Safety pre-hash") }
                                             help={ _("Pre-calculate hashes before sync to catch silent corruption.") }
                                             onChange={ setField }
                                />
                                <SwitchField
form={ form } field="sync_prevent_truncations" label={ _("Prevent file truncations") }
                                             help={ _("Stop sync if previously non-empty files are now empty.") }
                                             onChange={ setField }
                                />
                            </Form>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardTitle>{_("Monitor")}</CardTitle>
                        <CardBody>
                            <Form>
                                <TextField
form={ form } field="probe_interval_minutes" label={ _("Probe interval (min)") }
                                           help={ _("How often to poll disk power/SMART state. 0 disables.") }
                                           onChange={ setField }
                                />
                                <TextField
form={ form } field="spindown_idle_minutes" label={ _("Spindown timeout (min)") }
                                           help={ _("Idle time before disks are spun down. 0 disables.") }
                                           onChange={ setField }
                                />
                            </Form>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardTitle>{_("Notifications")}</CardTitle>
                        <CardBody>
                            <Form>
                                <SwitchField
form={ form } field="notify_syslog_enabled" label={ _("Enable syslog") }
                                             onChange={ setField }
                                />
                                <FormGroup label={ _("Syslog level") } fieldId="notify_syslog_level">
                                    <FormSelect
                                        id="notify_syslog_level"
                                        value={ form.notify_syslog_level ?? "" }
                                        onChange={ (_ev, v) => setField('notify_syslog_level', v) }
                                    >
                                        { LOG_LEVELS.map(l => <FormSelectOption key={ l } value={ l } label={ l } />) }
                                    </FormSelect>
                                </FormGroup>
                                <SwitchField
form={ form } field="notify_differences" label={ _("Include differences in reports") }
                                             onChange={ setField }
                                />
                                <FormGroup label={ _("Result log level") } fieldId="notify_result_level">
                                    <FormSelect
                                        id="notify_result_level"
                                        value={ form.notify_result_level ?? "" }
                                        isDisabled={ !fullAccess }
                                        onChange={ (_ev, v) => setField('notify_result_level', v) }
                                    >
                                        { LOG_LEVELS.map(l => <FormSelectOption key={ l } value={ l } label={ l } />) }
                                    </FormSelect>
                                </FormGroup>
                                <TextField
form={ form } field="notify_heartbeat" label={ _("Heartbeat command (on success)") }
                                           disabled={ !fullAccess } onChange={ setField }
                                />
                                <TextField
form={ form } field="notify_result" label={ _("Result command") }
                                           disabled={ !fullAccess } onChange={ setField }
                                />
                                <TextField
form={ form } field="notify_run_as_user" label={ _("Run notifications as user") }
                                           disabled={ !fullAccess } onChange={ setField }
                                />
                            </Form>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardTitle>{_("Hook")}</CardTitle>
                        <CardBody>
                            <Form>
                                <TextField
form={ form } field="hook_script" label={ _("Hook script path") }
                                           disabled={ !fullAccess } onChange={ setField }
                                />
                                <TextField
form={ form } field="hook_run_as_user" label={ _("Run hook as user") }
                                           disabled={ !fullAccess } onChange={ setField }
                                />
                            </Form>
                        </CardBody>
                    </Card>
                </Gallery>
            </StackItem>

            <StackItem>
                <Button variant="primary" isLoading={ saving } isDisabled={ !dirty } onClick={ save }>
                    {_("Save settings")}
                </Button>
            </StackItem>
        </Stack>
    );
};
