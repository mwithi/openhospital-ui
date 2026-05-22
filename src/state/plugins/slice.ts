import { createSlice } from '@reduxjs/toolkit';
import { isEmpty } from 'lodash';
import {
	getPluginId,
	type InstalledPlugin,
} from '~/components/accessories/admin/plugins/pluginAdminApi';
import { ApiResponse } from '../types';
import { initial } from './initial';
import * as thunks from './thunk';

export const pluginSlice = createSlice({
	name: 'plugins',
	initialState: initial,
	reducers: {
		installPluginReset: (state) => {
			state.install = initial.install;
		},
		updatePluginReset: (state) => {
			state.update = initial.update;
		},
		approvePluginReset: (state) => {
			state.approve = initial.approve;
		},
		enablePluginReset: (state) => {
			state.enable = initial.enable;
		},
		disablePluginReset: (state) => {
			state.disable = initial.disable;
		},
		uninstallPluginReset: (state) => {
			state.uninstall = initial.uninstall;
		},
		pluginActionsReset: (state) => {
			state.install = initial.install;
			state.update = initial.update;
			state.approve = initial.approve;
			state.enable = initial.enable;
			state.disable = initial.disable;
			state.uninstall = initial.uninstall;
		},
	},
	extraReducers: (builder) =>
		builder
			.addCase(thunks.getPlugins.pending, (state) => {
				state.pluginList = ApiResponse.loading();
			})
			.addCase(thunks.getPlugins.fulfilled, (state, action) => {
				state.pluginList = isEmpty(action.payload)
					? ApiResponse.empty()
					: ApiResponse.value(action.payload);
			})
			.addCase(thunks.getPlugins.rejected, (state, action) => {
				state.pluginList = ApiResponse.error(action.payload);
			})
			.addCase(thunks.installPluginZip.pending, (state) => {
				state.install = ApiResponse.loading();
			})
			.addCase(thunks.installPluginZip.fulfilled, (state, action) => {
				state.install = ApiResponse.value(action.payload);
				state.pluginList = ApiResponse.value([
					action.payload,
					...(state.pluginList.data ?? []).filter(
						(plugin) => getPluginId(plugin) !== getPluginId(action.payload),
					),
				]);
			})
			.addCase(thunks.installPluginZip.rejected, (state, action) => {
				state.install = ApiResponse.error(action.payload);
			})
			.addCase(thunks.updatePluginZip.pending, (state) => {
				state.update = ApiResponse.loading();
			})
			.addCase(thunks.updatePluginZip.fulfilled, (state, action) => {
				state.update = ApiResponse.value(action.payload);
				state.pluginList = ApiResponse.value(
					upsertPlugin(state.pluginList.data ?? [], action.payload),
				);
			})
			.addCase(thunks.updatePluginZip.rejected, (state, action) => {
				state.update = ApiResponse.error(action.payload);
			})
			.addCase(thunks.approveInstalledPlugin.pending, (state) => {
				state.approve = ApiResponse.loading();
			})
			.addCase(thunks.approveInstalledPlugin.fulfilled, (state, action) => {
				state.approve = ApiResponse.value(action.payload);
				state.pluginList = ApiResponse.value(
					upsertPlugin(state.pluginList.data ?? [], action.payload),
				);
			})
			.addCase(thunks.approveInstalledPlugin.rejected, (state, action) => {
				state.approve = ApiResponse.error(action.payload);
			})
			.addCase(thunks.enableInstalledPlugin.pending, (state) => {
				state.enable = ApiResponse.loading();
			})
			.addCase(thunks.enableInstalledPlugin.fulfilled, (state, action) => {
				state.enable = ApiResponse.value(action.payload);
				state.pluginList = ApiResponse.value(
					upsertPlugin(state.pluginList.data ?? [], action.payload),
				);
			})
			.addCase(thunks.enableInstalledPlugin.rejected, (state, action) => {
				state.enable = ApiResponse.error(action.payload);
			})
			.addCase(thunks.disableInstalledPlugin.pending, (state) => {
				state.disable = ApiResponse.loading();
			})
			.addCase(thunks.disableInstalledPlugin.fulfilled, (state, action) => {
				state.disable = ApiResponse.value(action.payload);
				state.pluginList = ApiResponse.value(
					upsertPlugin(state.pluginList.data ?? [], action.payload),
				);
			})
			.addCase(thunks.disableInstalledPlugin.rejected, (state, action) => {
				state.disable = ApiResponse.error(action.payload);
			})
			.addCase(thunks.uninstallInstalledPlugin.pending, (state) => {
				state.uninstall = ApiResponse.loading();
			})
			.addCase(thunks.uninstallInstalledPlugin.fulfilled, (state, action) => {
				state.uninstall = ApiResponse.value(action.payload);
				state.pluginList = ApiResponse.value(
					(state.pluginList.data ?? []).filter(
						(plugin) => getPluginId(plugin) !== action.payload,
					),
				);
			})
			.addCase(thunks.uninstallInstalledPlugin.rejected, (state, action) => {
				state.uninstall = ApiResponse.error(action.payload);
			}),
});

const upsertPlugin = (
	plugins: InstalledPlugin[],
	updatedPlugin: InstalledPlugin,
) =>
	plugins.some((plugin) => getPluginId(plugin) === getPluginId(updatedPlugin))
		? plugins.map((plugin) =>
				getPluginId(plugin) === getPluginId(updatedPlugin)
					? updatedPlugin
					: plugin,
			)
		: [updatedPlugin, ...plugins];

export const {
	installPluginReset,
	updatePluginReset,
	approvePluginReset,
	enablePluginReset,
	disablePluginReset,
	uninstallPluginReset,
	pluginActionsReset,
} = pluginSlice.actions;
