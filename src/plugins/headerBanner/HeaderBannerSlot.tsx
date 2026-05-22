import CloseIcon from '@mui/icons-material/Close';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Button, Collapse, IconButton } from '@mui/material';
import { useEffect, useState } from 'react';
import type { HeaderBannerContribution } from '../extensionPoints';
import { useExtensions } from '../extensionRegistry';
import './styles.scss';

const getDismissedKey = (banner: HeaderBannerContribution) =>
	`header.banner.dismissed.${banner.pluginId}.${banner.id}`;

const sortBanners = (
	left: HeaderBannerContribution,
	right: HeaderBannerContribution,
) => {
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
	const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(
		() => new Set(),
	);

	useEffect(() => {
		const activeKeys = new Set(banners.map(getDismissedKey));

		setDismissedKeys((current) => {
			const next = new Set(
				[...current].filter((dismissedKey) => activeKeys.has(dismissedKey)),
			);

			return next.size === current.size ? current : next;
		});
	}, [banners]);

	const visibleBanners = banners
		.filter(
			(banner) =>
				!(banner.dismissible && dismissedKeys.has(getDismissedKey(banner))),
		)
		.sort(sortBanners);

	const [primaryBanner] = visibleBanners;
	const hasMultipleBanners = visibleBanners.length > 1;

	useEffect(() => {
		if (!hasMultipleBanners) {
			setIsExpanded(false);
		}
	}, [hasMultipleBanners]);

	if (!primaryBanner) {
		return null;
	}

	const handleDismiss = (banner: HeaderBannerContribution) => {
		if (banner.dismissible) {
			setDismissedKeys((current) => {
				const next = new Set(current);
				next.add(getDismissedKey(banner));
				return next;
			});
		}
	};

	const renderBanner = (
		banner: HeaderBannerContribution,
		isPrimary: boolean,
	) => (
		<div className="headerBannerSlot__item">
			<div className="headerBannerSlot__content">
				{banner.render({
					isPrimary,
					onDismiss: banner.dismissible
						? () => handleDismiss(banner)
						: undefined,
				})}
			</div>
			{banner.dismissible && (
				<IconButton
					size="small"
					className="headerBannerSlot__dismiss"
					onClick={() => handleDismiss(banner)}
					aria-label="Dismiss plugin contribution"
				>
					<CloseIcon fontSize="small" />
				</IconButton>
			)}
		</div>
	);

	return (
		<div className="headerBannerSlot">
			<div className="headerBannerSlot__primary">
				{hasMultipleBanners ? (
					<div className="headerBannerSlot__summary">
						{visibleBanners.length} plugin contributions
					</div>
				) : (
					renderBanner(primaryBanner, true)
				)}
				{hasMultipleBanners && (
					<Button
						size="small"
						variant="outlined"
						className="headerBannerSlot__toggle"
						onClick={() => setIsExpanded((current) => !current)}
						endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
					>
						{visibleBanners.length} items
					</Button>
				)}
			</div>
			<Collapse in={isExpanded} unmountOnExit>
				<div className="headerBannerSlot__drawer">
					<div className="headerBannerSlot__drawerHeader">
						<Button
							size="small"
							variant="text"
							onClick={() => setIsExpanded(false)}
						>
							Close
						</Button>
					</div>
					<div className="headerBannerSlot__list">
						{visibleBanners.map((banner) => (
							<div
								key={`${banner.pluginId}.${banner.id}`}
								className="headerBannerSlot__drawerItem"
							>
								{renderBanner(banner, banner === primaryBanner)}
							</div>
						))}
					</div>
				</div>
			</Collapse>
		</div>
	);
};
