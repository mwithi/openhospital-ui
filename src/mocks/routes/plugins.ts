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
		capabilities: ['EVENT_LISTENER', 'LOG_FILE_WRITE', 'UI_COMPONENT_OVERRIDE'],
		fieldPermissions: [
			{
				domain: 'PATIENT',
				access: 'READ',
				fields: ['FIRST_NAME', 'LAST_NAME', 'BIRTH_DATE', 'SEX'],
				purpose: 'Display patient identity in audit messages.',
				maxSensitivity: 'PERSONAL',
			},
			{
				domain: 'ADMISSION',
				access: 'READ',
				fields: ['ADM_DATE', 'DIS_DATE', 'WARD_ID'],
				purpose: 'Include admission context in audit records.',
				maxSensitivity: 'CLINICAL',
			},
		],
		externalConnections: [],
		uiContribution: {
			bundle: {
				entry: 'frontend/remoteEntry.js',
				remoteName: 'patientaudit',
			},
			slots: [
				{
					slotId: 'header.banner',
					mode: 'APPEND',
					exposedModule: './PatientAuditBanner',
				},
			],
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
		status: 'PENDING_APPROVAL',
		enabled: false,
		approved: false,
		capabilities: ['UI_COMPONENT_OVERRIDE', 'EVENT_LISTENER'],
		fieldPermissions: [
			{
				domain: 'PATIENT',
				access: 'READ',
				fields: ['FIRST_NAME', 'LAST_NAME', 'SEX', 'BIRTH_DATE'],
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
			{
				domain: 'PATIENT',
				access: 'WRITE',
				fields: ['NOTE'],
				purpose: 'Store the external PACS study identifier.',
				maxSensitivity: 'SENSITIVE',
			},
		],
		externalConnections: [
			{
				connectionKey: 'hospitalPacs',
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
			slots: [
				{
					slotId: 'patient.header.actions',
					mode: 'APPEND',
					exposedModule: './PatientHeaderActions',
				},
			],
			routes: [{ path: '/radiology', label: 'Radiology' }],
		},
		validationMessages: [
			'Manifest verified. External connection requires explicit administrator approval.',
		],
	},
	{
		pluginId: 'org.openhospital.plugin.connectivity-suite',
		version: '1.2.0',
		name: 'Connectivity Suite',
		description:
			'Connects Open Hospital to the national health registry, a FHIR gateway, and a document archive.',
		entryPoint: 'org.openhospital.plugin.connectivity.ConnectivitySuitePlugin',
		minCoreVersion: '1.15.0',
		status: 'ACTIVE',
		enabled: true,
		approved: true,
		remoteEntry:
			'/plugins/org.openhospital.plugin.connectivity-suite/frontend/remoteEntry.js',
		globalName: 'connectivitySuite',
		capabilities: [
			'EXTERNAL_INTEGRATION',
			'UI_COMPONENT_OVERRIDE',
			'EVENT_LISTENER',
			'LOG_FILE_WRITE',
		],
		permissions: [
			'PATIENT_READ',
			'ADMISSION_READ',
			'LABORATORY_READ',
			'WARD_READ',
		],
		fieldPermissions: [
			{
				domain: 'PATIENT',
				access: 'READ',
				fields: ['CODE', 'FIRST_NAME', 'LAST_NAME', 'BIRTH_DATE', 'SEX'],
				purpose: 'Match local patients with the national health registry.',
				maxSensitivity: 'PERSONAL',
			},
			{
				domain: 'ADMISSION',
				access: 'READ',
				fields: ['ADM_DATE', 'DIS_DATE', 'WARD_ID'],
				purpose: 'Synchronize admission episodes with regional systems.',
				maxSensitivity: 'CLINICAL',
			},
			{
				domain: 'LABORATORY',
				access: 'READ',
				fields: ['EXAM_NAME', 'RESULT', 'DATE'],
				purpose: 'Publish diagnostic observations through the FHIR gateway.',
				maxSensitivity: 'SENSITIVE',
			},
			{
				domain: 'WARD',
				access: 'READ',
				fields: ['CODE', 'DESCRIPTION'],
				purpose: 'Map local wards to regional facility departments.',
				maxSensitivity: 'ADMINISTRATIVE',
			},
		],
		externalConnections: [
			{
				connectionKey: 'nationalRegistry',
				host: 'registry.health.example.org',
				port: 443,
				protocol: 'HTTPS',
				direction: 'OUTBOUND',
				purpose: 'Verify patient demographic records.',
			},
			{
				connectionKey: 'fhirGateway',
				host: 'fhir-gateway.hospital.local',
				port: 8443,
				protocol: 'HTTPS',
				direction: 'OUTBOUND',
				purpose: 'Publish FHIR Patient, Encounter, and Observation resources.',
			},
			{
				connectionKey: 'documentArchive',
				host: 'documents.hospital.local',
				port: 8080,
				protocol: 'HTTP',
				direction: 'OUTBOUND',
				purpose: 'Store generated clinical documents.',
			},
		],
		uiContribution: {
			bundle: {
				entry: 'frontend/remoteEntry.js',
				remoteName: 'connectivitySuite',
			},
			slots: [
				{
					slotId: 'header.banner',
					mode: 'APPEND',
					exposedModule: './ConnectivityBanner',
				},
				{
					slotId: 'patient.header.actions',
					mode: 'APPEND',
					exposedModule: './PatientSyncAction',
				},
			],
			routes: [
				{
					path: '/connectivity',
					label: 'Connectivity',
					requiredPermission: 'PATIENT_READ',
				},
			],
		},
		validationMessages: [],
	},
	{
		pluginId: 'org.openhospital.plugin.referral-network',
		version: '0.9.0',
		name: 'Referral Network',
		description:
			'Stages outbound referrals and sends patient snapshots to partner facilities after approval.',
		entryPoint: 'org.openhospital.plugin.referrals.ReferralNetworkPlugin',
		minCoreVersion: '1.15.0',
		status: 'ACTIVE',
		enabled: true,
		approved: true,
		capabilities: ['EXTERNAL_INTEGRATION', 'UI_COMPONENT_OVERRIDE'],
		permissions: ['PATIENT_READ', 'ADMISSION_READ', 'OPD_READ'],
		fieldPermissions: [
			{
				domain: 'PATIENT',
				access: 'READ',
				fields: ['CODE', 'FIRST_NAME', 'LAST_NAME', 'ADDRESS'],
				purpose: 'Build the referral patient summary.',
				maxSensitivity: 'PERSONAL',
			},
			{
				domain: 'ADMISSION',
				access: 'READ',
				fields: ['ADM_DATE', 'WARD_ID', 'DIAGNOSIS_IN_ID'],
				purpose: 'Include current inpatient context in referral requests.',
				maxSensitivity: 'CLINICAL',
			},
			{
				domain: 'PATIENT',
				access: 'WRITE',
				fields: ['NOTE'],
				purpose: 'Record the external referral identifier returned by the hub.',
				maxSensitivity: 'SENSITIVE',
			},
		],
		externalConnections: [
			{
				connectionKey: 'referralHub',
				host: 'referrals.partner.example.org',
				port: 443,
				protocol: 'HTTPS',
				direction: 'OUTBOUND',
				purpose: 'Create and update referral requests.',
			},
			{
				connectionKey: 'districtDirectory',
				host: 'directory.health-district.local',
				port: 9443,
				protocol: 'HTTPS',
				direction: 'OUTBOUND',
				purpose: 'Search receiving facilities and departments.',
			},
		],
		uiContribution: {
			bundle: {
				entry: 'frontend/remoteEntry.js',
				remoteName: 'referralNetwork',
			},
			slots: [
				{
					slotId: 'patient.header.actions',
					mode: 'APPEND',
					exposedModule: './ReferralButton',
				},
			],
			routes: [
				{
					path: '/referrals',
					label: 'Referrals',
					requiredPermission: 'PATIENT_READ',
				},
			],
		},
		requiresExplicitApproval: true,
		validationMessages: [],
	},
];

const findPlugin = (pluginId: string) =>
	mockPlugins.find((plugin) => plugin.pluginId === pluginId);

export const pluginRoutes = (server: PollyServer) => {
	server.namespace('/plugins', () => {
		server.get('/').intercept((_req, res) => {
			res.status(200).json(mockPlugins);
		});
		server.get('/:pluginId').intercept((req, res) => {
			const plugin = findPlugin(req.params.pluginId);
			if (!plugin) {
				res.status(404);
				return;
			}
			res.status(200).json(plugin);
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
				status: 'PENDING_APPROVAL',
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
		server.put('/:pluginId').intercept((req, res) => {
			const plugin = findPlugin(req.params.pluginId);
			if (!plugin) {
				res.status(404);
				return;
			}
			plugin.version = `${plugin.version ?? '1.0.0'}-updated`;
			plugin.validationMessages = [];
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
