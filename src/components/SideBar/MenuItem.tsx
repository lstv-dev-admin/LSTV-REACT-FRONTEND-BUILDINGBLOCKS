import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { mapClassToIcon } from "@/lib/fontawesome-icons";
import { Button } from "@/components/ui/button";
import { IMenuItem } from "@/features/shared/types";
import { useSidebarStore } from "@/stores/useSidebarStore";

interface MenuItemType extends IMenuItem {
	hasChildren?: boolean;
	shouldAutoExpand?: boolean;
}

interface Props {
	item: MenuItemType;
	level?: number;
	sidebarOpen: boolean;
	expandedMenus: Set<string>;
	toggleMenu: (code: string) => void;
}

const MenuItem = ({ item, level = 0, sidebarOpen, expandedMenus, toggleMenu }: Props) => {
	const location = useLocation();
	const navigate = useNavigate();
	const { setIsOpen } = useSidebarStore();

	const isActive = location.pathname === item.path;
	const hasSubMenus = item.hasChildren ?? !!item.children?.length;
	const isExpanded = expandedMenus.has(item.code);
	const isClickable = !!item.path && item.path !== "#" && !hasSubMenus;
	const iconDefinition = mapClassToIcon(item.icon, isActive);
	const childItems = item.children ?? [];

	const handleClick = (e: React.MouseEvent) => {
		if (!sidebarOpen) {
			e.preventDefault();
			if (item.path && item.path !== "#") {
				navigate(item.path);
			} else if (hasSubMenus) {
				setIsOpen(true);
				if (!isExpanded) {
					toggleMenu(item.code);
				}
			} else {
				setIsOpen(true);
			}
			return;
		}

		if (hasSubMenus) {
			e.preventDefault();
			toggleMenu(item.code);
		}
	};

	useEffect(() => {
		if (!hasSubMenus) return;

		const isActiveItem = (menu: MenuItemType): boolean => {
			if (menu.path && location.pathname === menu.path) return true;
			return menu.children?.some(isActiveItem) ?? false;
		};

		const openParentsIfActive = (menu: MenuItemType) => {
			if (!menu.children) return;

			for (const child of menu.children) {
				if (isActiveItem(child)) {
					if (!isExpanded) toggleMenu(menu.code);
					openParentsIfActive(child);
				}
			}
		};

		openParentsIfActive(item);

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [location.pathname]);

	const buttonClassName = cn(
		"flex w-full items-start gap-3 rounded-lg px-3 py-2 h-auto text-sm font-medium transition-all",
		isActive ? "bg-primary text-sidebar-accent-foreground pointer-events-none" : "text-primary hover:bg-accent",
		!sidebarOpen && level === 0 && "justify-center"
	);
	const buttonStyle = { paddingLeft: sidebarOpen ? `${12 + level * 16}px` : undefined } as React.CSSProperties;
	const buttonTitle = !sidebarOpen ? item.name : undefined;

	const content = (
		<>
            {item.icon ? (
                <FontAwesomeIcon
                    icon={iconDefinition}
                    className={cn(
                        "flex-shrink-0 h-4 w-4 mt-0.5",
                        isActive ? "opacity-100" : "opacity-70"
                    )}
                />
            ) : (
                <div className="h-4 w-4 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div 
                        className={cn(
                            "h-3 w-3 border rounded-full grid place-items-center border-current", 
                            isActive && "border-primary-foreground")
                        }
                    >
                        <div
                            className={cn(
                                "flex-shrink-0 h-1 w-1 rounded-full bg-current",
                                isActive ? "opacity-100" : "opacity-70"
                            )}
                        />
                    </div>
                </div>
            )}
			{sidebarOpen && (
				<>
					<span className="flex-1 text-left break-words whitespace-normal min-w-0">{item.name}</span>
					{hasSubMenus && (
						<ChevronDown
							className={cn(
								"h-4 w-4 transition-transform flex-shrink-0 mt-0.5",
								isExpanded && "rotate-180"
							)}
						/>
					)}
				</>
			)}
		</>
	);

	return (
		<div key={item.code}>
			{isClickable && sidebarOpen ? (
				<Button
					asChild
					variant="ghost"
					className={buttonClassName}
					style={buttonStyle}
					title={buttonTitle}
				>
					<Link to={item.path}>
						{content}
					</Link>
				</Button>
			) : (
				<Button
					variant="ghost"
					onClick={handleClick}
					className={buttonClassName}
					style={buttonStyle}
					title={buttonTitle}
				>
					{content}
				</Button>
			)}
			{hasSubMenus && isExpanded && sidebarOpen && (
				<div className="mt-1 space-y-1">
					{childItems.map((subItem) => (
						<MenuItem
							key={subItem.code}
							item={subItem}
							level={level + 1}
							sidebarOpen={sidebarOpen}
							expandedMenus={expandedMenus}
							toggleMenu={toggleMenu}
						/>
					))}
				</div>
			)}
		</div>
	);
};

export default MenuItem;