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

function getDevelopmentCsp(apiTarget: string) {
	return [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline'",
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' data: blob:",
		"font-src 'self' data:",
		`connect-src 'self' ${apiTarget} ws://localhost:5173 http://localhost:8042`,
		"object-src 'none'",
		"base-uri 'self'",
	].join('; ');
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
			dedupe: ['@emotion/react', '@emotion/styled'],
		},
		build: {
			outDir: 'build',
		},
		server: {
			headers: {
				'Content-Security-Policy-Report-Only': getDevelopmentCsp(
					apiProxy.target,
				),
			},
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
