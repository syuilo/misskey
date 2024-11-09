/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { type App, defineAsyncComponent } from 'vue';

const WidgetProfile = defineAsyncComponent(() => import('@/widgets/WidgetProfile.vue'));
const WidgetInstanceInfo = defineAsyncComponent(() => import('@/widgets/WidgetInstanceInfo.vue'));
const WidgetMemo = defineAsyncComponent(() => import('@/widgets/WidgetMemo.vue'));
const WidgetNotifications = defineAsyncComponent(() => import('@/widgets/WidgetNotifications.vue'));
const WidgetTimeline = defineAsyncComponent(() => import('@/widgets/WidgetTimeline.vue'));
const WidgetCalendar = defineAsyncComponent(() => import('@/widgets/WidgetCalendar.vue'));
const WidgetRss = defineAsyncComponent(() => import('@/widgets/WidgetRss.vue'));
const WidgetRssTicker = defineAsyncComponent(() => import('@/widgets/WidgetRssTicker.vue'));
const WidgetTrends = defineAsyncComponent(() => import('@/widgets/WidgetTrends.vue'));
const WidgetClock = defineAsyncComponent(() => import('@/widgets/WidgetClock.vue'));
const WidgetActivity = defineAsyncComponent(() => import('@/widgets/WidgetActivity.vue'));
const WidgetPhotos = defineAsyncComponent(() => import('@/widgets/WidgetPhotos.vue'));
const WidgetDigitalClock = defineAsyncComponent(() => import('@/widgets/WidgetDigitalClock.vue'));
const WidgetUnixClock = defineAsyncComponent(() => import('@/widgets/WidgetUnixClock.vue'));
const WidgetFederation = defineAsyncComponent(() => import('@/widgets/WidgetFederation.vue'));
const WidgetInstanceCloud = defineAsyncComponent(() => import('@/widgets/WidgetInstanceCloud.vue'));
const WidgetPostForm = defineAsyncComponent(() => import('@/widgets/WidgetPostForm.vue'));
const WidgetSlideshow = defineAsyncComponent(() => import('@/widgets/WidgetSlideshow.vue'));
const WidgetServerMetric = defineAsyncComponent(() => import('@/widgets/server-metric/index.vue'));
const WidgetOnlineUsers = defineAsyncComponent(() => import('@/widgets/WidgetOnlineUsers.vue'));
const WidgetJobQueue = defineAsyncComponent(() => import('@/widgets/WidgetJobQueue.vue'));
const WidgetButton = defineAsyncComponent(() => import('@/widgets/WidgetButton.vue'));
const WidgetAiscript = defineAsyncComponent(() => import('@/widgets/WidgetAiscript.vue'));
const WidgetAiscriptApp = defineAsyncComponent(() => import('@/widgets/WidgetAiscriptApp.vue'));
const WidgetAichan = defineAsyncComponent(() => import('@/widgets/WidgetAichan.vue'));
const WidgetUserList = defineAsyncComponent(() => import('@/widgets/WidgetUserList.vue'));
const WidgetClicker = defineAsyncComponent(() => import('@/widgets/WidgetClicker.vue'));
const WidgetBirthdayFollowings = defineAsyncComponent(() => import('@/widgets/WidgetBirthdayFollowings.vue'));

export default function(app: App) {
	for (const [key, value] of Object.entries(widgets)) {
		app.component(key, value);
	}
}

const widgets = {
	WidgetProfile,
	WidgetInstanceInfo,
	WidgetMemo,
	WidgetNotifications,
	WidgetTimeline,
	WidgetCalendar,
	WidgetRss,
	WidgetRssTicker,
	WidgetTrends,
	WidgetClock,
	WidgetActivity,
	WidgetPhotos,
	WidgetDigitalClock,
	WidgetUnixClock,
	WidgetFederation,
	WidgetInstanceCloud,
	WidgetPostForm,
	WidgetSlideshow,
	WidgetServerMetric,
	WidgetOnlineUsers,
	WidgetJobQueue,
	WidgetButton,
	WidgetAiscript,
	WidgetAiscriptApp,
	WidgetAichan,
	WidgetUserList,
	WidgetClicker,
	WidgetBirthdayFollowings,
} as const;

export const widgetDefs = [
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
	'federation',
	'instanceCloud',
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
] as const;

declare module '@vue/runtime-core' {
	export interface GlobalComponents {
		WidgetProfile: typeof WidgetProfile;
		WidgetInstanceInfo: typeof WidgetInstanceInfo;
		WidgetMemo: typeof WidgetMemo;
		WidgetNotifications: typeof WidgetNotifications;
		WidgetTimeline: typeof WidgetTimeline;
		WidgetCalendar: typeof WidgetCalendar;
		WidgetRss: typeof WidgetRss;
		WidgetRssTicker: typeof WidgetRssTicker;
		WidgetTrends: typeof WidgetTrends;
		WidgetClock: typeof WidgetClock;
		WidgetActivity: typeof WidgetActivity;
		WidgetPhotos: typeof WidgetPhotos;
		WidgetDigitalClock: typeof WidgetDigitalClock;
		WidgetUnixClock: typeof WidgetUnixClock;
		WidgetFederation: typeof WidgetFederation;
		WidgetInstanceCloud: typeof WidgetInstanceCloud;
		WidgetPostForm: typeof WidgetPostForm;
		WidgetSlideshow: typeof WidgetSlideshow;
		WidgetServerMetric: typeof WidgetServerMetric;
		WidgetOnlineUsers: typeof WidgetOnlineUsers;
		WidgetJobQueue: typeof WidgetJobQueue;
		WidgetButton: typeof WidgetButton;
		WidgetAiscript: typeof WidgetAiscript;
		WidgetAiscriptApp: typeof WidgetAiscriptApp;
		WidgetAichan: typeof WidgetAichan;
		WidgetUserList: typeof WidgetUserList;
		WidgetClicker: typeof WidgetClicker;
		WidgetBirthdayFollowings: typeof WidgetBirthdayFollowings;
	}
}
