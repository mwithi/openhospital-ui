import { firstValueFrom } from 'rxjs';
import {
	type ExternalConnectionDTO,
	type FieldPermissionDTO,
	type PluginDTO,
	type PluginDTOStatusEnum,
	type PluginInstallProposalDTO,
	PluginsApi,
} from '~/generated';
import { customConfiguration } from '~/libraries/apiUtils/configuration';
import { wrapper } from '~/libraries/apiUtils/wrapper';

const api = new PluginsApi(customConfiguration());

export type PluginStatus =
	| `${PluginDTOStatusEnum}`
	| 'PENDING_APPROVAL'
	| 'REJECTED';

export interface PluginUiContributionDescriptor {
	bundle?: {
		entry?: string;
		remoteName?: string;
	};
	routes?: Array<{
		path?: string;
		label?: string;
		requiredPermission?: string;
	}>;
	slots?: Array<{
		slotId?: string;
		mode?: 'APPEND' | 'PREPEND' | 'REPLACE';
	}>;
}

export type PluginManifest = Partial<
	Omit<PluginInstallProposalDTO, 'fieldPermissions' | 'externalConnections'>
> & {
	pluginId?: string;
	version?: string;
	name?: string;
	description?: string;
	vendor?: string;
	entryPoint?: string;
	minCoreVersion?: string;
	capabilities?: string[];
	permissions?: string[];
	fieldPermissions?: PluginFieldPermissionDescriptor[];
	externalConnections?: PluginExternalConnectionDescriptor[];
	requiresExplicitApproval?: boolean;
	uiContribution?: PluginUiContributionDescriptor;
};

export type PluginFieldPermissionDescriptor = Omit<
	FieldPermissionDTO,
	'access' | 'maxSensitivity'
> & {
	access?: string;
	action?: string;
	maxSensitivity?: string;
	sensitivity?: string;
};

export type PluginExternalConnectionDescriptor = Omit<
	ExternalConnectionDTO,
	'direction'
> & {
	direction?: string;
};

export type InstalledPlugin = Omit<PluginDTO, 'status'> &
	Omit<
		Partial<PluginInstallProposalDTO>,
		'fieldPermissions' | 'externalConnections'
	> & {
		id?: string;
		status?: PluginStatus;
		enabled?: boolean;
		approved?: boolean;
		entryPoint?: string;
		remoteEntry?: string;
		remoteEntryUrl?: string;
		globalName?: string;
		exposedModule?: string;
		updatedAt?: string;
		validationMessages?: string[];
		permissions?: string[];
		fieldPermissions?: PluginFieldPermissionDescriptor[];
		externalConnections?: PluginExternalConnectionDescriptor[];
		manifest?: PluginManifest;
		uiContribution?: PluginUiContributionDescriptor;
	};

const toInstalledPlugin = (
	plugin: PluginDTO | PluginInstallProposalDTO,
): InstalledPlugin => {
	const installedPlugin = plugin as InstalledPlugin;

	return {
		...installedPlugin,
		status: installedPlugin.status ?? 'VALIDATING',
	};
};

export const getPluginId = (plugin: InstalledPlugin) =>
	plugin.pluginId ?? plugin.id ?? plugin.manifest?.pluginId ?? 'unknown';

export const getPluginName = (plugin: InstalledPlugin) =>
	plugin.name ?? plugin.manifest?.name ?? getPluginId(plugin);

export const listPlugins = async () =>
	(await firstValueFrom(wrapper(() => api.listPlugins()))).map(
		toInstalledPlugin,
	);

export const getPlugin = async (pluginId: string) =>
	toInstalledPlugin(
		await firstValueFrom(wrapper(() => api.getPlugin({ pluginId }))),
	);

export const getPluginManifest = async (pluginId: string) =>
	(await firstValueFrom(
		wrapper(() => api.getPluginManifest({ pluginId })),
	)) as PluginManifest;

export const installPlugin = async (file: File) =>
	toInstalledPlugin(
		await firstValueFrom(wrapper(() => api.installPlugin({ file }))),
	);

export const updatePlugin = async (pluginId: string, file: File) =>
	toInstalledPlugin(
		await firstValueFrom(wrapper(() => api.updatePlugin({ pluginId, file }))),
	);

export const approvePlugin = async (pluginId: string) => {
	await firstValueFrom(wrapper(() => api.approvePlugin({ pluginId })));
	return getPlugin(pluginId);
};

export const enablePlugin = async (pluginId: string) => {
	await firstValueFrom(wrapper(() => api.enablePlugin({ pluginId })));
	return getPlugin(pluginId);
};

export const disablePlugin = async (pluginId: string) => {
	await firstValueFrom(wrapper(() => api.disablePlugin({ pluginId })));
	return getPlugin(pluginId);
};

export const uninstallPlugin = (pluginId: string) =>
	firstValueFrom(wrapper(() => api.uninstallPlugin({ pluginId })));
