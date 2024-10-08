import React, { useState, useEffect, useRef } from "react";
import { ChevronDownIcon, ChevronRightIcon, CheckCircleIcon, MinusCircleIcon } from "@heroicons/react/24/solid";
import { CheckCircleIcon as OutlineCheckCircleIcon } from "@heroicons/react/24/outline";

const TreeSelect = ({ dataSource, defaultSelectedNodeIds = [] }) => {
  const [selectedNodeIds, setSelectedNodeIds] = useState(getFromLocalStorageOrDefault(SELECTED_NODES_KEY, defaultSelectedNodeIds));
  const [expandedNodeIds, setExpandedNodeIds] = useState(getFromLocalStorageOrDefault(EXPANDED_NODES_KEY, {}));
  
  // useRef hook'u, React bileşenlerinde mutable (değiştirilebilir) bir referans oluşturmak için kullanılır.
  // Bu referans, bileşen yeniden render edildiğinde değişmeden kalır.
  // useRef genellikle DOM elemanlarına doğrudan erişim sağlamak veya bileşenler arasında mutable bir değer paylaşmak için kullanılır.
  const isSelectedNodesInitialized = useRef(false);
  const isExpandedNodesInitialized = useRef(false);

  // Bu useEffect hook'u, defaultSelectedNodeIds prop'u değiştiğinde veya bileşen ilk render edildiğinde çalışır.
  useEffect(() => {
    if (!isSelectedNodesInitialized.current) {
      setSelectedNodeIds(getFromLocalStorageOrDefault(SELECTED_NODES_KEY, defaultSelectedNodeIds));
      setExpandedNodeIds(getFromLocalStorageOrDefault(EXPANDED_NODES_KEY, {}));
      isSelectedNodesInitialized.current = true;
      isExpandedNodesInitialized.current = true;
    }
  }, [defaultSelectedNodeIds.length]);

  // Bu useEffect hook'u, selectedNodeIds state'i değiştiğinde veya bileşen ilk render edildiğinde çalışır.
  useEffect(() => {
    if (!isSelectedNodesInitialized.current) {
      localStorage.setItem(SELECTED_NODES_KEY, JSON.stringify(selectedNodeIds));
    }
    isSelectedNodesInitialized.current = false;
  }, [selectedNodeIds]);

  // Bu useEffect hook'u, expandedNodeIds state'i değiştiğinde veya bileşen ilk render edildiğinde çalışır.
  useEffect(() => {
    if (!isExpandedNodesInitialized.current) {
      localStorage.setItem(EXPANDED_NODES_KEY, JSON.stringify(expandedNodeIds));
    }
    isExpandedNodesInitialized.current = false;
  }, [expandedNodeIds]);

  const handleSelect = (nodeId) => {
    setSelectedNodeIds(
      isFullySelected(nodeId)
        ? selectedNodeIds.filter((n) => !isDescendantOrSelf(n, nodeId))
        : [...selectedNodeIds, ...getDescendantIds(nodeId, dataSource), nodeId]
    );
  };

  const handleExpansionToggle = (nodeId) => {
    setExpandedNodeIds((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const handleClear = () => {
    setSelectedNodeIds([]);
  };

  const handleReset = () => {
    let selectedNodeIds = [...defaultSelectedNodeIds];
    defaultSelectedNodeIds.forEach((nodeId) => {
      selectedNodeIds = selectedNodeIds.concat(getDescendantIds(nodeId, dataSource))
    });
    setSelectedNodeIds(selectedNodeIds);
  };

  /// <summary>
  /// Belirli bir düğümün tüm alt düğümlerinin id değerlerini alır.
  /// </summary>
  const getDescendantIds = (nodeId, nodes) => {
    let descendantIds = [];
    for (let node of nodes) {
      if (node.id === nodeId) {
        if (node.children) {
          for (let child of node.children) {
            descendantIds.push(child.id);
            descendantIds = descendantIds.concat(getDescendantIds(child.id, node.children));
          }
        }
      } else if (node.children) {
        descendantIds = descendantIds.concat(getDescendantIds(nodeId, node.children));
      }
    }
    return descendantIds;
  };

  /// <summary>
  /// Belirli bir düğümün, hedef düğümün alt düğümlerinden biri ya da kendisi olup olmadığını kontrol eder.
  /// </summary>
  const isDescendantOrSelf = (nodeId, targetId) => {
    return nodeId === targetId || getDescendantIds(targetId, dataSource).includes(nodeId);
  };

  /// <summary>
  /// Belirli bir düğümün tam olarak seçili (kendisi ve tüm alt düğümleri seçili) olup olmadığını kontrol eder.
  /// </summary>
  const isFullySelected = (nodeId) => {
    const descendantIds = getDescendantIds(nodeId, dataSource);
    return [nodeId, ...descendantIds].every((id) => selectedNodeIds.includes(id));
  };

  /// <summary>
  /// Belirli bir düğümün kısmi olarak seçili (bazı alt düğümleri seçili ama tamamı değil) olup olmadığını kontrol eder.
  /// </summary>
  const isPartiallySelected = (nodeId) => {
    const descendantIds = getDescendantIds(nodeId, dataSource);
    return descendantIds.some((id) => selectedNodeIds.includes(id)) && !isFullySelected(nodeId);
  };

  /// <summary>
  /// Ağaç yapısında tam olarak seçili (kendisi ve tüm alt düğümleri seçili) olan düğümleri döndürür.
  /// </summary>
  const getFullySelectedNodes = (nodes) => {
    let fullySelectedNodes = [];
    nodes.forEach((node) => {
      if (isFullySelected(node.id)) {
        fullySelectedNodes.push(node);
      } else if (node.children) {
        fullySelectedNodes = fullySelectedNodes.concat(getFullySelectedNodes(node.children));
      }
    });
    return fullySelectedNodes;
  };

  const getExpansionIcon = (nodeId) => {
    return expandedNodeIds[nodeId] ? <ChevronDownIcon className="h-5 w-5 text-blue-500" /> : <ChevronRightIcon className="h-5 w-5 text-blue-500" />;
  };

  const getSelectionIcon = (nodeId) => {
    if (isFullySelected(nodeId)) {
      return <CheckCircleIcon className="h-5 w-5 text-green-700" />;
    } else if (isPartiallySelected(nodeId)) {
      return <MinusCircleIcon className="h-5 w-5 text-green-300" />;
    } else {
      return <OutlineCheckCircleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  /// <summary>
  /// Ağaç yapısını render eder.
  /// </summary>
  const renderTree = (nodes) => {
    return nodes.map((node) => (
      <div key={node.id} className="mt-2">
        <div className="flex items-center">
          {node.children && (
            <button onClick={() => handleExpansionToggle(node.id)} className="mr-2">
              {getExpansionIcon(node.id)}
            </button>
          )}
          <button onClick={() => handleSelect(node.id)} className="mr-2">
            {getSelectionIcon(node.id)}
          </button>
          <span>{node.name}</span>
        </div>
        {node.children && expandedNodeIds[node.id] && <div className="ml-6 border-l pl-4">{renderTree(node.children)}</div>}
      </div>
    ));
  };

  return (
    <div className="flex w-full space-x-4 p-4">
      {/* Sol Kısım: Ağaç Yapısı */}
      <div className="flex-1 bg-white p-4 border rounded-lg shadow-md">
        <div className="flex justify-start items-center mb-4">
          <div className="flex gap-2">
            <button onClick={handleReset} className="text-sm text-blue-500 border border-blue-500 rounded px-2 py-1 hover:bg-blue-100">
              Reset
            </button>
            <button onClick={handleClear} className="text-sm text-red-500 border border-red-500 rounded px-2 py-1 hover:bg-red-100">
              Clear
            </button>
          </div>
        </div>
        {renderTree(dataSource)}
      </div>

      {/* Sağ Kısım: Tam Seçili Öğeler */}
      <div className="flex-1 bg-gray-50 p-4 border rounded-lg shadow-md">
        <h2 className="font-semibold text-lg mb-4">Fully Selected Nodes</h2>
        <ul>
          {getFullySelectedNodes(dataSource).map((node) => (
            <li key={node.id} className="mb-2 text-green-700">
              {node.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TreeSelect;

const SELECTED_NODES_KEY = "selectedNodes";
const EXPANDED_NODES_KEY = "expandedNodes";

const getFromLocalStorageOrDefault = (key, defaultValue) => {
  const savedValue = localStorage.getItem(key);
  return savedValue ? JSON.parse(savedValue) : defaultValue;
};
