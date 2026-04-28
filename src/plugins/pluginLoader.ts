import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { AUTH_KEY } from '~/consts';
import { apiBasePath } from '~/libraries/apiUtils/configuration';
import { SessionStorage } from '~/libraries/storage/storage';
import type {
	ExtensionPointMap,
	ExtensionPointName,
	HeaderBannerContribution,
} from './extensionPoints';
import {
	registerExtension,
	unregisterPluginExtensions,
} from './extensionRegistry';

export interface PluginDescriptor {
	id?: string;
	pluginId?: string;
	exposedModule?: string;
	globalName?: string;
	name?: string;
	remoteEntry?: string;
	remoteEntryUrl?: string;
	remoteName?: string;
	enabled?: boolean;
	status?: 'VALIDATING' | 'ACTIVE' | 'DISABLED' | 'FAILED';
}

export interface RuntimePlugin {
	id?: string;
	extensions?: Partial<{
		[T in ExtensionPointName]: ExtensionPointMap[T][];
	}>;
	register?: (api: PluginRuntimeApi) => void | Promise<void>;
}

export interface PluginRuntimeApi {
	registerExtension: typeof registerExtension;
}

type RemotePluginModule = {
	default?: RuntimePlugin | HeaderBannerContribution['render'];
	plugin?: RuntimePlugin;
	Banner?: HeaderBannerContribution['render'];
	register?: RuntimePlugin['register'];
	extensions?: RuntimePlugin['extensions'];
};

type WebpackRemoteContainer = {
	get: (module: string) => Promise<() => RemotePluginModule>;
	init?: (shareScope: Record<string, unknown>) => void | Promise<void>;
};

const createShareScope = () => ({
	react: {
		'19.2.3': {
			eager: true,
			from: 'openhospital-ui',
			get: () => () => React,
			loaded: true,
		},
	},
	'react-dom': {
		'19.2.3': {
			eager: true,
			from: 'openhospital-ui',
			get: () => () => ReactDOM,
			loaded: true,
		},
	},
});

const shareScope = createShareScope();
const pluginsEndpoint = '/plugins';
const loadedPluginIds = new Set<string>();
const loadingPluginIds = new Set<string>();
const initializedRemoteContainers = new WeakSet<WebpackRemoteContainer>();

const getPluginId = (plugin: PluginDescriptor) => plugin.id ?? plugin.pluginId;

const getPluginGlobalName = (plugin: PluginDescriptor) =>
	plugin.globalName ??
	plugin.remoteName ??
	getPluginId(plugin)?.split('.').at(-1)?.replace(/\W/g, '');

const getPluginExposedModule = (plugin: PluginDescriptor) =>
	plugin.exposedModule ?? './Banner';

const getPluginRemoteEntry = (plugin: PluginDescriptor) =>
	plugin.remoteEntryUrl ??
	plugin.remoteEntry ??
	(plugin.pluginId
		? `/plugins/${plugin.pluginId}/frontend/remoteEntry.js`
		: undefined);

const isAbsoluteUrl = (path: string) => /^https?:\/\//i.test(path);

const getDevelopmentApiUrl = (path: string) => {
	const baseUrl = new URL(apiBasePath);
	const normalizedPath = path.startsWith('/') ? path : `/${path}`;

	return `${baseUrl.pathname.replace(/\/$/, '')}${normalizedPath}`;
};

const resolvePluginDiscoveryUrl = (path: string) => {
	if (import.meta.env.DEV && isAbsoluteUrl(apiBasePath)) {
		return getDevelopmentApiUrl(path);
	}

	return new URL(
		path,
		apiBasePath.endsWith('/') ? apiBasePath : `${apiBasePath}/`,
	).toString();
};

const resolveRemoteEntryUrl = (path: string) => {
	if (isAbsoluteUrl(path)) {
		return path;
	}

	return resolvePluginDiscoveryUrl(path);
};

