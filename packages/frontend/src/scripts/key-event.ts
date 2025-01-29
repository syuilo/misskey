/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * {@link KeyboardEvent.code} の値を表す文字列。不足分は適宜追加する
 * @see https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_code_values
 */
export type KeyCode =
	| 'Backspace'
	| 'Tab'
	| 'Enter'
	| 'Shift'
	| 'Control'
	| 'Alt'
	| 'Pause'
	| 'CapsLock'
	| 'Escape'
	| 'Space'
	| 'PageUp'
	| 'PageDown'
	| 'End'
	| 'Home'
	| 'ArrowLeft'
	| 'ArrowUp'
	| 'ArrowRight'
	| 'ArrowDown'
	| 'Insert'
	| 'Delete'
	| 'Digit0'
	| 'Digit1'
	| 'Digit2'
	| 'Digit3'
	| 'Digit4'
	| 'Digit5'
	| 'Digit6'
	| 'Digit7'
	| 'Digit8'
	| 'Digit9'
	| 'KeyA'
	| 'KeyB'
	| 'KeyC'
	| 'KeyD'
	| 'KeyE'
	| 'KeyF'
	| 'KeyG'
	| 'KeyH'
	| 'KeyI'
	| 'KeyJ'
	| 'KeyK'
	| 'KeyL'
	| 'KeyM'
	| 'KeyN'
	| 'KeyO'
	| 'KeyP'
	| 'KeyQ'
	| 'KeyR'
	| 'KeyS'
	| 'KeyT'
	| 'KeyU'
	| 'KeyV'
	| 'KeyW'
	| 'KeyX'
	| 'KeyY'
	| 'KeyZ'
	| 'MetaLeft'
	| 'MetaRight'
	| 'ContextMenu'
	| 'F1'
	| 'F2'
	| 'F3'
	| 'F4'
	| 'F5'
	| 'F6'
	| 'F7'
	| 'F8'
	| 'F9'
	| 'F10'
	| 'F11'
	| 'F12'
	| 'NumLock'
	| 'ScrollLock'
	| 'Semicolon'
	| 'Equal'
	| 'Comma'
	| 'Minus'
	| 'Period'
	| 'Slash'
	| 'Backquote'
	| 'BracketLeft'
	| 'Backslash'
	| 'BracketRight'
	| 'Quote'
	| 'Meta'
	| 'AltGraph'
	;

/**
 * 修飾キーを表す文字列。不足分は適宜追加する。
 */
export type KeyModifier =
	| 'Shift'
	| 'Control'
	| 'Alt'
	| 'Meta'
	;

/**
 * 押下されたキー以外の状態を表す文字列。不足分は適宜追加する。
 */
export type KeyState =
	| 'composing'
	| 'repeat'
	;

export type KeyEventHandler = {
	modifiers?: KeyModifier[];
	states?: KeyState[];
	code: KeyCode | 'any';
	handler: (event: KeyboardEvent) => void;
}

export function handleKeyEvent(event: KeyboardEvent, handlers: KeyEventHandler[]) {
	function checkModifier(ev: KeyboardEvent, modifiers? : KeyModifier[]) {
		if (modifiers) {
			return modifiers.every(modifier => ev.getModifierState(modifier));
		}
		return true;
	}

	function checkState(ev: KeyboardEvent, states?: KeyState[]) {
		if (states) {
			return states.every(state => ev.getModifierState(state));
		}
		return true;
	}

	let hit = false;
	for (const handler of handlers.filter(it => it.code === event.code)) {
		if (checkModifier(event, handler.modifiers) && checkState(event, handler.states)) {
			handler.handler(event);
			hit = true;
			break;
		}
	}

	if (!hit) {
		for (const handler of handlers.filter(it => it.code === 'any')) {
			handler.handler(event);
		}
	}
}
