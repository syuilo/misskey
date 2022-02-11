export function checkWordMute(note: Record<string, any>, me: Record<string, any> | null | undefined, mutedWords: Array<string | string[]>): boolean {
	// 自分自身
	if (me && (note.userId === me.id)) return false;

	if (mutedWords.length > 0) {
		if (note.text == null) return false;

		const matched = mutedWords.some(filter => {
			if (Array.isArray(filter)) {
				// 後方互換のため
				if (filter.every(keyword => keyword === '')) return false;

				return filter.every(keyword => note.text!.includes(keyword));
			} else {
				// represents RegExp
				const regexp = filter.match(/^\/(.+)\/(.*)$/);

				// This should never happen due to input sanitisation.
				if (!regexp) return false;

				try {
					return new RegExp(regexp[1], regexp[2]).test(note.text!);
				} catch (err) {
					// This should never happen due to input sanitisation.
					return false;
				}
			}
		});

		if (matched) return true;
	}

	return false;
}