const fetchPluginDescriptors = async (): Promise<PluginDescriptor[]> => {
	const headers = new Headers({ Accept: 'application/json' });
	const token = SessionStorage.read(AUTH_KEY)?.token;

	if (token) {
		headers.set('Authorization', `Bearer ${token}`);
	}

	const response = await fetch(resolvePluginDiscoveryUrl(pluginsEndpoint), {
		headers,
	});
	if (!response.ok) {
		throw new Error(`Plugin discovery failed with status ${response.status}`);
	}

	return response.json();
};

const getAuthenticationHeaders = () => {
	const headers = new Headers();
	const token = SessionStorage.read(AUTH_KEY)?.token;

	if (token) {
		headers.set('Authorization', `Bearer ${token}`);
	}

	return headers;
};

const hasAuthenticationToken = () =>
	Boolean(SessionStorage.read(AUTH_KEY)?.token);

const toRuntimePlugin = (remoteModule: RemotePluginModule): RuntimePlugin => {
	const banner =
		typeof remoteModule.default === 'function'
			? remoteModule.default
			: remoteModule.Banner;

	if (banner) {
		return {
			extensions: {
				'header.banner': [
					{
						id: 'banner',
						pluginId: 'unknown',
						severity: 'info',
						priority: 0,
						render: banner,
					},
				],
			},
		};
	}

	return (
		(remoteModule.default as RuntimePlugin | undefined) ??
		remoteModule.plugin ?? {
			extensions: remoteModule.extensions,
			register: remoteModule.register,
		}
	);
};

const logPluginDebug = (...args: unknown[]) => {
	if (import.meta.env.DEV) {
		console.debug('[plugins]', ...args);
	}
};

const registerPluginExtensions = (plugin: RuntimePlugin) => {
	let registeredExtensions = 0;

	for (const [point, contributions] of Object.entries(
		plugin.extensions ?? {},
	)) {
		if (!contributions) {
			continue;
		}

		for (const contribution of contributions) {
			registerExtension(
				point as ExtensionPointName,
				contribution as ExtensionPointMap[ExtensionPointName],
			);
			registeredExtensions += 1;
		}
	}

	return registeredExtensions;
};

const importRemotePlugin = async (remoteEntryUrl: string) => {
	try {
		return await import(/* @vite-ignore */ remoteEntryUrl);
	} catch (error) {
		logPluginDebug('Native plugin import failed, retrying with auth fetch', {
			remoteEntryUrl,
			error,
		});
	}

	const response = await fetch(remoteEntryUrl, {
		headers: getAuthenticationHeaders(),
	});

	if (!response.ok) {
		throw new Error(
			`Remote plugin import failed with status ${response.status}`,
		);
	}

	const source = await response.text();
	const sourceUrl = URL.createObjectURL(
		new Blob([source], { type: 'text/javascript' }),
	);

	try {
		return await import(/* @vite-ignore */ sourceUrl);
	} finally {
		URL.revokeObjectURL(sourceUrl);
	}
};

const loadClassicScript = (remoteEntryUrl: string) =>
	new Promise<void>((resolve, reject) => {
		const existingScript = document.querySelector(
			`script[src="${remoteEntryUrl}"]`,
		);

		if (existingScript) {
			resolve();
			return;
		}

		const script = document.createElement('script');
		script.src = remoteEntryUrl;
		script.async = true;
		script.onload = () => resolve();
		script.onerror = () =>
			reject(new Error(`Failed to load plugin script ${remoteEntryUrl}`));
		document.head.appendChild(script);
	});

const loadWebpackRemoteModule = async (
	pluginDescriptor: PluginDescriptor,
	remoteEntryUrl: string,
) => {
	const globalName = getPluginGlobalName(pluginDescriptor);
	if (!globalName) {
		throw new Error('Webpack remote plugin has no globalName');
	}

	await loadClassicScript(remoteEntryUrl);

	const container = (globalThis as Record<string, unknown>)[globalName] as
		| WebpackRemoteContainer
		| undefined;
	if (!container) {
		throw new Error(`Webpack remote container ${globalName} was not found`);
	}

	if (!initializedRemoteContainers.has(container)) {
		await container.init?.(shareScope);
		initializedRemoteContainers.add(container);
	}

	const moduleFactory = await container.get(
		getPluginExposedModule(pluginDescriptor),
	);
	return moduleFactory();
};

