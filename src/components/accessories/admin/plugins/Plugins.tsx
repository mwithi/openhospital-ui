import {
	CheckCircle,
	Delete,
	PowerSettingsNew,
	Refresh,
	UploadFile,
	VerifiedUser,
} from '@mui/icons-material';
import {
	Alert,
	Button,
	Chip,
	CircularProgress,
	IconButton,
	Tooltip,
} from '@mui/material';
import {
	type ChangeEvent,
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import ConfirmationDialog from '~/components/accessories/confirmationDialog/ConfirmationDialog';
import { AdminActivityContent } from '~/components/activities/adminActivity';
import { useAppDispatch, useAppSelector } from '~/libraries/hooks/redux';
import { loadRemotePlugin, unloadRemotePlugin } from '~/plugins';
import {
	approveInstalledPlugin,
	disableInstalledPlugin,
	enableInstalledPlugin,
	getPlugins,
	installPluginZip,
	pluginActionsReset,
	uninstallInstalledPlugin,
} from '~/state/plugins';
import warningIcon from '../../../../assets/warning-icon.png';
import classes from './Plugins.module.scss';
import {
	getPluginId,
	getPluginManifest,
	getPluginName,
	type InstalledPlugin,
	type PluginFieldPermissionDescriptor,
	type PluginManifest,
} from './pluginAdminApi';

const statusColor: Record<
	string,
	'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
> = {
	ACTIVE: 'success',
	DISABLED: 'default',
	FAILED: 'error',
	INSTALLED: 'info',
	PENDING_APPROVAL: 'warning',
	REJECTED: 'error',
	VALIDATING: 'info',
};

type PluginConfirmationAction = 'approve' | 'enable' | 'disable' | 'uninstall';

interface PendingPluginConfirmation {
	action: PluginConfirmationAction;
	pluginId: string;
	pluginName: string;
}

const confirmationContent: Record<
	PluginConfirmationAction,
	{
		title: string;
		info: (pluginName: string) => string;
		primaryButtonLabel: string;
	}
> = {
	approve: {
		title: 'Approve plugin',
		info: (pluginName) =>
			`Approve "${pluginName}" and allow it to run in Open Hospital?`,
		primaryButtonLabel: 'Approve',
	},
	disable: {
		title: 'Disable plugin',
		info: (pluginName) =>
			`Disable "${pluginName}"? Its UI contributions will be removed until it is enabled again.`,
		primaryButtonLabel: 'Disable',
	},
	enable: {
		title: 'Enable plugin',
		info: (pluginName) =>
			`Enable "${pluginName}" and load its UI contributions now?`,
		primaryButtonLabel: 'Enable',
	},
	uninstall: {
		title: 'Uninstall plugin',
		info: (pluginName) =>
			`Uninstall "${pluginName}"? This removes it from the plugin registry.`,
		primaryButtonLabel: 'Uninstall',
	},
};

const normalizeCapabilities = (plugin: InstalledPlugin) =>
	(plugin.capabilities ?? plugin.manifest?.capabilities ?? []).map(
		(capability) =>
			typeof capability === 'string'
				? { id: capability, name: capability }
				: capability,
	);

const fieldPermissions = (plugin: InstalledPlugin) =>
	(plugin.fieldPermissions ??
		plugin.manifest?.fieldPermissions ??
		[]) as PluginFieldPermissionDescriptor[];

const externalConnections = (plugin: InstalledPlugin) =>
	plugin.externalConnections ?? plugin.manifest?.externalConnections ?? [];

const uiContribution = (plugin: InstalledPlugin) =>
	plugin.uiContribution ?? plugin.manifest?.uiContribution;

const getManifestValue = (plugin: InstalledPlugin, key: keyof PluginManifest) =>
	plugin[key as keyof InstalledPlugin] ?? plugin.manifest?.[key];

const getManifestField = (
	plugin: InstalledPlugin,
	key: keyof PluginManifest,
) => {
	const value = getManifestValue(plugin, key);

	return typeof value === 'string' ||
		typeof value === 'number' ||
		typeof value === 'boolean'
		? value
		: undefined;
};

const statusLabel = (plugin: InstalledPlugin) =>
	plugin.status ?? (plugin.enabled ? 'ACTIVE' : 'DISABLED');

const getApiErrorMessage = (error: unknown) => {
	const response = (error as { response?: unknown })?.response ?? error;

	if (typeof response === 'string') {
		return response;
	}

	if (response && typeof response === 'object') {
		const apiError = response as {
			message?: string;
			detail?: string;
			error?: string;
			details?: Array<{ message?: string; field?: string }>;
		};

		if (apiError.message) {
			return apiError.message;
		}

		if (apiError.detail) {
			return apiError.detail;
		}

		if (apiError.details?.length) {
			return apiError.details
				.map((detail) =>
					detail.field && detail.message
						? `${detail.field}: ${detail.message}`
						: detail.message,
				)
				.filter(Boolean)
				.join('\n');
		}

		if (apiError.error) {
			return apiError.error;
		}
	}

	return (error as Error).message;
};

const SummaryItem = ({ label, value }: { label: string; value: number }) => (
	<div className={classes.summaryItem}>
		<span className={classes.summaryLabel}>{label}</span>
		<span className={classes.summaryValue}>{value}</span>
	</div>
);

const DetailField = ({
	label,
	value,
}: {
	label: string;
	value?: string | number | boolean;
}) => (
	<div className={classes.field}>
		<span className={classes.fieldLabel}>{label}</span>
		<span className={classes.fieldValue}>
			{value === undefined || value === '' ? '-' : String(value)}
		</span>
	</div>
);

export const Plugins = () => {
	const dispatch = useAppDispatch();
	const pluginStore = useAppSelector((state) => state.plugins);
	const [pluginManifests, setPluginManifests] = useState<
		Record<string, PluginManifest>
	>({});
	const [selectedPluginId, setSelectedPluginId] = useState<string>();
	const [isManifestLoading, setIsManifestLoading] = useState(false);
	const [busyAction, setBusyAction] = useState<string>();
	const [error, setError] = useState<string>();
	const [pendingConfirmation, setPendingConfirmation] =
		useState<PendingPluginConfirmation>();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const plugins = pluginStore.pluginList.data ?? [];
	const isLoading = pluginStore.pluginList.isLoading;
	const apiError =
		pluginStore.pluginList.error ??
		pluginStore.install.error ??
		pluginStore.approve.error ??
		pluginStore.enable.error ??
		pluginStore.disable.error ??
		pluginStore.uninstall.error;
	const errorMessage =
		error ?? (apiError ? getApiErrorMessage(apiError) : undefined);

	const selectedPluginBase = plugins.find(
		(plugin) => getPluginId(plugin) === selectedPluginId,
	);
	const selectedPluginManifest = selectedPluginId
		? pluginManifests[selectedPluginId]
		: undefined;
	const selectedPlugin = selectedPluginBase
		? ({
				...selectedPluginManifest,
				...selectedPluginBase,
				manifest: {
					...selectedPluginManifest,
					...selectedPluginBase.manifest,
				},
			} as InstalledPlugin)
		: undefined;

	const summary = useMemo(
		() => ({
			total: plugins.length,
			active: plugins.filter((plugin) => statusLabel(plugin) === 'ACTIVE')
				.length,
			pending: plugins.filter((plugin) => statusLabel(plugin) === 'VALIDATING')
				.length,
			failed: plugins.filter((plugin) => statusLabel(plugin) === 'FAILED')
				.length,
		}),
		[plugins],
	);

	const loadPlugins = useCallback(async () => {
		setError(undefined);
		dispatch(pluginActionsReset());
		try {
			const loadedPlugins = await dispatch(getPlugins()).unwrap();
			setSelectedPluginId(
				(current) =>
					current ??
					(loadedPlugins[0] ? getPluginId(loadedPlugins[0]) : undefined),
			);
		} catch {
			// The rejected payload is stored in the plugins slice.
		}
	}, [dispatch]);

	useEffect(() => {
		loadPlugins();
	}, [loadPlugins]);

	useEffect(() => {
		if (!selectedPluginId || pluginManifests[selectedPluginId]) {
			return;
		}

		let isMounted = true;
		setIsManifestLoading(true);
		getPluginManifest(selectedPluginId)
			.then((manifest) => {
				if (!isMounted) {
					return;
				}
				setPluginManifests((current) => ({
					...current,
					[selectedPluginId]: manifest,
				}));
			})
			.catch((manifestError) => {
				if (isMounted) {
					setError(getApiErrorMessage(manifestError));
				}
			})
			.finally(() => {
				if (isMounted) {
					setIsManifestLoading(false);
				}
			});

		return () => {
			isMounted = false;
		};
	}, [pluginManifests, selectedPluginId]);

	const runPluginAction = async (
		label: string,
		action: () => Promise<InstalledPlugin | undefined>,
	) => {
		setBusyAction(label);
		setError(undefined);
		dispatch(pluginActionsReset());
		try {
			const updatedPlugin = await action();
			if (updatedPlugin) {
				const updatedPluginId = getPluginId(updatedPlugin);
				const previousManifest = pluginManifests[updatedPluginId];
				setPluginManifests((current) => ({
					...current,
					[updatedPluginId]:
						current[updatedPluginId] ??
						updatedPlugin.manifest ??
						previousManifest ??
						{},
				}));
				setSelectedPluginId(updatedPluginId);
			} else {
				await loadPlugins();
			}
		} catch (actionError) {
			setError(getApiErrorMessage(actionError));
		} finally {
			setBusyAction(undefined);
		}
	};

	const handleInstall = async (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		event.target.value = '';

		if (!file) {
			return;
		}

		await runPluginAction('install', () =>
			dispatch(installPluginZip(file)).unwrap(),
		);
	};

	const requestPluginAction = (
		action: PluginConfirmationAction,
		plugin: InstalledPlugin,
	) => {
		setPendingConfirmation({
			action,
			pluginId: getPluginId(plugin),
			pluginName: getPluginName(plugin),
		});
	};

	const handleApprove = (pluginId: string) =>
		runPluginAction('approve', async () => {
			const plugin = await dispatch(approveInstalledPlugin(pluginId)).unwrap();
			await loadRemotePlugin({
				...plugin,
				pluginId,
				status: 'ACTIVE',
				enabled: true,
			});
			return plugin;
		});

	const handleEnable = (pluginId: string) =>
		runPluginAction('enable', async () => {
			const plugin = await dispatch(enableInstalledPlugin(pluginId)).unwrap();
			await loadRemotePlugin({
				...plugin,
				pluginId,
				status: 'ACTIVE',
				enabled: true,
			});
			return plugin;
		});

	const handleDisable = (pluginId: string) =>
		runPluginAction('disable', async () => {
			const plugin = await dispatch(disableInstalledPlugin(pluginId)).unwrap();
			unloadRemotePlugin(pluginId);
			return plugin;
		});

	const handleUninstall = (pluginId: string) => {
		runPluginAction('uninstall', async () => {
			await dispatch(uninstallInstalledPlugin(pluginId)).unwrap();
			unloadRemotePlugin(pluginId);
			const remainingPlugins = plugins.filter(
				(item) => getPluginId(item) !== pluginId,
			);
			setPluginManifests((currentManifests) => {
				const nextManifests = { ...currentManifests };
				delete nextManifests[pluginId];
				return nextManifests;
			});
			setSelectedPluginId(
				remainingPlugins[0] ? getPluginId(remainingPlugins[0]) : undefined,
			);
			return undefined;
		});
	};

	const handleConfirmedAction = () => {
		if (!pendingConfirmation) {
			return;
		}

		const { action, pluginId } = pendingConfirmation;
		setPendingConfirmation(undefined);

		switch (action) {
			case 'approve':
				handleApprove(pluginId);
				break;
			case 'enable':
				handleEnable(pluginId);
				break;
			case 'disable':
				handleDisable(pluginId);
				break;
			case 'uninstall':
				handleUninstall(pluginId);
				break;
		}
	};

	const confirmation = pendingConfirmation
		? confirmationContent[pendingConfirmation.action]
		: undefined;

	return (
		<AdminActivityContent title="Plugins">
			<div className={classes.plugins}>
				<div className={classes.toolbar}>
					<div className={classes.summary}>
						<SummaryItem label="Installed" value={summary.total} />
						<SummaryItem label="Active" value={summary.active} />
						<SummaryItem label="Pending approval" value={summary.pending} />
						<SummaryItem label="Failed" value={summary.failed} />
					</div>
					<div className={classes.actions}>
						<Tooltip title="Refresh plugins">
							<span>
								<IconButton onClick={loadPlugins} disabled={isLoading}>
									<Refresh />
								</IconButton>
							</span>
						</Tooltip>
						<input
							ref={fileInputRef}
							type="file"
							accept=".zip"
							hidden
							onChange={handleInstall}
						/>
						<Button
							variant="contained"
							startIcon={<UploadFile />}
							disabled={Boolean(busyAction)}
							onClick={() => fileInputRef.current?.click()}
						>
							Install ZIP
						</Button>
					</div>
				</div>

				{errorMessage && <Alert severity="error">{errorMessage}</Alert>}

				{isLoading ? (
					<div className={classes.emptyState}>
						<CircularProgress size={28} />
					</div>
				) : plugins.length === 0 ? (
					<div className={classes.emptyState}>
						No plugins installed. Upload a plugin ZIP generated by the Open
						Hospital plugin SDK.
					</div>
				) : (
					<div className={classes.layout}>
						<div className={classes.list}>
							{plugins.map((plugin) => {
								const pluginId = getPluginId(plugin);
								const status = statusLabel(plugin);

								return (
									<button
										key={pluginId}
										type="button"
										className={`${classes.pluginRow} ${
											getPluginId(selectedPlugin ?? {}) === pluginId
												? classes.pluginRowSelected
												: ''
										}`}
										onClick={() => setSelectedPluginId(pluginId)}
									>
										<div className={classes.pluginName}>
											<span>{getPluginName(plugin)}</span>
											<Chip
												size="small"
												label={status}
												color={statusColor[status] ?? 'default'}
											/>
										</div>
										<div className={classes.pluginMeta}>
											<span>{pluginId}</span>
											<span>
												v{plugin.version ?? plugin.manifest?.version ?? '-'}
											</span>
										</div>
									</button>
								);
							})}
						</div>

						{selectedPlugin && (
							<PluginDetails
								plugin={selectedPlugin}
								busyAction={busyAction}
								isManifestLoading={isManifestLoading}
								onApprove={() => requestPluginAction('approve', selectedPlugin)}
								onEnable={() => requestPluginAction('enable', selectedPlugin)}
								onDisable={() => requestPluginAction('disable', selectedPlugin)}
								onUninstall={() =>
									requestPluginAction('uninstall', selectedPlugin)
								}
							/>
						)}
					</div>
				)}
			</div>
			{confirmation && pendingConfirmation && (
				<ConfirmationDialog
					isOpen={Boolean(pendingConfirmation)}
					title={confirmation.title}
					icon={warningIcon}
					info={confirmation.info(pendingConfirmation.pluginName)}
					primaryButtonLabel={confirmation.primaryButtonLabel}
					secondaryButtonLabel="Cancel"
					handlePrimaryButtonClick={handleConfirmedAction}
					handleSecondaryButtonClick={() => setPendingConfirmation(undefined)}
				/>
			)}
		</AdminActivityContent>
	);
};

const PluginDetails = ({
	plugin,
	busyAction,
	isManifestLoading,
	onApprove,
	onEnable,
	onDisable,
	onUninstall,
}: {
	plugin: InstalledPlugin;
	busyAction?: string;
	isManifestLoading: boolean;
	onApprove: () => void;
	onEnable: () => void;
	onDisable: () => void;
	onUninstall: () => void;
}) => {
	const status = statusLabel(plugin);
	const capabilities = normalizeCapabilities(plugin);
	const permissions = fieldPermissions(plugin);
	const connections = externalConnections(plugin);
	const ui = uiContribution(plugin);
	const isBusy = Boolean(busyAction);

	return (
		<div className={classes.details}>
			<div className={classes.detailsHeader}>
				<div className={classes.titleBlock}>
					<h3>{getPluginName(plugin)}</h3>
					<p className={classes.description}>
						{plugin.description ??
							plugin.manifest?.description ??
							getPluginId(plugin)}
					</p>
				</div>
				<div className={classes.actions}>
					{status === 'VALIDATING' && (
						<Button
							variant="contained"
							color="success"
							startIcon={<VerifiedUser />}
							disabled={isBusy}
							onClick={onApprove}
						>
							Approve
						</Button>
					)}
					{status === 'ACTIVE' && (
						<Button
							variant="outlined"
							startIcon={<PowerSettingsNew />}
							disabled={isBusy}
							onClick={onDisable}
						>
							Disable
						</Button>
					)}
					{status === 'DISABLED' && (
						<Button
							variant="outlined"
							startIcon={<PowerSettingsNew />}
							disabled={isBusy}
							onClick={onEnable}
						>
							Enable
						</Button>
					)}
					<Button
						variant="outlined"
						color="error"
						startIcon={<Delete />}
						disabled={isBusy}
						onClick={onUninstall}
					>
						Uninstall
					</Button>
				</div>
			</div>

			{isManifestLoading && (
				<Alert severity="info" className={classes.section}>
					Loading plugin manifest...
				</Alert>
			)}

			<div className={classes.grid}>
				<DetailField label="Plugin ID" value={getPluginId(plugin)} />
				<DetailField
					label="Version"
					value={getManifestField(plugin, 'version')}
				/>
				<DetailField
					label="Vendor"
					value={getManifestField(plugin, 'vendor')}
				/>
				<DetailField
					label="Entry point"
					value={getManifestField(plugin, 'entryPoint')}
				/>
				<DetailField
					label="Minimum core version"
					value={getManifestField(plugin, 'minCoreVersion')}
				/>
				<DetailField
					label="Remote entry"
					value={plugin.remoteEntryUrl ?? plugin.remoteEntry}
				/>
				<DetailField label="Installed by" value={plugin.installedBy} />
				<DetailField label="Installed at" value={plugin.installedAt} />
				<DetailField label="Updated at" value={plugin.updatedAt} />
				<DetailField
					label="Requires explicit approval"
					value={getManifestField(plugin, 'requiresExplicitApproval')}
				/>
				<DetailField
					label="Approved"
					value={plugin.approved ?? status === 'ACTIVE'}
				/>
			</div>

			<DetailSection title="Capabilities">
				{capabilities.length > 0 ? (
					<div className={classes.chips}>
						{capabilities.map((capability) => (
							<Chip
								key={capability.id ?? capability.name}
								label={capability.name ?? capability.id}
								icon={<CheckCircle />}
								variant="outlined"
							/>
						))}
					</div>
				) : (
					<div className={classes.emptyState}>No capabilities declared.</div>
				)}
			</DetailSection>

			<DetailSection title="Declared permissions">
				{plugin.permissions && plugin.permissions.length > 0 ? (
					<div className={classes.chips}>
						{plugin.permissions.map((permission) => (
							<Chip key={permission} label={permission} variant="outlined" />
						))}
					</div>
				) : (
					<div className={classes.emptyState}>No permissions declared.</div>
				)}
			</DetailSection>

			<DetailSection title="Field permissions">
				{permissions.length > 0 ? (
					<div className={classes.grid}>
						{permissions.map((permission, index) => (
							<div
								key={`${permission.domain ?? 'permission'}-${index}`}
								className={classes.permissionCard}
							>
								<div className={classes.permissionTitle}>
									{permission.access ?? permission.action ?? 'READ'}{' '}
									{permission.domain ?? 'DOMAIN'}
								</div>
								<div className={classes.permissionPurpose}>
									{permission.purpose ?? 'No purpose declared'}
								</div>
								<div className={classes.chips}>
									{(permission.fields ?? []).map((field) => (
										<Chip key={field} size="small" label={field} />
									))}
									{(permission.maxSensitivity ?? permission.sensitivity) && (
										<Chip
											size="small"
											color="warning"
											label={
												permission.maxSensitivity ?? permission.sensitivity
											}
										/>
									)}
								</div>
							</div>
						))}
					</div>
				) : (
					<div className={classes.emptyState}>
						No field permissions requested.
					</div>
				)}
			</DetailSection>

			<DetailSection title="External connections">
				{connections.length > 0 ? (
					<div className={classes.grid}>
						{connections.map((connection, index) => (
							<div
								key={`${connection.host ?? 'connection'}-${index}`}
								className={classes.permissionCard}
							>
								<div className={classes.permissionTitle}>
									{connection.protocol ?? 'TCP'} {connection.host}
									{connection.port ? `:${connection.port}` : ''}
								</div>
								<div className={classes.permissionPurpose}>
									{connection.direction ?? 'OUTBOUND'} ·{' '}
									{connection.purpose ?? 'No purpose declared'}
								</div>
							</div>
						))}
					</div>
				) : (
					<div className={classes.emptyState}>
						No external connections requested.
					</div>
				)}
			</DetailSection>

			<DetailSection title="UI contribution">
				{ui ? (
					<div className={classes.grid}>
						<DetailField label="Bundle entry" value={ui.bundle?.entry} />
						<DetailField label="Remote name" value={ui.bundle?.remoteName} />
						<DetailField
							label="Routes"
							value={ui.routes?.map((route) => route.path).join(', ')}
						/>
						<DetailField
							label="Slots"
							value={ui.slots
								?.map((slot) => `${slot.slotId} (${slot.mode ?? 'APPEND'})`)
								.join(', ')}
						/>
					</div>
				) : (
					<div className={classes.emptyState}>No UI contribution declared.</div>
				)}
			</DetailSection>

			{plugin.validationMessages && plugin.validationMessages.length > 0 && (
				<DetailSection title="Validation messages">
					{plugin.validationMessages.map((message) => (
						<Alert key={message} severity="warning">
							{message}
						</Alert>
					))}
				</DetailSection>
			)}

			<DetailSection title="Manifest">
				{plugin.manifest && Object.keys(plugin.manifest).length > 0 ? (
					<pre className={classes.rawManifest}>
						{JSON.stringify(plugin.manifest, null, 2)}
					</pre>
				) : (
					<div className={classes.emptyState}>
						Manifest details unavailable.
					</div>
				)}
			</DetailSection>
		</div>
	);
};

const DetailSection = ({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) => (
	<section className={classes.section}>
		<h4>{title}</h4>
		{children}
	</section>
);
