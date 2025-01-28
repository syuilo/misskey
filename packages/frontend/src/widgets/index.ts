/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAsyncComponent } from 'vue';
import type { App } from 'vue';

export default function(app: App) {
	app.component('WidgetProfile', defineAsyncComponent(() => import('./WidgetProfile.vue')));
	app.component('WidgetInstanceInfo', defineAsyncComponent(() => import('./WidgetInstanceInfo.vue')));
	app.component('WidgetMemo', defineAsyncComponent(() => import('./WidgetMemo.vue')));
	app.component('WidgetNotifications', defineAsyncComponent(() => import('./WidgetNotifications.vue')));
	app.component('WidgetTimeline', defineAsyncComponent(() => import('./WidgetTimeline.vue')));
	app.component('WidgetCalendar', defineAsyncComponent(() => import('./WidgetCalendar.vue')));
	app.component('WidgetRss', defineAsyncComponent(() => import('./WidgetRss.vue')));
	app.component('WidgetRssTicker', defineAsyncComponent(() => import('./WidgetRssTicker.vue')));
	app.component('WidgetTrends', defineAsyncComponent(() => import('./WidgetTrends.vue')));
	app.component('WidgetClock', defineAsyncComponent(() => import('./WidgetClock.vue')));
	app.component('WidgetActivity', defineAsyncComponent(() => import('./WidgetActivity.vue')));
	app.component('WidgetPhotos', defineAsyncComponent(() => import('./WidgetPhotos.vue')));
	app.component('WidgetDigitalClock', defineAsyncComponent(() => import('./WidgetDigitalClock.vue')));
	app.component('WidgetUnixClock', defineAsyncComponent(() => import('./WidgetUnixClock.vue')));
	app.component('WidgetFederation', defineAsyncComponent(() => import('./WidgetFederation.vue')));
	app.component('WidgetPostForm', defineAsyncComponent(() => import('./WidgetPostForm.vue')));
	app.component('WidgetSlideshow', defineAsyncComponent(() => import('./WidgetSlideshow.vue')));
	app.component('WidgetServerMetric', defineAsyncComponent(() => import('./server-metric/index.vue')));
	app.component('WidgetOnlineUsers', defineAsyncComponent(() => import('./WidgetOnlineUsers.vue')));
	app.component('WidgetJobQueue', defineAsyncComponent(() => import('./WidgetJobQueue.vue')));
	app.component('WidgetInstanceCloud', defineAsyncComponent(() => import('./WidgetInstanceCloud.vue')));
	app.component('WidgetButton', defineAsyncComponent(() => import('./WidgetButton.vue')));
	app.component('WidgetAiscript', defineAsyncComponent(() => import('./WidgetAiscript.vue')));
	app.component('WidgetAiscriptApp', defineAsyncComponent(() => import('./WidgetAiscriptApp.vue')));
	app.component('WidgetAichan', defineAsyncComponent(() => import('./WidgetAichan.vue')));
	app.component('WidgetUserList', defineAsyncComponent(() => import('./WidgetUserList.vue')));
	app.component('WidgetClicker', defineAsyncComponent(() => import('./WidgetClicker.vue')));
	app.component('WidgetBirthdayFollowings', defineAsyncComponent(() => import('./WidgetBirthdayFollowings.vue')));
}

// 連合関連のウィジェット（連合無効時に隠す）
export const federationWidgets = [
	'federation',
	'instanceCloud',
];

export const widgets = [
	'profile',
	'instanceInfo',
	'memo',
	'notifications',
	'timeline',
	'calendar',
	'rss',
	'rssTicker',
	'trends',
	'clock',
	'activity',
	'photos',
	'digitalClock',
	'unixClock',
	'postForm',
	'slideshow',
	'serverMetric',
	'onlineUsers',
	'jobQueue',
	'button',
	'aiscript',
	'aiscriptApp',
	'aichan',
	'userList',
	'clicker',
	'birthdayFollowings',

	...federationWidgets,
];
