import type { ModuleDef } from "../types";
import ChatModule from "../modules/ChatModule";
import ClaudeCodeModule from "../modules/ClaudeCodeModule";
import DashboardModule from "../modules/DashboardModule";
import DocsModule from "../modules/DocsModule";
import FluxCanvasModule from "../modules/FluxCanvasModule";
import GenericModule from "../modules/GenericModule";
import LiveModule from "../modules/LiveModule";
import LogsModule from "../modules/LogsModule";
import MarketingModule from "../modules/MarketingModule";
import PatentSearchModule from "../modules/PatentSearchModule";
import SessionsModule from "../modules/SessionsModule";
import StatusCardModule from "../modules/StatusCardModule";

/** Maps a module definition to its mock view component. */
export default function ModuleHost({
  module,
  winId,
  configLabel,
  onSetLiveUrl,
  onRemoveWindow,
}: {
  module: ModuleDef;
  winId?: string;
  configLabel?: string;
  onSetLiveUrl?: (url: string) => void;
  onRemoveWindow?: () => void;
}) {
  // Any module with a URL linked renders live; unlinking reverts to its mock.
  // Keyed by module id: tab switches between two live modules must NOT reuse
  // the component instance, or the URL chrome's edit/draft state leaks across.
  if (module.url || module.type === "live") {
    return (
      <LiveModule
        key={module.id}
        module={module}
        winId={winId}
        onSetUrl={onSetLiveUrl}
        onRemove={onRemoveWindow}
      />
    );
  }
  switch (module.type) {
    case "statusCard":
      return <StatusCardModule module={module} />;
    case "logs":
      return <LogsModule module={module} />;
    case "webapp":
      return <ClaudeCodeModule module={module} />;
    case "canvas":
      return <FluxCanvasModule module={module} />;
    case "dashboard":
      return <DashboardModule module={module} />;
    case "chat":
      return <ChatModule module={module} />;
    case "sessions":
      return <SessionsModule module={module} />;
    case "docs":
      return <DocsModule module={module} />;
    case "patent":
      return <PatentSearchModule module={module} configLabel={configLabel} />;
    case "marketing":
      return <MarketingModule module={module} />;
    default:
      return <GenericModule module={module} />;
  }
}
