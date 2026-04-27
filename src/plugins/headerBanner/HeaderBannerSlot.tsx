import { Button, Collapse } from '@mui/material';
import { useState } from 'react';
import type { HeaderBannerContribution } from '../extensionPoints';
import { useExtensions } from '../extensionRegistry';
import './styles.scss';

const severityWeight: Record<HeaderBannerContribution['severity'], number> = {
	error: 400,
	warning: 300,
	info: 200,
	success: 100,
};

const getDismissedKey = (banner: HeaderBannerContribution) =>
	`header.banner.dismissed.${banner.pluginId}.${banner.id}`;

const isDismissed = (banner: HeaderBannerContribution) =>
	banner.dismissible &&
	sessionStorage.getItem(getDismissedKey(banner)) === 'true';

const dismissBanner = (banner: HeaderBannerContribution) => {
	if (banner.dismissible) {
		sessionStorage.setItem(getDismissedKey(banner), 'true');
	}
};

const sortBanners = (
	left: HeaderBannerContribution,
	right: HeaderBannerContribution,
) => {
	const severityDiff =
		severityWeight[right.severity] - severityWeight[left.severity];
	if (severityDiff !== 0) {
		return severityDiff;
	}

	const priorityDiff = (right.priority ?? 0) - (left.priority ?? 0);
	if (priorityDiff !== 0) {
		return priorityDiff;
	}

	return `${left.pluginId}.${left.id}`.localeCompare(
		`${right.pluginId}.${right.id}`,
	);
};

export const HeaderBannerSlot = () => {
	const banners = useExtensions('header.banner');
	const [isExpanded, setIsExpanded] = useState(false);
	const [, setDismissedVersion] = useState(0);

	const visibleBanners = banners
		.filter((banner) => !isDismissed(banner))
		.sort(sortBanners);

	const [primaryBanner, ...secondaryBanners] = visibleBanners;

	if (!primaryBanner) {
		return null;
	}

	const handleDismiss = (banner: HeaderBannerContribution) => {
		dismissBanner(banner);
		setDismissedVersion((current) => current + 1);
	};

	return (
		<div className="headerBannerSlot">
			<div className="headerBannerSlot__primary">
				<div className="headerBannerSlot__content">
					{primaryBanner.render({
						isPrimary: true,
						onDismiss: primaryBanner.dismissible
							? () => handleDismiss(primaryBanner)
							: undefined,
					})}
				</div>
				{secondaryBanners.length > 0 && (
					<Button
						size="small"
						variant="text"
						className="headerBannerSlot__toggle"
						onClick={() => setIsExpanded((current) => !current)}
					>
						+{secondaryBanners.length}
					</Button>
				)}
			</div>
			<Collapse in={isExpanded} unmountOnExit>
				<div className="headerBannerSlot__list">
					{secondaryBanners.map((banner) => (
						<div
							key={`${banner.pluginId}.${banner.id}`}
							className="headerBannerSlot__content"
						>
							{banner.render({
								isPrimary: false,
								onDismiss: banner.dismissible
									? () => handleDismiss(banner)
									: undefined,
							})}
						</div>
					))}
				</div>
			</Collapse>
		</div>
	);
};
