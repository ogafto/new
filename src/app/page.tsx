import CanvasProvider from "@/components/canvas/CanvasProvider";
import World from "@/components/canvas/World";
import TopBar from "@/components/chrome/TopBar";
import Toolbar from "@/components/chrome/Toolbar";

export default function Home() {
  return (
    <CanvasProvider>
      <TopBar />
      <World />
      <Toolbar />
    </CanvasProvider>
  );
}
