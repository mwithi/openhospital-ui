import { useSyncExternalStore } from 'react';
import type { ExtensionPointMap, ExtensionPointName } from './extensionPoints';

type Contribution<T extends ExtensionPointName> = ExtensionPointMap[T];
type Listener = () => void;

const extensions = new Map<
	ExtensionPointName,
	Contribution<ExtensionPointName>[]
>();
const listeners = new Set<Listener>();
let registryVersion = 0;

const notifyListeners = () => {
	registryVersion += 1;
	for (const listener of listeners) {
		listener();
	}
};

export const registerExtension = <T extends ExtensionPointName>(
	point: T,
	contribution: Contribution<T>,
) => {
	const pointExtensions = extensions.get(point) ?? [];
	const nextExtensions = pointExtensions.filter(
		(item) =>
			!(item.id === contribution.id && item.pluginId === contribution.pluginId),
	);

	nextExtensions.push(contribution as Contribution<ExtensionPointName>);
	extensions.set(point, nextExtensions);
	notifyListeners();

	return () => {
		const currentExtensions = extensions.get(point) ?? [];
		extensions.set(
			point,
			currentExtensions.filter(
				(item) =>
					!(
						item.id === contribution.id &&
						item.pluginId === contribution.pluginId
					),
			),
		);
		notifyListeners();
	};
};

export const getExtensions = <T extends ExtensionPointName>(
	point: T,
): Contribution<T>[] => {
	return [...(extensions.get(point) ?? [])] as Contribution<T>[];
};

export const useExtensions = <T extends ExtensionPointName>(
	point: T,
): Contribution<T>[] => {
	useSyncExternalStore(
		(listener) => {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		() => registryVersion,
		() => registryVersion,
	);

	return getExtensions(point);
};
