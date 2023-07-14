<template>
<div>
	<MkStickyContainer>
		<template #header><XHeader :tabs="headerTabs"/></template>
		<MkSpacer :contentMax="700" :marginMin="16" :marginMax="32">
			<FormSuspense :p="init">
				<div class="_gaps_m">
					<MkInput v-model="name">
						<template #label>{{ i18n.ts.instanceName }}</template>
					</MkInput>

					<MkTextarea v-model="description">
						<template #label>{{ i18n.ts.instanceDescription }}</template>
					</MkTextarea>

					<FormSplit :minWidth="300">
						<MkInput v-model="maintainerName">
							<template #label>{{ i18n.ts.maintainerName }}</template>
						</MkInput>

						<MkInput v-model="maintainerEmail" type="email">
							<template #prefix><i class="ti ti-mail"></i></template>
							<template #label>{{ i18n.ts.maintainerEmail }}</template>
						</MkInput>
					</FormSplit>

					<MkTextarea v-model="pinnedUsers">
						<template #label>{{ i18n.ts.pinnedUsers }}</template>
						<template #caption>{{ i18n.ts.pinnedUsersDescription }}</template>
					</MkTextarea>

					<FormSection>
						<template #label>{{ i18n.ts.files }}</template>

						<div class="_gaps_m">
							<MkSwitch v-model="cacheRemoteFiles">
								<template #label>{{ i18n.ts.cacheRemoteFiles }}</template>
								<template #caption>{{ i18n.ts.cacheRemoteFilesDescription }}</template>
							</MkSwitch>

							<template v-if="cacheRemoteFiles">
								<MkSwitch v-model="cacheRemoteSensitiveFiles">
									<template #label>{{ i18n.ts.cacheRemoteSensitiveFiles }}</template>
									<template #caption>{{ i18n.ts.cacheRemoteSensitiveFilesDescription }}</template>
								</MkSwitch>
							</template>
						</div>
					</FormSection>

					<FormSection>
						<template #label>ServiceWorker</template>

						<div class="_gaps_m">
							<MkSwitch v-model="enableServiceWorker">
								<template #label>{{ i18n.ts.enableServiceworker }}</template>
								<template #caption>{{ i18n.ts.serviceworkerInfo }}</template>
							</MkSwitch>

							<template v-if="enableServiceWorker">
								<MkInput v-model="swPublicKey">
									<template #prefix><i class="ti ti-key"></i></template>
									<template #label>Public key</template>
								</MkInput>

								<MkInput v-model="swPrivateKey">
									<template #prefix><i class="ti ti-key"></i></template>
									<template #label>Private key</template>
								</MkInput>
							</template>
						</div>
					</FormSection>

					<FormSection>
						<template #label>DeepL Translation</template>

						<div class="_gaps_m">
							<MkInput v-model="deeplAuthKey">
								<template #prefix><i class="ti ti-key"></i></template>
								<template #label>DeepL Auth Key</template>
							</MkInput>
							<MkSwitch v-model="deeplIsPro">
								<template #label>Pro account</template>
							</MkSwitch>
						</div>
					</FormSection>
				</div>
			</FormSuspense>
		</MkSpacer>
		<template #footer>
			<div :class="$style.footer">
				<MkSpacer :contentMax="700" :marginMin="16" :marginMax="16">
					<MkButton primary rounded @click="save"><i class="ti ti-check"></i> {{ i18n.ts.save }}</MkButton>
				</MkSpacer>
			</div>
		</template>
	</MkStickyContainer>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';
import XHeader from './_header_.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import FormSection from '@/components/form/section.vue';
import FormSplit from '@/components/form/split.vue';
import FormSuspense from '@/components/form/suspense.vue';
import * as os from '@/os';
import { fetchInstance } from '@/instance';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import MkButton from '@/components/MkButton.vue';

let name: string | null = $ref(null);
let description: string | null = $ref(null);
let maintainerName: string | null = $ref(null);
let maintainerEmail: string | null = $ref(null);
let pinnedUsers: string = $ref('');
let cacheRemoteFiles: boolean = $ref(false);
let cacheRemoteSensitiveFiles: boolean = $ref(false);
let enableServiceWorker: boolean = $ref(false);
let swPublicKey: any = $ref(null);
let swPrivateKey: any = $ref(null);
let deeplAuthKey: string = $ref('');
let deeplIsPro: boolean = $ref(false);

async function init(): Promise<void> {
	const meta = await os.api('admin/meta');
	name = meta.name;
	description = meta.description;
	maintainerName = meta.maintainerName;
	maintainerEmail = meta.maintainerEmail;
	pinnedUsers = meta.pinnedUsers.join('\n');
	cacheRemoteFiles = meta.cacheRemoteFiles;
	cacheRemoteSensitiveFiles = meta.cacheRemoteSensitiveFiles;
	enableServiceWorker = meta.enableServiceWorker;
	swPublicKey = meta.swPublickey;
	swPrivateKey = meta.swPrivateKey;
	deeplAuthKey = meta.deeplAuthKey;
	deeplIsPro = meta.deeplIsPro;
}

function save(): void {
	os.apiWithDialog('admin/update-meta', {
		name,
		description,
		maintainerName,
		maintainerEmail,
		pinnedUsers: pinnedUsers.split('\n'),
		cacheRemoteFiles,
		cacheRemoteSensitiveFiles,
		enableServiceWorker,
		swPublicKey,
		swPrivateKey,
		deeplAuthKey,
		deeplIsPro,
	}).then(() => {
		fetchInstance();
	});
}

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.general,
	icon: 'ti ti-settings',
});
</script>

<style lang="scss" module>
.footer {
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
}
</style>
