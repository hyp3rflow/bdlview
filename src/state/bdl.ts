import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import { bunja } from "bunja";
import { createBdlClient } from "../api/bdl-client";
import type { BdlIr } from "../types/bdl";
import { createContext } from "react";
import { createScopeFromContext } from "bunja/react";

// Scope for server URL
export const ServerUrlContext = createContext<string>("");
export const serverUrlScope = createScopeFromContext(ServerUrlContext);

// Atom for selected standard
export const selectedStandardAtom = atom<string | null>(null);

// Atom for selected module (for code view)
export const selectedModuleAtom = atom<string | null>(null);

// Bunja containing all BDL-related atoms, scoped by serverUrl
export const bdlBunja = bunja(() => {
  const serverUrl = bunja.use(serverUrlScope);
  const client = createBdlClient(serverUrl);

  const standardsQueryAtom = atomWithQuery<string[]>(() => ({
    queryKey: ["bdl", "standards", serverUrl],
    queryFn: () => client.getStandards(),
  }));

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

  const modulesQueryAtom = atomWithQuery<string[]>(() => ({
    queryKey: ["bdl", "modules", serverUrl],
    queryFn: () => client.getModules(),
  }));

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

  return {
    client,
    standardsQueryAtom,
    irQueryAtom,
    standardQueryAtom,
    modulesQueryAtom,
    moduleTextQueryAtom,
  };
});

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

  return {
    serverUrlAtom,
  };
});
