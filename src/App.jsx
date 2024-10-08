import "./App.css";
import TreeSelect from "./components/TreeSelect";
import {treeData} from "./initial-values";

function App() {
  return (
    <>
      <TreeSelect dataSource={treeData} defaultSelectedNodeIds={[2]}/>
    </>
  );
}

export default App;
