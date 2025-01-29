/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Module } from '@nestjs/common';

import { CoreModule } from '@/core/CoreModule.js';
import * as endpointsObject from './endpoint-list.js';
import { GetterService } from './GetterService.js';
import { ApiLoggerService } from './ApiLoggerService.js';
import type { Provider } from '@nestjs/common';

const endpoints = Object.entries(endpointsObject);
const endpointProviders = endpoints.map(([path, endpoint]): Provider => ({ provide: `ep:${path}`, useClass: endpoint.default }));

@Module({
	imports: [
		CoreModule,
	],
	providers: [
		GetterService,
		ApiLoggerService,
		...endpointProviders,
	],
	exports: [
		...endpointProviders,
	],
})
export class EndpointsModule {}
