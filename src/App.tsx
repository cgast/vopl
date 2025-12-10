import { ReactFlowProvider } from '@xyflow/react';
import { Header } from './components/Header/Header';
import { Canvas } from './components/Canvas/Canvas';
import { NodeSpecPanel } from './components/Panels/NodeSpecPanel';
import { SystemContextPanel } from './components/Panels/SystemContextPanel';
import { SpecOMeter } from './components/Panels/SpecOMeter';

function App() {
  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-100">
        {/* Header */}
        <Header />

        {/* Main content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Canvas */}
          <Canvas />

          {/* Node Spec Panel (conditionally rendered) */}
          <NodeSpecPanel />
        </div>

        {/* Spec-o-Meter footer */}
        <SpecOMeter />

        {/* System Context Modal */}
        <SystemContextPanel />
      </div>
    </ReactFlowProvider>
  );
}

export default App;
