import type { Note, StreamNote, PureRenote } from './entities.js';

export function isPureRenote(note: Note): note is PureRenote {
	return (
		note.renote != null &&
		note.reply == null &&
		note.text == null &&
		note.cw == null &&
		(note.fileIds == null || note.fileIds.length === 0) &&
		note.poll == null
	);
}

export function isStreamNote(note: Note | StreamNote): note is StreamNote {
	return '_allowCached_' in note && typeof note._allowCached_ === 'boolean';
}
