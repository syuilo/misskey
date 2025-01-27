/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { ComputedRef, Ref } from 'vue';

type MenuRadioOptionsDef = Record<string, any>;

export type MenuAction = (ev: MouseEvent) => void;

export type MenuDivider = { type: 'divider' };
export type MenuNull = undefined;
export type MenuLabel = { type: 'label', text: string };
export type MenuLink = { type: 'link', to: string, text: string, icon?: string, indicate?: boolean, avatar?: Misskey.entities.User };
export type MenuA = { type: 'a', href: string, target?: string, download?: string, text: string, icon?: string, indicate?: boolean };
export type MenuUser = { type: 'user', user: Misskey.entities.User, active?: boolean, indicate?: boolean, action: MenuAction };
export type MenuSwitch = { type: 'switch', ref: Ref<boolean>, text: string, icon?: string, disabled?: boolean | Ref<boolean> };
export type MenuButton = { type?: 'button', text: string, icon?: string, indicate?: boolean, danger?: boolean, active?: boolean | ComputedRef<boolean>, avatar?: Misskey.entities.User; action: MenuAction };
export type MenuRadio = { type: 'radio', text: string, icon?: string, ref: Ref<MenuRadioOptionsDef[keyof MenuRadioOptionsDef]>, options: MenuRadioOptionsDef, disabled?: boolean | Ref<boolean> };
export type MenuRadioOption = { type: 'radioOption', text: string, action: MenuAction; active?: boolean | ComputedRef<boolean> };
export type MenuParent = { type: 'parent', text: string, icon?: string, children: MenuItem[] | (() => Promise<MenuItem[]> | MenuItem[]) };

export type MenuPending = { type: 'pending' };

type OuterMenuItem = MenuDivider | MenuNull | MenuLabel | MenuLink | MenuA | MenuUser | MenuSwitch | MenuButton | MenuRadio | MenuRadioOption | MenuParent;
type OuterPromiseMenuItem = Promise<MenuLabel | MenuLink | MenuA | MenuUser | MenuSwitch | MenuButton | MenuParent>;
export type MenuItem = OuterMenuItem | OuterPromiseMenuItem;
export type InnerMenuItem = MenuDivider | MenuPending | MenuLabel | MenuLink | MenuA | MenuUser | MenuSwitch | MenuButton | MenuRadio | MenuRadioOption | MenuParent;
