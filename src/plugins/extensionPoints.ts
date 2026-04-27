import type { ReactNode } from 'react';

export type ExtensionPointName = 'header.banner';

export type HeaderBannerSeverity = 'success' | 'info' | 'warning' | 'error';

export interface HeaderBannerRenderProps {
	isPrimary: boolean;
	onDismiss?: () => void;
}

export interface HeaderBannerContribution {
	id: string;
	pluginId: string;
	priority?: number;
	severity: HeaderBannerSeverity;
	dismissible?: boolean;
	render: (props: HeaderBannerRenderProps) => ReactNode;
}

export interface ExtensionPointMap {
	'header.banner': HeaderBannerContribution;
}
