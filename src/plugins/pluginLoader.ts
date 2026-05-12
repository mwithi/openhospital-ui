import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { AUTH_KEY } from '~/consts';
import { apiBasePath } from '~/libraries/apiUtils/configuration';
import { SessionStorage } from '~/libraries/storage/storage';
import type {
	ExtensionPointMap,
	ExtensionPointName,
	HeaderBannerContribution,
	HeaderBannerRenderProps,
} from './extensionPoints';
import {
	registerExtension,
	unregisterPluginExtensions,
} from './extensionRegistry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SlotContribution {
	slotId: string;
	mode: 'APPEND' | 'PREPEND' | 'REPLACE';
	exposedModule: string;
}

export interface BundleDescriptor {
	entry?: string;
	remoteName?: string;
}

export interface UiContribution {
	bundle?: BundleDescriptor;
	slots?: SlotContribution[];
}

export interface PluginDescriptor {
	id?: string;
	pluginId?: string;
	version?: string;
	globalName?: string;
	name?: string;
	remoteEntry?: string;
	remoteEntryUrl?: string;
	remoteName?: string;
	enabled?: boolean;
	status?: 'VALIDATING' | 'ACTIVE' | 'DISABLED' | 'FAILED';
	updatedAt?: string;
	uiContribution?: UiContribution; // ← populated by GET /plugins via PluginDTO
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

type SlotModuleExport =
	| RemotePluginModule
	| HeaderBannerContribution
	| React.ComponentType<HeaderBannerRenderProps>;

// ---------------------------------------------------------------------------
// Share scope
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const pluginsEndpoint = '/plugins';
const loadedPluginIds = new Set<string>();
const loadingPluginIds = new Set<string>();
const initializedRemoteContainers = new WeakSet<WebpackRemoteContainer>();

// ---------------------------------------------------------------------------
// Helpers — plugin descriptor resolution
// ---------------------------------------------------------------------------

const getPluginId = (plugin: PluginDescriptor) => plugin.id ?? plugin.pluginId;

/**
 * Resolves the webpack global container name.
 * Priority: explicit globalName → explicit remoteName → uiContribution.bundle.remoteName → last segment of pluginId
 */
const getPluginGlobalName = (plugin: PluginDescriptor) =>
	plugin.globalName ??
	plugin.remoteName ??
	plugin.uiContribution?.bundle?.remoteName ??
	getPluginId(plugin)?.split('.').at(-1)?.replace(/\W/g, '');

/**
 * Resolves the remoteEntry.js URL.
 * Priority: explicit remoteEntryUrl → explicit remoteEntry → default API path.
 *
 * uiContribution.bundle.entry describes a declared frontend bundle, but it is
 * not reliable as the Module Federation remoteEntry location.
 */
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

const resolveRemoteEntryUrl = (path: string) =>
	isAbsoluteUrl(path) ? path : resolvePluginDiscoveryUrl(path);

const getRemoteEntryCacheToken = (plugin: PluginDescriptor) =>
	encodeURIComponent(
		plugin.updatedAt ?? `${plugin.version ?? 'unknown'}-${Date.now()}`,
	);

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

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

const hasAuthenticationToken = () =>
	Boolean(SessionStorage.read(AUTH_KEY)?.token);

// ---------------------------------------------------------------------------
// Module loading
// ---------------------------------------------------------------------------

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
		if (!contributions) continue;
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

const isHeaderBannerContribution = (
	value: unknown,
): value is HeaderBannerContribution =>
	Boolean(
		value &&
			typeof value === 'object' &&
			typeof (value as HeaderBannerContribution).render === 'function',
	);

const toHeaderBannerContribution = (
	slotId: string,
	exposedModule: string,
	pluginId: string,
	moduleExport: unknown,
): HeaderBannerContribution | undefined => {
	const candidate =
		moduleExport &&
		typeof moduleExport === 'object' &&
		'default' in moduleExport
			? (moduleExport as { default?: unknown }).default
			: moduleExport;

	if (isHeaderBannerContribution(candidate)) {
		return {
			...candidate,
			pluginId,
		};
	}

	if (candidate && typeof candidate === 'function') {
		const Component = candidate as React.ComponentType<HeaderBannerRenderProps>;
		return {
			id: exposedModule.replace(/^\.\//, '').replace(/\W/g, '-') || slotId,
			pluginId,
			severity: 'info',
			priority: 0,
			render: (props) => React.createElement(Component, props),
		};
	}

	return undefined;
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

/**
 * Loads a plugin via webpack Module Federation.
 *
 * If the plugin declares uiContribution.slots, loads each slot's component
 * using the exposedModule name from the manifest and registers it as an extension.
 *
 * If no slots are declared, falls back to toRuntimePlugin (legacy path).
 */
const loadWebpackRemoteModule = async (
	pluginDescriptor: PluginDescriptor,
	remoteEntryUrl: string,
): Promise<RuntimePlugin> => {
	const globalName = getPluginGlobalName(pluginDescriptor);
	if (!globalName) {
		throw new Error('Webpack remote plugin has no globalName');
	}

	await loadClassicScript(remoteEntryUrl);

	// Container is registered synchronously by the remoteEntry.js script,
	// but add a small retry in case of timing issues.
	let container: WebpackRemoteContainer | undefined;
	for (let i = 0; i < 5; i++) {
		container = (globalThis as Record<string, unknown>)[globalName] as
			| WebpackRemoteContainer
			| undefined;
		if (container) break;
		await new Promise((resolve) => setTimeout(resolve, 50));
	}

	if (!container) {
		throw new Error(`Webpack remote container ${globalName} was not found`);
	}

	if (!initializedRemoteContainers.has(container)) {
		await container.init?.(shareScope);
		initializedRemoteContainers.add(container);
	}

	const slots = pluginDescriptor.uiContribution?.slots;
	const pluginId = getPluginId(pluginDescriptor) ?? 'unknown';

	// New path: plugin declares slots with explicit exposedModule
	if (slots && slots.length > 0) {
		const runtimePlugin: RuntimePlugin = { extensions: {} };
		const slotErrors: Error[] = [];

		for (const slot of slots) {
			try {
				const moduleFactory = await container.get(slot.exposedModule);
				const mod = moduleFactory() as SlotModuleExport;
				const contribution =
					slot.slotId === 'header.banner'
						? toHeaderBannerContribution(
								slot.slotId,
								slot.exposedModule,
								pluginId,
								mod,
							)
						: mod;

				if (contribution && runtimePlugin.extensions) {
					const existing =
						(runtimePlugin.extensions as Record<string, unknown[]>)[
							slot.slotId
						] ?? [];
					(runtimePlugin.extensions as Record<string, unknown[]>)[slot.slotId] =
						[...existing, contribution];
				} else {
					slotErrors.push(
						new Error(
							`Exposed module '${slot.exposedModule}' for slot '${slot.slotId}' did not export a supported contribution`,
						),
					);
				}
			} catch (err) {
				logPluginDebug(
					`Could not load exposedModule '${slot.exposedModule}' for slot '${slot.slotId}'`,
					err,
				);
				console.warn(
					`Plugin ${pluginId} could not load exposed module '${slot.exposedModule}' for slot '${slot.slotId}'`,
					err,
				);
				slotErrors.push(err instanceof Error ? err : new Error(String(err)));
			}
		}

		if (
			Object.values(runtimePlugin.extensions ?? {}).every(
				(contributions) => !contributions || contributions.length === 0,
			)
		) {
			throw new Error(
				`Plugin ${pluginId} declares UI slots but no contribution could be loaded${
					slotErrors.length > 0 ? `: ${slotErrors[0].message}` : ''
				}`,
			);
		}

		return runtimePlugin;
	}

	throw new Error(
		`Plugin ${pluginId} has no uiContribution.slots declared`,
	);
};

// ---------------------------------------------------------------------------
// Plugin lifecycle
// ---------------------------------------------------------------------------

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
		const remoteEntryUrl = `${resolveRemoteEntryUrl(remoteEntry)}?v=${getRemoteEntryCacheToken(pluginDescriptor)}`;
		logPluginDebug(`Loading plugin ${pluginId}`, {
			remoteEntryUrl,
			globalName: getPluginGlobalName(pluginDescriptor),
			slots: pluginDescriptor.uiContribution?.slots,
		});

		const resolvedPlugin = await loadWebpackRemoteModule(
			pluginDescriptor,
			remoteEntryUrl,
		);

		// Tag all header.banner extensions with the pluginId
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

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
