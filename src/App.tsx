import { useCallback, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Provider as JotaiProvider,
  useAtom,
  useAtomValue,
  useSetAtom,
} from "jotai";
import { useBunja, BunjaStoreProvider } from "bunja/react";
import { css } from "../styled-system/css";
import { vstack } from "../styled-system/patterns";
import { Sidebar } from "./components/sidebar/index";
import { DefDetail } from "./components/def-detail";
import { NamespaceView } from "./components/view/namespace-view";
import { OverviewView } from "./components/view/overview-view";
import { FileView } from "./components/view/file-view";
import { CommandPalette } from "./components/command-palette";
import {
  viewBunja,
  serverUrlScope,
  coreBunja,
  sidebarBunja,
  serverUrlBunja,
  type ViewMode,
  type Selection,
  buildUrl,
} from "./state/bdl";

// ============================================================================
// Query Client
// ============================================================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

// ============================================================================
// Exported Component
// ============================================================================

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

// ============================================================================
// Internal Components
// ============================================================================

const AppContent = () => {
  const { serverUrlAtom } = useBunja(serverUrlBunja);
  const [serverUrl, setServerUrlAtom] = useAtom(serverUrlAtom);

  const setServerUrl = useCallback(
    (url: string) => {
      setServerUrlAtom(url);
    },
    [setServerUrlAtom],
  );

  const {
    locationAtom,
    viewModeAtom,
    selectionAtom,
    scrollToPathAtom,
    serverFromUrlAtom,
    standardFromUrlAtom,
    selectedModuleAtom,
  } = useBunja(coreBunja);

  const [, setLocation] = useAtom(locationAtom);
  const viewMode = useAtomValue(viewModeAtom);
  const selection = useAtomValue(selectionAtom);
  const scrollToPath = useAtomValue(scrollToPathAtom);
  const serverFromUrl = useAtomValue(serverFromUrlAtom);
  const standardFromUrl = useAtomValue(standardFromUrlAtom);
  const setSelectedModule = useSetAtom(selectedModuleAtom);

  const { sidebarExpandPathAtom } = useBunja(sidebarBunja);
  const setSidebarExpandPath = useSetAtom(sidebarExpandPathAtom);

  const {
    irQueryAtom,
    standardsQueryAtom,
    moduleTextQueryAtom,
    selectedStandardAtom,
  } = useBunja(viewBunja, [serverUrlScope.bind(serverUrl)]);

  const { data: standards } = useAtomValue(standardsQueryAtom);
  const { data: ir } = useAtomValue(irQueryAtom);
  const { data: moduleText, isLoading: isLoadingModuleText } =
    useAtomValue(moduleTextQueryAtom);
  const [selectedStandard, setSelectedStandardAtom] =
    useAtom(selectedStandardAtom);

  const setSelectedStandard = useCallback(
    (standard: string | null) => {
      setSelectedStandardAtom(standard);
      setLocation((prev) => {
        const params = new URLSearchParams(prev.searchParams);
        if (standard) {
          params.set("standard", standard);
        } else {
          params.delete("standard");
        }
        return {
          ...prev,
          searchParams: params,
        };
      });
    },
    [setSelectedStandardAtom, setLocation],
  );

  // Sync server URL from URL to atom on mount
  useEffect(() => {
    if (serverFromUrl && serverFromUrl !== serverUrl) {
      setServerUrl(serverFromUrl);
    }
  }, [serverFromUrl, serverUrl, setServerUrl]);

  // Auto-select first standard and update URL only if URL doesn't have one
  useEffect(() => {
    if (
      !standardFromUrl &&
      standards &&
      standards.length > 0 &&
      !selectedStandard
    ) {
      setSelectedStandard(standards[0]);
    }
  }, [standardFromUrl, standards, selectedStandard, setSelectedStandard]);

  // Update selectedModule when selection changes to file
  useEffect(() => {
    if (selection.type === "file") {
      setSelectedModule(selection.namespacePath);
    }
  }, [selection, setSelectedModule]);

  // Update sidebar expand path when selection changes
  useEffect(() => {
    if (selection.type === "def") {
      setSidebarExpandPath(selection.path.split(".").slice(0, -1).join("."));
    } else if (selection.type === "file") {
      setSidebarExpandPath(selection.namespacePath);
    } else if (selection.type === "namespace") {
      setSidebarExpandPath(selection.path);
    }
  }, [selection, setSidebarExpandPath]);

  const navigate = useCallback(
    (
      newViewMode: ViewMode,
      newSelection: Selection,
      scroll?: string | null,
    ) => {
      const searchParams = buildUrl(
        newViewMode,
        newSelection,
        scroll,
        serverUrl,
        selectedStandard,
      );
      setLocation((prev) => ({
        ...prev,
        searchParams: new URLSearchParams(searchParams.replace("?", "")),
      }));
    },
    [setLocation, serverUrl, selectedStandard],
  );

  const handleSelectDef = useCallback(
    (defPath: string) => {
      const newSelection: Selection = { type: "def", path: defPath };
      navigate(viewMode, newSelection);
      const namespacePath = defPath.split(".").slice(0, -1).join(".");
      setSidebarExpandPath(namespacePath);
      setSelectedModule(namespacePath);
    },
    [viewMode, navigate, setSidebarExpandPath, setSelectedModule],
  );

  const handleSelectNamespace = useCallback(
    (namespacePath: string) => {
      if (viewMode === "overview") {
        const newSelection: Selection = { type: "none" };
        navigate(viewMode, newSelection, namespacePath);
      } else {
        const newSelection: Selection = {
          type: "namespace",
          path: namespacePath,
        };
        navigate(viewMode, newSelection);
      }
      setSidebarExpandPath(namespacePath);
    },
    [viewMode, navigate, setSidebarExpandPath],
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
      setSelectedModule(namespacePath);
      const newSelection: Selection = { type: "file", namespacePath };
      navigate(viewMode, newSelection);
      setSidebarExpandPath(namespacePath);
    },
    [viewMode, navigate, setSelectedModule, setSidebarExpandPath],
  );

  const selectedNamespace =
    selection.type === "namespace" ? selection.path : null;
  const selectedFile =
    selection.type === "file" ? selection.namespacePath : null;

  return (
    <div
      className={css({
        display: "flex",
        minHeight: "100vh",
        bg: "bg",
      })}
    >
      <Sidebar
        onSelectDef={handleSelectDef}
        onSelectNamespace={handleSelectNamespace}
        onSelectFile={handleSelectFile}
      />
      <main
        className={css({
          flex: "1",
          overflowY: "auto",
          height: "100vh",
          position: "relative",
          pt: "20",
          md: {
            pt: "0",
          },
        })}
      >
        <ViewModeToggle mode={viewMode} onChange={handleViewModeChange} />

        {selection.type === "def" && ir ? (
          <DefDetail
            defPath={selection.path}
            ir={ir}
            onTypeClick={handleTypeClick}
            moduleText={moduleText ?? null}
            isLoadingModuleText={isLoadingModuleText}
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
          <EmptyState />
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
        bg: "bg.card",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "border",
        borderRadius: "lg",
        p: "1",
        boxShadow: "dropdown",
        zIndex: 100,
        md: {
          top: "4",
          right: "4",
        },
      })}
    >
      <ToggleButton
        active={mode === "overview"}
        onClick={() => onChange("overview")}
      >
        Overview
      </ToggleButton>
      <ToggleButton
        active={mode === "explorer"}
        onClick={() => onChange("explorer")}
      >
        Explorer
      </ToggleButton>
    </div>
  );
};

const ToggleButton = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={css({
      px: "3",
      py: "1.5",
      fontSize: "sm",
      fontWeight: active ? "600" : "normal",
      color: active ? "accent" : "text.muted",
      bg: active ? "accent.light" : "transparent",
      borderRadius: "md",
      cursor: "pointer",
      transition: "all 0.15s ease",
      _hover: {
        bg: active ? "accent.light" : "bg.muted",
      },
    })}
  >
    {children}
  </button>
);

const EmptyState = () => (
  <div
    className={vstack({
      gap: "4",
      justify: "center",
      height: "100%",
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
        stroke="var(--colors-accent-default)"
        strokeWidth="2"
        fill="none"
      />
      <circle cx="32" cy="32" r="8" fill="var(--colors-accent-default)" opacity="0.2" />
      <circle cx="32" cy="32" r="4" fill="var(--colors-accent-default)" />
    </svg>
    <span className={css({ color: "text.muted", fontSize: "lg" })}>
      Select a definition from the sidebar
    </span>
  </div>
);
