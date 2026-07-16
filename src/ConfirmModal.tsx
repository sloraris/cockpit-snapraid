/*
 * SPDX-License-Identifier: LGPL-2.1-or-later
 */

import React from 'react';
import { Button } from "@patternfly/react-core/dist/esm/components/Button/index.js";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@patternfly/react-core/dist/esm/components/Modal/index.js";

import cockpit from 'cockpit';

const _ = cockpit.gettext;

export const ConfirmModal = (
    { isOpen, title, message, confirmLabel, isBusy, onConfirm, onCancel }: {
        isOpen: boolean, title: string, message: React.ReactNode, confirmLabel: string,
        isBusy: boolean, onConfirm: () => void, onCancel: () => void,
    }
) => (
    <Modal isOpen={ isOpen } onClose={ onCancel } variant="small">
        <ModalHeader title={ title } titleIconVariant="warning" />
        <ModalBody>{ message }</ModalBody>
        <ModalFooter>
            <Button variant="danger" isLoading={ isBusy } onClick={ onConfirm }>{ confirmLabel }</Button>
            <Button variant="link" isDisabled={ isBusy } onClick={ onCancel }>{_("Cancel")}</Button>
        </ModalFooter>
    </Modal>
);
