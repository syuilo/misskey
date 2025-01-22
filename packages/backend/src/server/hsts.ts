/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { onRequestHookHandler } from "fastify";

// 6months (15552000sec) by default, 1year (31536000sec) if preload is enabled
export function makeHstsHook(host: string, preload: boolean = false): onRequestHookHandler {
    if (preload) {
        return (request, reply, done) => {
            // we must permanent redirect http to https for preload to be eligible
            // however we do not want to do this if a reverse proxy is detected
            if (
                (request.host === host || request.hostname === host) &&
                (request.headers['x-forwarded-proto'] ?? request.protocol) === 'http') {
                reply.redirect(`https://${request.hostname}${request.url}`, 301);
            } else {
                // 1 year is mandatory for preload
                reply.header('strict-transport-security', 'max-age=31536000; includeSubDomains; preload');
            }
            done();
        };
    } else {
        return (request, reply, done) => {
            reply.header('strict-transport-security', 'max-age=15552000');
            done();
        };
    }
}
