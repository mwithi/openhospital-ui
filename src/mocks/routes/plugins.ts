import type { PollyServer } from '@pollyjs/core';
import type { InstalledPlugin } from '~/components/accessories/admin/plugins/pluginAdminApi';

const mockPlugins: InstalledPlugin[] = [
	{
		pluginId: 'org.openhospital.plugin.patientaudit',
		version: '1.0.0',
		name: 'Patient Audit',
		description: 'Records selected patient lifecycle events in a plugin log.',
		entryPoint: 'org.openhospital.plugin.patientaudit.PatientAuditPlugin',
		minCoreVersion: '1.15.0',
		status: 'ACTIVE',
		enabled: true,
		approved: true,
		remoteEntry:
			'/plugins/org.openhospital.plugin.patientaudit/frontend/remoteEntry.js',
		globalName: 'patientaudit',
		exposedModule: './Banner',
		capabilities: ['EVENT_LISTENER', 'LOG_FILE_WRITE', 'UI_COMPONENT_OVERRIDE'],
		fieldPermissions: [
			{
				domain: 'PATIENT',
				access: 'READ',
				fields: ['FIRST_NAME', 'LAST_NAME', 'BIRTH_DATE'],
				purpose: 'Display patient identity in audit messages.',
				maxSensitivity: 'PERSONAL',
			},
		],
		externalConnections: [],
		uiContribution: {
			bundle: {
				entry: 'frontend/remoteEntry.js',
				remoteName: 'patientaudit',
			},
			slots: [{ slotId: 'header.banner', mode: 'APPEND' }],
			routes: [],
		},
		validationMessages: [],
	},
	{
		pluginId: 'org.openhospital.plugin.radiology',
		version: '0.3.0',
		name: 'Radiology',
		description: 'Adds a radiology workflow and PACS integration hooks.',
		entryPoint: 'org.openhospital.plugin.radiology.RadiologyPlugin',
		minCoreVersion: '1.15.0',
		status: 'VALIDATING',
		enabled: false,
		approved: false,
		capabilities: ['UI_COMPONENT_OVERRIDE', 'EVENT_LISTENER'],
		fieldPermissions: [
			{
				domain: 'PATIENT',
				access: 'READ',
				fields: ['FIRST_NAME', 'LAST_NAME', 'SEX'],
				purpose: 'Prepare radiology orders.',
				maxSensitivity: 'PERSONAL',
			},
			{
				domain: 'LABORATORY',
				access: 'READ',
				fields: ['EXAM_NAME', 'RESULT'],
				purpose: 'Correlate imaging requests with diagnostic results.',
				maxSensitivity: 'CLINICAL',
			},
		],
		externalConnections: [
			{
				host: 'pacs.hospital.org',
				port: 11112,
				protocol: 'DICOM',
				direction: 'OUTBOUND',
				purpose: 'Send DICOM studies to the hospital PACS.',
			},
		],
		uiContribution: {
			bundle: {
				entry: 'frontend/remoteEntry.js',
				remoteName: 'radiology',
			},
			slots: [{ slotId: 'patient.header.actions', mode: 'APPEND' }],
			routes: [{ path: '/radiology', label: 'Radiology' }],
		},
		validationMessages: [
			'External connection requires explicit administrator approval.',
		],
	},
];

const findPlugin = (pluginId: string) =>
	mockPlugins.find((plugin) => plugin.pluginId === pluginId);

export const pluginRoutes = (server: PollyServer) => {
	server.namespace('/plugins', () => {
		server.get('/').intercept((_req, res) => {
			res.status(200).json(mockPlugins);
		});
		server.get('/:pluginId/manifest').intercept((req, res) => {
			const plugin = findPlugin(req.params.pluginId);
			if (!plugin) {
				res.status(404);
				return;
			}
			res.status(200).json({
				pluginId: plugin.pluginId,
				version: plugin.version,
				name: plugin.name,
				description: plugin.description,
				vendor: 'Informatici Senza Frontiere',
				entryPoint: plugin.entryPoint,
				minCoreVersion: plugin.minCoreVersion,
				capabilities: plugin.capabilities,
				permissions: plugin.permissions ?? [],
				fieldPermissions: plugin.fieldPermissions,
				externalConnections: plugin.externalConnections,
				requiresExplicitApproval: plugin.requiresExplicitApproval ?? false,
				uiContribution: plugin.uiContribution,
			});
		});
		server.post('/install').intercept((_req, res) => {
			const plugin: InstalledPlugin = {
				pluginId: 'org.openhospital.plugin.uploaded',
				version: '1.0.0',
				name: 'Uploaded Plugin',
				description: 'Plugin staged from a local ZIP upload.',
				entryPoint: 'org.openhospital.plugin.uploaded.UploadedPlugin',
				minCoreVersion: '1.15.0',
				status: 'VALIDATING',
				enabled: false,
				approved: false,
				capabilities: ['EVENT_LISTENER'],
				fieldPermissions: [],
				externalConnections: [],
				validationMessages: ['Plugin installed in staging area.'],
			};

			const existing = findPlugin(plugin.pluginId ?? '');
			if (!existing) {
				mockPlugins.unshift(plugin);
			}
			res.status(200).json(plugin);
		});
		server.put('/:pluginId/approve').intercept((req, res) => {
			const plugin = findPlugin(req.params.pluginId);
			if (!plugin) {
				res.status(404);
				return;
			}
			plugin.status = 'ACTIVE';
			plugin.enabled = true;
			plugin.approved = true;
			res.status(200).json(plugin);
		});
		server.put('/:pluginId/enable').intercept((req, res) => {
			const plugin = findPlugin(req.params.pluginId);
			if (!plugin) {
				res.status(404);
				return;
			}
			plugin.status = 'ACTIVE';
			plugin.enabled = true;
			res.status(200).json(plugin);
		});
		server.put('/:pluginId/disable').intercept((req, res) => {
			const plugin = findPlugin(req.params.pluginId);
			if (!plugin) {
				res.status(404);
				return;
			}
			plugin.status = 'DISABLED';
			plugin.enabled = false;
			res.status(200).json(plugin);
		});
		server.delete('/:pluginId').intercept((req, res) => {
			const index = mockPlugins.findIndex(
				(plugin) => plugin.pluginId === req.params.pluginId,
			);
			if (index >= 0) {
				mockPlugins.splice(index, 1);
			}
			res.status(204);
		});
	});
};
