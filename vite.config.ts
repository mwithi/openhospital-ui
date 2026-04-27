import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import svgr from 'vite-plugin-svgr';

const fallbackApiBasePath = 'http://localhost:8080/api';

function getApiProxyConfig(apiBasePath: string) {
	const apiUrl = new URL(apiBasePath, fallbackApiBasePath);

	return {
		path: apiUrl.pathname,
		target: `${apiUrl.protocol}//${apiUrl.host}`,
	};
}

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const apiProxy = getApiProxyConfig(
		env.VITE_BASE_PATH || env.VITE_API_BASE_URL || fallbackApiBasePath,
	);

	return {
		resolve: {
			alias: {
				'~': path.resolve(__dirname, './src'),
			},
		},
		build: {
			outDir: 'build',
		},
		server: {
			proxy: {
				[apiProxy.path]: {
					target: apiProxy.target,
					changeOrigin: true,
				},
			},
		},
		plugins: [
			react({
				babel: {
					plugins: ['@emotion/babel-plugin'],
				},
			}),
			svgr(),
		],
		define: {
			global: 'globalThis',
		},
	};
});
