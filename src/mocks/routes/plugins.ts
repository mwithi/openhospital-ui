import type { PollyServer } from '@pollyjs/core';

export const pluginRoutes = (server: PollyServer) => {
	server.namespace('/plugins', () => {
		server.get('/').intercept((_req, res) => {
			res.status(200).json([]);
		});
	});
};
