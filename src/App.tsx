import { useState, useCallback, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider, useAtom, useAtomValue } from "jotai";
import { useBunja, BunjaStoreProvider } from "bunja/react";
import { css } from "../styled-system/css";
import { Sidebar } from "./components/sidebar";
import { DefDetail } from "./components/def-detail";
import { NamespaceView } from "./components/view/namespace-view";
import { OverviewView } from "./components/view/overview-view";
import { FileView } from "./components/view/file-view";
import { CommandPalette } from "./components/command-palette";
import {
  bdlBunja,
  serverUrlScope,
  selectedStandardAtom,
  selectedModuleAtom,
  serverUrlBunja,
} from "./state/bdl";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

type ViewMode = "explorer" | "overview";

type Selection =
  | { type: "none" }
  | { type: "namespace"; path: string }
  | { type: "def"; path: string }
  | { type: "file"; namespacePath: string }; // leaf namespace with defs

// URL helpers
const buildUrl = (
  viewMode: ViewMode,
  selection: Selection,
  scrollTo?: string | null,
): string => {
  const params = new URLSearchParams();
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

const parseUrl = (): {
  viewMode: ViewMode;
  selection: Selection;
  scrollTo: string | null;
} => {
  const params = new URLSearchParams(window.location.search);
  const view = params.get("view");
  const ns = params.get("ns");
  const def = params.get("def");
  const file = params.get("file");
  const scroll = params.get("scroll");

  const viewMode: ViewMode = view === "overview" ? "overview" : "explorer";

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

  return { viewMode, selection, scrollTo: scroll };
};

const ViewModeToggle = ({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}) => {
  return (
    <div
      className={css({
        position: "fixed",
        top: "4",
        right: "4",
        display: "flex",
        bg: "#FFFFFF",
        border: "1px solid #E8E4DE",
        borderRadius: "lg",
        p: "1",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        zIndex: 100,
      })}
    >
      <button
        onClick={() => onChange("explorer")}
        className={css({
          px: "3",
          py: "1.5",
          fontSize: "sm",
          fontWeight: mode === "explorer" ? "600" : "normal",
          color: mode === "explorer" ? "#D97706" : "#78716C",
          bg: mode === "explorer" ? "rgba(217, 119, 6, 0.1)" : "transparent",
          borderRadius: "md",
          cursor: "pointer",
          transition: "all 0.15s ease",
          _hover: {
            bg: mode === "explorer" ? "rgba(217, 119, 6, 0.1)" : "#F5F3EF",
          },
        })}
      >
        Explorer
      </button>
      <button
        onClick={() => onChange("overview")}
        className={css({
          px: "3",
          py: "1.5",
          fontSize: "sm",
          fontWeight: mode === "overview" ? "600" : "normal",
          color: mode === "overview" ? "#D97706" : "#78716C",
          bg: mode === "overview" ? "rgba(217, 119, 6, 0.1)" : "transparent",
          borderRadius: "md",
          cursor: "pointer",
          transition: "all 0.15s ease",
          _hover: {
            bg: mode === "overview" ? "rgba(217, 119, 6, 0.1)" : "#F5F3EF",
          },
        })}
      >
        Overview
      </button>
    </div>
  );
};

const AppContent = () => {
  // Parse initial state from URL
  const initialState = parseUrl();
  const [viewMode, setViewMode] = useState<ViewMode>(initialState.viewMode);
  const [selection, setSelection] = useState<Selection>(initialState.selection);
  const [scrollToPath, setScrollToPath] = useState<string | null>(
    initialState.scrollTo,
  );
  const [sidebarExpandPath, setSidebarExpandPath] = useState<string | null>(
    () => {
      // Set initial expand path based on selection
      if (initialState.selection.type === "def") {
        return initialState.selection.path.split(".").slice(0, -1).join(".");
      } else if (initialState.selection.type === "file") {
        return initialState.selection.namespacePath;
      } else if (initialState.selection.type === "namespace") {
        return initialState.selection.path;
      }
      return null;
    },
  );
  const [sidebarWidth, setSidebarWidth] = useState(320);

  const { serverUrlAtom } = useBunja(serverUrlBunja);
  const [serverUrl] = useAtom(serverUrlAtom);

  const { irQueryAtom, standardsQueryAtom, moduleTextQueryAtom } = useBunja(
    bdlBunja,
    [serverUrlScope.bind(serverUrl)],
  );

  const {
    data: standards,
    isLoading: isLoadingStandards,
    error: standardsError,
  } = useAtomValue(standardsQueryAtom);
  const { data: ir, isLoading: isLoadingIr } = useAtomValue(irQueryAtom);
  const { data: moduleText, isLoading: isLoadingModuleText } =
    useAtomValue(moduleTextQueryAtom);
  const [selectedStandard, setSelectedStandard] = useAtom(selectedStandardAtom);
  const [, setSelectedModule] = useAtom(selectedModuleAtom);

  // Set module for file view from URL
  useEffect(() => {
    if (initialState.selection.type === "file") {
      setSelectedModule(initialState.selection.namespacePath);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (standards && standards.length > 0 && !selectedStandard) {
    setSelectedStandard(standards[0]);
  }

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const state = parseUrl();
      setViewMode(state.viewMode);
      setSelection(state.selection);
      setScrollToPath(state.scrollTo);

      // Update module for file view
      if (state.selection.type === "file") {
        setSelectedModule(state.selection.namespacePath);
      }

      // Update sidebar expand path
      if (state.selection.type === "def") {
        setSidebarExpandPath(
          state.selection.path.split(".").slice(0, -1).join("."),
        );
      } else if (state.selection.type === "file") {
        setSidebarExpandPath(state.selection.namespacePath);
      } else if (state.selection.type === "namespace") {
        setSidebarExpandPath(state.selection.path);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [setSelectedModule]);

  const navigate = useCallback(
    (
      newViewMode: ViewMode,
      newSelection: Selection,
      scroll?: string | null,
    ) => {
      const url = buildUrl(newViewMode, newSelection, scroll);
      window.history.pushState(null, "", url);
      setViewMode(newViewMode);
      setSelection(newSelection);
      if (scroll !== undefined) {
        setScrollToPath(scroll);
      }
    },
    [],
  );

  const handleSelectDef = useCallback(
    (defPath: string) => {
      const newSelection: Selection = { type: "def", path: defPath };
      navigate(viewMode, newSelection);
      // Expand sidebar to show the definition's namespace
      const namespacePath = defPath.split(".").slice(0, -1).join(".");
      setSidebarExpandPath(namespacePath);
    },
    [viewMode, navigate],
  );

  const handleSelectNamespace = useCallback(
    (namespacePath: string) => {
      if (viewMode === "overview") {
        // In overview mode, scroll to the namespace section and update URL
        const newSelection: Selection = { type: "none" };
        navigate(viewMode, newSelection, namespacePath);
      } else {
        const newSelection: Selection = {
          type: "namespace",
          path: namespacePath,
        };
        navigate(viewMode, newSelection);
      }
      // Expand sidebar to show the namespace
      setSidebarExpandPath(namespacePath);
    },
    [viewMode, navigate],
  );

  const handleTypeClick = useCallback(
    (typePath: string) => {
      const newSelection: Selection = { type: "def", path: typePath };
      navigate(viewMode, newSelection);
    },
    [viewMode, navigate],
  );

  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      let newSelection: Selection;
      if (mode === "overview") {
        newSelection = { type: "none" };
      } else {
        newSelection = { type: "namespace", path: "" };
      }
      setSelectedModule(null);
      navigate(mode, newSelection);
    },
    [navigate, setSelectedModule],
  );

  const handleSelectFile = useCallback(
    (namespacePath: string) => {
      // Module path is the same as namespace path for leaf namespaces
      setSelectedModule(namespacePath);
      const newSelection: Selection = { type: "file", namespacePath };
      navigate(viewMode, newSelection);
      setSidebarExpandPath(namespacePath);
    },
    [viewMode, navigate, setSelectedModule],
  );

  const isLoading = isLoadingStandards || isLoadingIr;
  const error = standardsError?.message || null;

  const selectedDefPath = selection.type === "def" ? selection.path : null;
  const selectedNamespace =
    selection.type === "namespace" ? selection.path : null;
  const selectedFile =
    selection.type === "file" ? selection.namespacePath : null;

  return (
    <div
      className={css({
        display: "flex",
        minHeight: "100vh",
        bg: "#FAF9F6",
      })}
    >
      <Sidebar
        onSelectDef={handleSelectDef}
        onSelectNamespace={handleSelectNamespace}
        onSelectFile={handleSelectFile}
        selectedDefPath={selectedDefPath}
        selectedNamespace={viewMode === "explorer" ? selectedNamespace : null}
        selectedFile={selectedFile}
        expandPath={sidebarExpandPath}
        ir={ir ?? null}
        standards={standards ?? []}
        selectedStandard={selectedStandard}
        setSelectedStandard={setSelectedStandard}
        isLoading={isLoading}
        error={error}
        width={sidebarWidth}
        onWidthChange={setSidebarWidth}
      />
      <main
        className={css({
          flex: "1",
          overflowY: "auto",
          height: "100vh",
          position: "relative",
        })}
      >
        <ViewModeToggle mode={viewMode} onChange={handleViewModeChange} />

        {selection.type === "def" && ir ? (
          <DefDetail
            defPath={selection.path}
            ir={ir}
            onTypeClick={handleTypeClick}
          />
        ) : selection.type === "file" && ir ? (
          <FileView
            ir={ir}
            namespacePath={selectedFile!}
            moduleText={moduleText ?? null}
            isLoadingModuleText={isLoadingModuleText}
            onSelectDef={handleSelectDef}
            onTypeClick={handleTypeClick}
            onBack={() =>
              handleSelectNamespace(
                selectedFile!.split(".").slice(0, -1).join("."),
              )
            }
          />
        ) : viewMode === "overview" && ir ? (
          <OverviewView
            ir={ir}
            scrollToPath={scrollToPath}
            onSelectDef={handleSelectDef}
          />
        ) : viewMode === "explorer" && ir ? (
          <NamespaceView
            ir={ir}
            namespacePath={selectedNamespace ?? ""}
            onSelectDef={handleSelectDef}
            onSelectNamespace={handleSelectNamespace}
            onSelectFile={handleSelectFile}
          />
        ) : (
          <div
            className={css({
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#8B8680",
              fontSize: "lg",
              gap: "4",
            })}
          >
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M32 8L56 24V40L32 56L8 40V24L32 8Z"
                stroke="#D97706"
                strokeWidth="2"
                fill="none"
              />
              <circle cx="32" cy="32" r="8" fill="#D97706" opacity="0.2" />
              <circle cx="32" cy="32" r="4" fill="#D97706" />
            </svg>
            <span>Select a definition from the sidebar</span>
          </div>
        )}
      </main>
      <CommandPalette
        ir={ir ?? null}
        onSelectDef={handleSelectDef}
        onSelectFile={handleSelectFile}
      />
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <JotaiProvider>
        <BunjaStoreProvider>
          <AppContent />
        </BunjaStoreProvider>
      </JotaiProvider>
    </QueryClientProvider>
  );
};

export default App;
