<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, { _panel: !widgetProps.transparent }]" data-cy-mkw-calendar>
	<div :class="[$style.calendar, { [$style.isHoliday]: isHoliday }]">
		<p :class="$style.monthAndYear">
			<span :class="$style.year">{{ i18n.t('yearX', { year }) }}</span>
			<span :class="$style.month">{{ i18n.t('monthX', { month }) }}</span>
		</p>
		<p v-if="month === 1 && day === 1" class="day">🎉{{ i18n.t('dayX', { day }) }}<span style="display: inline-block; transform: scaleX(-1);">🎉</span></p>
		<p v-else :class="$style.day">{{ i18n.t('dayX', { day }) }}</p>
		<p :class="$style.weekDay">{{ weekDay }}</p>
	</div>
	<div :class="$style.info">
		<div :class="$style.infoSection">
			<p :class="$style.infoText">{{ i18n.ts.today }}<b :class="$style.percentage">{{ dayP.toFixed(1) }}%</b></p>
			<div :class="$style.meter">
				<div :class="$style.meterVal" :style="{ width: `${dayP}%` }"></div>
			</div>
		</div>
		<div :class="$style.infoSection">
			<p :class="$style.infoText">{{ i18n.ts.thisMonth }}<b :class="$style.percentage">{{ monthP.toFixed(1) }}%</b></p>
			<div :class="$style.meter">
				<div :class="$style.meterVal" :style="{ width: `${monthP}%` }"></div>
			</div>
		</div>
		<div :class="$style.infoSection">
			<p :class="$style.infoText">{{ i18n.ts.thisYear }}<b :class="$style.percentage">{{ yearP.toFixed(1) }}%</b></p>
			<div :class="$style.meter">
				<div :class="$style.meterVal" :style="{ width: `${yearP}%` }"></div>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { ref } from 'vue';
import { useWidgetPropsManager, Widget, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget';
import { GetFormResultType } from '@/scripts/form';
import { i18n } from '@/i18n';
import { useInterval } from '@/scripts/use-interval';

const name = 'calendar';

const widgetPropsDef = {
	transparent: {
		type: 'boolean' as const,
		default: false,
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const year = ref(0);
const month = ref(0);
const day = ref(0);
const weekDay = ref('');
const yearP = ref(0);
const monthP = ref(0);
const dayP = ref(0);
const isHoliday = ref(false);
const tick = () => {
	const now = new Date();
	const nd = now.getDate();
	const nm = now.getMonth();
	const ny = now.getFullYear();

	year.value = ny;
	month.value = nm + 1;
	day.value = nd;
	weekDay.value = [
		i18n.ts._weekday.sunday,
		i18n.ts._weekday.monday,
		i18n.ts._weekday.tuesday,
		i18n.ts._weekday.wednesday,
		i18n.ts._weekday.thursday,
		i18n.ts._weekday.friday,
		i18n.ts._weekday.saturday,
	][now.getDay()];

	const dayNumer = now.getTime() - new Date(ny, nm, nd).getTime();
	const dayDenom = 1000/*ms*/ * 60/*s*/ * 60/*m*/ * 24/*h*/;
	const monthNumer = now.getTime() - new Date(ny, nm, 1).getTime();
	const monthDenom = new Date(ny, nm + 1, 1).getTime() - new Date(ny, nm, 1).getTime();
	const yearNumer = now.getTime() - new Date(ny, 0, 1).getTime();
	const yearDenom = new Date(ny + 1, 0, 1).getTime() - new Date(ny, 0, 1).getTime();

	dayP.value = dayNumer / dayDenom * 100;
	monthP.value = monthNumer / monthDenom * 100;
	yearP.value = yearNumer / yearDenom * 100;

	isHoliday.value = now.getDay() === 0 || now.getDay() === 6;
};

useInterval(tick, 1000, {
	immediate: true,
	afterMounted: false,
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.root {
	padding: 16px 0;

	&:after {
		content: "";
		display: block;
		clear: both;
	}
}

.calendar {
	float: left;
	width: 60%;
	text-align: center;

	&.isHoliday {
		> .day {
			color: #ef95a0;
		}
	}
}

.monthAndYear,
.weekDay {
	margin: 0;
	line-height: 18px;
	font-size: 0.9em;
}

.year,
.month {
	margin: 0 4px;
}

.day {
	margin: 10px 0;
	line-height: 32px;
	font-size: 1.75em;
}

.info {
	display: block;
	float: left;
	width: 40%;
	padding: 0 16px 0 0;
	box-sizing: border-box;
}

.infoSection {
	margin-bottom: 8px;

	&:last-child {
		margin-bottom: 4px;
	}

	&:nth-child(1) {
		> .meter > .meterVal {
			background: #f7796c;
		}
	}

	&:nth-child(2) {
		> .meter > .meterVal {
			background: #a1de41;
		}
	}

	&:nth-child(3) {
		> .meter > .meterVal {
			background: #41ddde;
		}
	}
}

.infoText {
	display: flex;
	margin: 0 0 2px 0;
	font-size: 0.75em;
	line-height: 18px;
	opacity: 0.8;
}

.percentage {
	margin-left: auto;
}

.meter {
	width: 100%;
	overflow: hidden;
	background: var(--X11);
	border-radius: 8px;
}

.meterVal {
	height: 4px;
	transition: width .3s cubic-bezier(0.23, 1, 0.32, 1);
}
</style>
