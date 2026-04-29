import { createAsyncThunk } from '@reduxjs/toolkit';
import {
	approvePlugin,
	disablePlugin,
	enablePlugin,
	installPlugin,
	listPlugins,
	uninstallPlugin,
} from '~/components/accessories/admin/plugins/pluginAdminApi';

export const getPlugins = createAsyncThunk(
	'plugins/getPlugins',
	async (_, thunkApi) =>
		listPlugins().catch((error) => thunkApi.rejectWithValue(error.response)),
);

export const installPluginZip = createAsyncThunk(
	'plugins/installPluginZip',
	async (file: File, thunkApi) =>
		installPlugin(file).catch((error) =>
			thunkApi.rejectWithValue(error.response),
		),
);

export const approveInstalledPlugin = createAsyncThunk(
	'plugins/approveInstalledPlugin',
	async (pluginId: string, thunkApi) =>
		approvePlugin(pluginId)
			.then((plugin) => ({
				...plugin,
				pluginId,
				status: 'ACTIVE' as const,
				enabled: true,
				approved: true,
			}))
			.catch((error) => thunkApi.rejectWithValue(error.response)),
);

export const enableInstalledPlugin = createAsyncThunk(
	'plugins/enableInstalledPlugin',
	async (pluginId: string, thunkApi) =>
		enablePlugin(pluginId)
			.then((plugin) => ({
				...plugin,
				pluginId,
				status: 'ACTIVE' as const,
				enabled: true,
			}))
			.catch((error) => thunkApi.rejectWithValue(error.response)),
);

export const disableInstalledPlugin = createAsyncThunk(
	'plugins/disableInstalledPlugin',
	async (pluginId: string, thunkApi) =>
		disablePlugin(pluginId)
			.then((plugin) => ({
				...plugin,
				pluginId,
				status: 'DISABLED' as const,
				enabled: false,
			}))
			.catch((error) => thunkApi.rejectWithValue(error.response)),
);

export const uninstallInstalledPlugin = createAsyncThunk(
	'plugins/uninstallInstalledPlugin',
	async (pluginId: string, thunkApi) =>
		uninstallPlugin(pluginId)
			.then(() => pluginId)
			.catch((error) => thunkApi.rejectWithValue(error.response)),
);
