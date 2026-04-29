import { ApiResponse } from '../types';
import type { IPluginState } from './types';

export const initial: IPluginState = {
	pluginList: new ApiResponse({ status: 'IDLE', data: [] }),
	install: new ApiResponse({ status: 'IDLE' }),
	approve: new ApiResponse({ status: 'IDLE' }),
	enable: new ApiResponse({ status: 'IDLE' }),
	disable: new ApiResponse({ status: 'IDLE' }),
	uninstall: new ApiResponse({ status: 'IDLE' }),
};
