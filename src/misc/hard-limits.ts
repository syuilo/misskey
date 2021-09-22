
// If you change DB_* values, you must also change the DB schema.

/**
 * Maximum note text length that can be stored in DB.
 * Surrogate pairs count as one
 */
export const DB_MAX_NOTE_TEXT_LENGTH = 8192;

/**
 * Maximum image description length that can be stored in DB.
 * Surrogate pairs count as one
 */
export const DB_MAX_IMAGE_COMMENT_LENGTH = 512;