const loadPlugin = async (pluginDescriptor: PluginDescriptor) => {
	if (
		pluginDescriptor.enabled === false ||
		(pluginDescriptor.status && pluginDescriptor.status !== 'ACTIVE')
	) {
		logPluginDebug('Skipping inactive plugin', pluginDescriptor);
		return;
	}

	const pluginId = getPluginId(pluginDescriptor);
	if (!pluginId) {
		console.warn('Skipping plugin without pluginId', pluginDescriptor);
		return;
	}

	if (loadedPluginIds.has(pluginId) || loadingPluginIds.has(pluginId)) {
		logPluginDebug(`Skipping already loaded plugin ${pluginId}`);
		return;
	}

	const remoteEntry = getPluginRemoteEntry(pluginDescriptor);
	if (!remoteEntry) {
		console.warn(`Plugin ${pluginId} has no remoteEntry URL`, pluginDescriptor);
		return;
	}

	loadingPluginIds.add(pluginId);

	try {
		const remoteEntryUrl = resolveRemoteEntryUrl(remoteEntry);
		logPluginDebug(`Loading plugin ${pluginId}`, remoteEntryUrl);

		const remoteModule = (await importRemotePlugin(
			remoteEntryUrl,
		)) as RemotePluginModule;
		const webpackRemoteModule =
			Object.keys(remoteModule).length === 0
				? await loadWebpackRemoteModule(pluginDescriptor, remoteEntryUrl)
				: undefined;
		const plugin = toRuntimePlugin(remoteModule);
		const resolvedPlugin = webpackRemoteModule
			? toRuntimePlugin(webpackRemoteModule)
			: plugin;

		if (resolvedPlugin.extensions?.['header.banner']) {
			resolvedPlugin.extensions['header.banner'] = resolvedPlugin.extensions[
				'header.banner'
			]?.map((extension) => ({
				...extension,
				pluginId,
			}));
		}

		const registeredExtensions = registerPluginExtensions(resolvedPlugin);
		await resolvedPlugin.register?.({ registerExtension });

		if (registeredExtensions === 0 && !resolvedPlugin.register) {
			console.warn(
				`Plugin ${pluginId} loaded but did not expose any extensions`,
				resolvedPlugin,
			);
		}

		loadedPluginIds.add(pluginId);
		logPluginDebug(`Loaded plugin ${pluginId}`, {
			registeredExtensions,
			hasRegisterHook: Boolean(resolvedPlugin.register),
			extensionPoints: Object.keys(resolvedPlugin.extensions ?? {}),
		});
	} finally {
		loadingPluginIds.delete(pluginId);
	}
};

export const loadRemotePlugin = async (pluginDescriptor: PluginDescriptor) => {
	await loadPlugin(pluginDescriptor);
};

export const loadRemotePlugins = async () => {
	if (!hasAuthenticationToken()) {
		logPluginDebug('Skipping plugin discovery: no authentication token');
		return;
	}

	try {
		const plugins = await fetchPluginDescriptors();
		logPluginDebug('Discovered plugins', plugins);
		const results = await Promise.allSettled(plugins.map(loadPlugin));

		results.forEach((result, index) => {
			if (result.status === 'rejected') {
				console.warn(
					`Plugin ${getPluginId(plugins[index] ?? {}) ?? index} failed to load`,
					result.reason,
				);
			}
		});
	} catch (error) {
		console.warn('Plugin discovery failed', error);
	}
};

export const unloadRemotePlugin = (pluginId: string) => {
	loadingPluginIds.delete(pluginId);
	loadedPluginIds.delete(pluginId);
	return unregisterPluginExtensions(pluginId);
};

export const reloadRemotePlugins = async () => {
	for (const pluginId of loadedPluginIds) {
		unregisterPluginExtensions(pluginId);
	}

	loadedPluginIds.clear();
	loadingPluginIds.clear();
	await loadRemotePlugins();
};
