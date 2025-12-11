import { useEffect, useMemo, useState, useCallback } from "react";
import { useDebounce } from "use-debounce";

// Components
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import { LogOut } from "lucide-react";
import MenuItem from "./MenuItem";

// Features
import useLogoutMutation from "@/features/auth/hooks/mutations/useLogoutMutation";

// Utils
import { useAuthStore } from "@/stores/useAuthStore";
import { useMenuStore } from "@/stores/useMenuStore";
import { useSidebarStore } from "@/stores/useSidebarStore";
import useConfirmStore from "@/stores/useConfirmStore";

// Libs
import clsx from "clsx";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

// Types
import { IMenuItem } from "@/features/shared/types";

// Utils
import { cn } from "@/lib/utils";
import icon from "@/assets/images/lstv-icon.png";

interface FilteredMenuItem extends IMenuItem {
	hasChildren?: boolean;
	shouldAutoExpand?: boolean;
}

const SideBarMenu = () => {
	const navigate = useNavigate();
	const { user, logout } = useAuthStore();
	const queryClient = useQueryClient();
	const { confirm, setLoading: setConfirmLoading, close } = useConfirmStore();
	const { menuTree, isLoading, isFetching, isError } = useMenuStore();
	const { isOpen } = useSidebarStore();

	const { mutateAsync: logoutMutation, isPending } = useLogoutMutation();

	const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
	const [searchTerm, setSearchTerm] = useState("");
	const [searchCollapsedMenus, setSearchCollapsedMenus] = useState<Set<string>>(new Set());

	const [debouncedSearchTerm] = useDebounce(searchTerm, 200);

	const filteredMenuTree = useMemo((): FilteredMenuItem[] => {
		const query = debouncedSearchTerm.trim().toLowerCase();
		if (!menuTree.length) return [];

		const mapWithMetadata = (items: IMenuItem[], autoExpand = false): FilteredMenuItem[] =>
			items.map((item) => ({
				...item,
				children: item.children ? mapWithMetadata(item.children, autoExpand) : [],
				hasChildren: !!item.children?.length,
				shouldAutoExpand: autoExpand,
			}));

		if (!query.length) return mapWithMetadata(menuTree);

		const filterTree = (items: IMenuItem[]): FilteredMenuItem[] =>
			items.reduce<FilteredMenuItem[]>((acc, item) => {
				const children = item.children ? filterTree(item.children) : [];
				const isMatch = item.name.toLowerCase().includes(query);
				const shouldAutoExpand = children.length > 0;

				if (isMatch || children.length > 0) {
					acc.push({
						...item,
						children: children.length ? children : item.children ?? [],
						hasChildren: !!item.children?.length,
						shouldAutoExpand,
					});
				}
				return acc;
			}, []);

		return filterTree(menuTree);
	}, [menuTree, debouncedSearchTerm]);

	const searchExpandedMenus = useMemo(() => {
		if (!debouncedSearchTerm.trim().length) return new Set<string>();

		const codes = new Set<string>();
		const collect = (items: FilteredMenuItem[]) => {
			items.forEach((item) => {
				if (item.children?.length && item.shouldAutoExpand) {
					codes.add(item.code);
					collect(item.children as FilteredMenuItem[]);
				}
			});
		};

		collect(filteredMenuTree);
		return codes;
	}, [filteredMenuTree, debouncedSearchTerm]);

	useEffect(() => {
		setSearchCollapsedMenus(new Set());
	}, [debouncedSearchTerm]);

	const resolvedExpandedMenus = useMemo(() => {
		if (!debouncedSearchTerm.trim().length) return expandedMenus;

		const merged = new Set(expandedMenus);
		searchExpandedMenus.forEach((code) => {
			if (!searchCollapsedMenus.has(code)) {
				merged.add(code);
			} else {
				merged.delete(code);
			}
		});
		return merged;
	}, [expandedMenus, searchCollapsedMenus, searchExpandedMenus, debouncedSearchTerm]);

	const toggleMenu = useCallback(
		(menuCode: string) => {
            const toggleSetItem = (set: Set<string>, value: string) => {
                if (set.has(value)) set.delete(value);
                else set.add(value);
            };

			if (debouncedSearchTerm.trim().length && searchExpandedMenus.has(menuCode)) {
				setSearchCollapsedMenus((prev) => {
					const next = new Set(prev);
					toggleSetItem(next, menuCode);
					return next;
				});
				return;
			}

			setExpandedMenus((prev) => {
				const next = new Set(prev);
				toggleSetItem(next, menuCode);
				return next;
			});
		},
		[debouncedSearchTerm, searchExpandedMenus]
	);

	const handleLogout = async () => {
		const confirmed = await confirm({
			title: "Logout",
			description: "Are you sure you want to logout?",
		});
		if (!confirmed) return;

		setConfirmLoading(true);
		const toastId = toast.loading("Logging out...");
		try {
			await logoutMutation();
			logout();
			navigate("/login");
			toast.success("Logged out successfully", { id: toastId });
		} catch (error) {
			console.error(error);
			toast.error(error?.message || "Failed to logout", { id: toastId });
		} finally {
			close();
			setConfirmLoading(false);
		}
	};

	return (
		<aside
			className={clsx(
				"fixed left-0 top-0 z-40 h-screen transition-all duration-300 shadow bg-inherit",
				isOpen ? "w-64" : "w-16"
			)}
		>
			<div className="flex h-full flex-col">
				{/* Logo */}
				<div className="flex h-16 items-center justify-center border-b border-sidebar-border/10 px-4">
					<img src={icon} className="h-8 w-8" />
					{isOpen && (
						<h1 className="text-xl font-bold text-primary ml-2 line-clamp-1">
							HR Connect
						</h1>
					)}
				</div>

				{/* Navigation */}
				<nav className={cn("flex-1 space-y-1 px-2 pb-2 overflow-y-auto menu-list", !isOpen && "pt-2")}>
					{isOpen && (
						<div className="sticky top-0 z-10 bg-background pt-2 pb-4">
							<Input
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								placeholder="Search"
								className="bg-muted/50"
								aria-label="Search menu"
							/>
						</div>
					)}

					{isLoading || isFetching ? (
						<div className="space-y-1">
							{Array.from({ length: 11 }).map((_, index) => (
								<div key={`skeleton-${index}`} className="px-2">
									<div className="flex items-center gap-3 rounded-lg">
										<Skeleton className="h-4 w-4 flex-shrink-0" />
										{isOpen && <Skeleton className="h-9 flex-1" />}
									</div>
								</div>
							))}
						</div>
					) : isError ? (
						<div className={cn("px-2 py-3 text-sm text-muted-foreground", !isOpen && "hidden")}>
							Failed to load menu
						</div>
					) : !menuTree.length ? (
						<div className={cn("px-2 py-3 text-sm text-muted-foreground", !isOpen && "hidden")}>
							No menu available
						</div>
					) : filteredMenuTree.length ? (
						filteredMenuTree.map((item) => (
							<MenuItem
								key={item.code}
								item={item}
								sidebarOpen={isOpen}
								expandedMenus={resolvedExpandedMenus}
								toggleMenu={toggleMenu}
							/>
						))
					) : (
						<div className={cn("px-2 py-3 text-sm text-muted-foreground", !isOpen && "hidden")}>
							No matches found
						</div>
					)}
				</nav>

				{/* User section */}
				<div className="border-t border-sidebar-border/25 p-2">
					{isOpen ? (
						<>
							<div className="mb-2 rounded-lg bg-accent text-accent-foreground px-3 py-2">
								<p className="text-sm font-medium truncate">{user?.email || user?.username}</p>
								<p className="text-xs">{user?.user_type && "Supervisor"}</p>
							</div>
							<Button
								onClick={handleLogout}
								variant="ghost"
								size="sm"
								className="w-full justify-start text-sidebar-foreground hover:bg-primary"
								aria-label="Sign out"
							>
								<LogOut className="mr-2 h-4 w-4" />
								Sign Out
							</Button>
						</>
					) : (
						<Button
							onClick={handleLogout}
							variant="ghost"
							size="icon"
							className="w-full text-sidebar-foreground hover:bg-primary"
							title="Sign Out"
							aria-label="Sign out"
						>
							<LogOut className="h-5 w-5" />
						</Button>
					)}
				</div>
			</div>
		</aside>
	);
};

export default SideBarMenu;
