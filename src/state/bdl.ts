import { createContext } from "react";
import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import { atomWithLocation } from "jotai-location";
import { bunja } from "bunja";
import { createScopeFromContext } from "bunja/react";
import { createBdlClient } from "../api/bdl-client";
import type { BdlIr } from "../types/bdl";

// ============================================================================
// Types
// ============================================================================

export type ViewMode = "explorer" | "overview";

export type Selection =
  | { type: "none" }
  | { type: "namespace"; path: string }
  | { type: "def"; path: string }
  | { type: "file"; namespacePath: string };

// ============================================================================
// Context and Scope
// ============================================================================

export const ServerUrlContext = createContext<string>("");
export const serverUrlScope = createScopeFromContext(ServerUrlContext);

// ============================================================================
// Utility Functions
// ============================================================================

export const buildUrl = (
  viewMode: ViewMode,
  selection: Selection,
  scrollTo?: string | null,
  server?: string | null,
  standard?: string | null,
): string => {
  const params = new URLSearchParams();

  if (server) {
    params.set("server", server);
  }

  if (standard) {
    params.set("standard", standard);
  }

  params.set("view", viewMode);

  switch (selection.type) {
    case "namespace":
      if (selection.path) params.set("ns", selection.path);
      break;
    case "def":
      params.set("def", selection.path);
      break;
    case "file":
      params.set("file", selection.namespacePath);
      break;
  }

  if (scrollTo) {
    params.set("scroll", scrollTo);
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "/";
};

export const parseUrl = (
  location: string,
): {
  viewMode: ViewMode;
  selection: Selection;
  scrollTo: string | null;
  server: string | null;
  standard: string | null;
} => {
  const params = new URLSearchParams(location);
  const view = params.get("view");
  const ns = params.get("ns");
  const def = params.get("def");
  const file = params.get("file");
  const scroll = params.get("scroll");
  const server = params.get("server");
  const standard = params.get("standard");

  const viewMode: ViewMode = view === "explorer" ? "explorer" : "overview";

  let selection: Selection;
  if (def) {
    selection = { type: "def", path: def };
  } else if (file) {
    selection = { type: "file", namespacePath: file };
  } else if (ns) {
    selection = { type: "namespace", path: ns };
  } else if (viewMode === "overview") {
    selection = { type: "none" };
  } else {
    selection = { type: "namespace", path: "" };
  }

  return { viewMode, selection, scrollTo: scroll, server, standard };
};

// ============================================================================
// Bunjas
// ============================================================================

export const serverUrlBunja = bunja(() => {
  // Primitive atom for server URL with localStorage
  const serverUrlPrimitiveAtom = atom<string>(
    localStorage.getItem("bdl-server-url") || "",
  );

  // Writeable atom for server URL with localStorage sync
  const serverUrlAtom = atom(
    (get) => get(serverUrlPrimitiveAtom),
    (_get, set, newUrl: string) => {
      localStorage.setItem("bdl-server-url", newUrl);
      set(serverUrlPrimitiveAtom, newUrl);
    },
  );

  return { serverUrlAtom };
});

export const coreBunja = bunja(() => {
  // Use jotai-location for automatic URL sync
  const locationAtom = atomWithLocation();

  // Parse URL once into state object
  const urlStateAtom = atom((get) => {
    const location = get(locationAtom);
    return parseUrl(location.searchParams?.toString() || "");
  });

  // Derived atoms - just extract fields from urlStateAtom
  const viewModeAtom = atom((get) => get(urlStateAtom).viewMode);
  const selectionAtom = atom((get) => get(urlStateAtom).selection);
  const scrollToPathAtom = atom((get) => get(urlStateAtom).scrollTo);
  const serverFromUrlAtom = atom((get) => get(urlStateAtom).server);
  const standardFromUrlAtom = atom((get) => get(urlStateAtom).standard);

  // Primitive atom for selected standard (internal)
  const selectedStandardPrimitiveAtom = atom<string | null>(null);

  // Atom for selected module (for code view)
  const selectedModuleAtom = atom<string | null>(null);

  return {
    locationAtom,
    urlStateAtom,
    viewModeAtom,
    selectionAtom,
    scrollToPathAtom,
    serverFromUrlAtom,
    standardFromUrlAtom,
    selectedStandardPrimitiveAtom,
    selectedModuleAtom,
  };
});

export const sidebarBunja = bunja(() => {
  // Atom for sidebar expand path (which namespace to expand/scroll to)
  const sidebarExpandPathAtom = atom<string | null>(null);

  // Primitive atom for sidebar width with localStorage
  const sidebarWidthPrimitiveAtom = atom<number>(
    Number(localStorage.getItem("bdl-sidebar-width")) || 400,
  );

  // Writeable atom for sidebar width with localStorage sync
  const sidebarWidthAtom = atom(
    (get) => get(sidebarWidthPrimitiveAtom),
    (_get, set, newWidth: number) => {
      localStorage.setItem("bdl-sidebar-width", String(newWidth));
      set(sidebarWidthPrimitiveAtom, newWidth);
    },
  );

  // Primitive atom for sidebar collapsed state with localStorage
  const sidebarCollapsedPrimitiveAtom = atom<boolean>(
    localStorage.getItem("bdl-sidebar-collapsed") === "true",
  );

  // Writeable atom for sidebar collapsed state with localStorage sync
  const sidebarCollapsedAtom = atom(
    (get) => get(sidebarCollapsedPrimitiveAtom),
    (_get, set, newCollapsed: boolean) => {
      localStorage.setItem("bdl-sidebar-collapsed", String(newCollapsed));
      set(sidebarCollapsedPrimitiveAtom, newCollapsed);
    },
  );

  return {
    sidebarExpandPathAtom,
    sidebarWidthAtom,
    sidebarCollapsedAtom,
  };
});

export const bdlBunja = bunja(() => {
  const serverUrl = bunja.use(serverUrlScope);
  const client = createBdlClient(serverUrl);

  const standardsQueryAtom = atomWithQuery<string[]>(() => ({
    queryKey: ["bdl", "standards", serverUrl],
    queryFn: () => client.getStandards(),
  }));

  const modulesQueryAtom = atomWithQuery<string[]>(() => ({
    queryKey: ["bdl", "modules", serverUrl],
    queryFn: () => client.getModules(),
  }));

  return {
    client,
    standardsQueryAtom,
    modulesQueryAtom,
  };
});

export const viewBunja = bunja(() => {
  const serverUrl = bunja.use(serverUrlScope);
  const {
    selectedStandardPrimitiveAtom,
    selectedModuleAtom,
    selectionAtom,
    standardFromUrlAtom,
  } = bunja.use(coreBunja);
  const { client, standardsQueryAtom, modulesQueryAtom } = bunja.use(bdlBunja);

  // Derived atom: Use URL standard first, then user selection, then auto-select first
  const selectedStandardAtom = atom(
    (get) => {
      // 1. Check URL first
      const fromUrl = get(standardFromUrlAtom);
      if (fromUrl) return fromUrl;

      // 2. Check user selection
      const selected = get(selectedStandardPrimitiveAtom);
      if (selected) return selected;

      // 3. Auto-select first standard if available
      const standardsQuery = get(standardsQueryAtom);
      const standards = standardsQuery.data;
      if (standards && standards.length > 0) {
        return standards[0];
      }
      return null;
    },
    (_get, set, newValue: string | null) => {
      set(selectedStandardPrimitiveAtom, newValue);
    },
  );

  const irQueryAtom = atomWithQuery<BdlIr | null>((get) => {
    const selectedStandard = get(selectedStandardAtom);
    return {
      queryKey: ["bdl", "ir", serverUrl, selectedStandard],
      queryFn: async () => {
        if (!selectedStandard) return null;
        return client.getStandardIr(selectedStandard);
      },
      enabled: !!selectedStandard,
    };
  });

  const standardQueryAtom = atomWithQuery((get) => {
    const selectedStandard = get(selectedStandardAtom);
    return {
      queryKey: ["bdl", "standard", serverUrl, selectedStandard],
      queryFn: async () => {
        if (!selectedStandard) return null;
        return client.getStandard(selectedStandard);
      },
      enabled: !!selectedStandard,
    };
  });

  const moduleTextQueryAtom = atomWithQuery<string | null>((get) => {
    const selectedModule = get(selectedModuleAtom);
    return {
      queryKey: ["bdl", "module-text", serverUrl, selectedModule],
      queryFn: async () => {
        if (!selectedModule) return null;
        return client.getModuleText(selectedModule);
      },
      enabled: !!selectedModule,
    };
  });

  // Derived atom: Update selectedModule based on selection
  const syncSelectedModuleAtom = atom(
    (get) => get(selectedModuleAtom),
    (get, set) => {
      const selection = get(selectionAtom);
      if (selection.type === "file") {
        set(selectedModuleAtom, selection.namespacePath);
      }
    },
  );

  return {
    standardsQueryAtom,
    selectedStandardAtom,
    irQueryAtom,
    standardQueryAtom,
    modulesQueryAtom,
    moduleTextQueryAtom,
    syncSelectedModuleAtom,
  };
});
