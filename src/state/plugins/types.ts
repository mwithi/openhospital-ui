import type { InstalledPlugin } from '~/components/accessories/admin/plugins/pluginAdminApi';
import type { ApiResponse } from '../types';

export type IPluginState = {
	pluginList: ApiResponse<InstalledPlugin[]>;
	install: ApiResponse<InstalledPlugin>;
	approve: ApiResponse<InstalledPlugin>;
	enable: ApiResponse<InstalledPlugin>;
	disable: ApiResponse<InstalledPlugin>;
	uninstall: ApiResponse<string>;
};
