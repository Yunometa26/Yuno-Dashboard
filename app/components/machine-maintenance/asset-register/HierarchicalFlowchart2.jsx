import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import _ from 'lodash';

export default function HierarchicalFlowchart2() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Current navigation state
  const [currentLevel, setCurrentLevel] = useState(0);
  const [currentPath, setCurrentPath] = useState([]);
  const [currentNode, setCurrentNode] = useState(null);
  const [childNodes, setChildNodes] = useState([]);

  // Define hierarchy levels - customize these based on your data
  const hierarchyLevels = [
    { name: 'Count of Assets', field: null },
    { name: 'Month', field: 'Month' },
    { name: 'Asset Category', field: 'Asset Category' },
    { name: 'Status', field: 'Status' },
    { name: 'Machine Name', field: 'Machine Name' },
    { name: 'Delay Days', field: 'Delay Days' },
  ];

  // Extract year from date string (DD-MMM-YY format)
  const extractYear = (dateString) => {
    try {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        // Get the year part and ensure it's a 4-digit year
        let year = parts[2];
        // Handle 2-digit years
        if (year.length === 2) {
          year = parseInt(year) < 50 ? "20" + year : "19" + year;
        }
        return year;
      }
    } catch (e) {
      console.error("Error parsing date:", dateString);
    }
    return "Unknown";
  };

  // Load CSV data
  useEffect(() => {
    setLoading(true);
    Papa.parse('/asset1.csv', {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: function(results) {
        if (results.errors.length > 0) {
          setError('Error parsing CSV file');
          setLoading(false);
          return;
        }
        
        // Process the data - extract Year from Registered Date
        const processedData = results.data.map(item => ({
          ...item,
          Year: extractYear(item['Registered Date'])
        }));
        
        setData(processedData);
        processHierarchyLevel(processedData, 0, []);
        setLoading(false);
      },
      error: function(error) {
        setError('Failed to load CSV file');
        setLoading(false);
      }
    });
  }, []);

  // Process data for a specific hierarchy level
  const processHierarchyLevel = (data, level, path) => {
    // Apply filters based on the current path
    let filteredData = [...data];
    
    for (let i = 0; i < path.length; i++) {
      const filterField = hierarchyLevels[i + 1].field;
      filteredData = filteredData.filter(item => item[filterField] === path[i]);
    }
    
    // Calculate current node info
    let nodeName = 'Count of Assets';
    let nodeValue = filteredData.length;
    
    if (level > 0) {
      nodeName = path[path.length - 1];
    }
    
    setCurrentNode({
      name: nodeName,
      value: nodeValue,
      level: level
    });
    
    // Get children for the next level if not at the last level
    if (level < hierarchyLevels.length - 1) {
      const nextLevelField = hierarchyLevels[level + 1].field;
      const grouped = _.groupBy(filteredData, item => item[nextLevelField] || 'Unknown');
      
      const children = Object.entries(grouped).map(([key, items]) => ({
        name: key,
        value: items.length,
        level: level + 1,
      })).sort((a, b) => b.value - a.value); // Sort by count descending
      
      setChildNodes(children);
    } else {
      setChildNodes([]);
    }
  };

  // Handle node click
  const handleNodeClick = (node) => {
    if (currentLevel < hierarchyLevels.length - 1) {
      const newPath = [...currentPath, node.name];
      setCurrentPath(newPath);
      setCurrentLevel(currentLevel + 1);
      processHierarchyLevel(data, currentLevel + 1, newPath);
    }
  };

  // Go back one level
  const handleBackClick = () => {
    if (currentLevel > 0) {
      const newPath = [...currentPath];
      newPath.pop();
      setCurrentPath(newPath);
      setCurrentLevel(currentLevel - 1);
      processHierarchyLevel(data, currentLevel - 1, newPath);
    }
  };

  // Reset to the top level
  const handleResetClick = () => {
    setCurrentPath([]);
    setCurrentLevel(0);
    processHierarchyLevel(data, 0, []);
  };

  // Format large numbers with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Create breadcrumb navigation
  const renderBreadcrumbs = () => {
    const breadcrumbs = ['Count of Assets', ...currentPath];
    
    return (
      <div className="flex flex-wrap items-center text-sm +mb-6">
        {breadcrumbs.map((item, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && <span className="mx-2 text-blue-400">→</span>}
            <span className={`${index === breadcrumbs.length - 1 ? 'text-blue-500 font-semibold' : 'text-white'}`}>
              {item}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Generate a unique color for a node based on its name
  const getNodeColor = (name, isSelected = false) => {
    if (isSelected) return 'bg-blue-600 hover:bg-blue-700';
    
    // Simple hash function to generate colors
    const hash = name.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    const colors = [
      'bg-blue-500 hover:bg-blue-600',
      'bg-indigo-500 hover:bg-indigo-600',
      'bg-purple-500 hover:bg-purple-600',
      'bg-cyan-500 hover:bg-cyan-600',
      'bg-teal-500 hover:bg-teal-600',
      'bg-green-500 hover:bg-green-600'
    ];
    
    return colors[hash % colors.length];
  };

  if (loading) {
    return (
      <div className="w-full bg-gradient-to-r from-[#024673] to-[#5C99E3] rounded-lg p-6 shadow-lg flex justify-center items-center h-64">
        <div className="text-white text-lg">Loading data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-gradient-to-r from-[#024673] to-[#5C99E3] rounded-lg p-6 shadow-lg flex justify-center items-center h-64">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="m-1 bg-gradient-to-br from-[#024673] to-[#5C99E3] rounded-lg p-4 shadow-lg">
      {/* Header with title and navigation buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-xl font-semibold text-white">
          {hierarchyLevels[currentLevel].name}
          {currentLevel > 0 && `: ${currentNode?.name}`}
        </h2>
        
        <div className="flex space-x-3 mt-3 sm:mt-0">
          {currentLevel > 0 && (
            <button
              onClick={handleBackClick}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors"
            >
              Back
            </button>
          )}
          
          {currentLevel > 0 && (
            <button
              onClick={handleResetClick}
              className="px-4 py-1.5 bg-white text-black rounded-md text-sm transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>
      
      {/* Breadcrumb navigation */}
      {renderBreadcrumbs()}
      
      {/* Flowchart visualization */}
      <div className="mt-8">
        {/* Current node box */}
        {currentNode && (
          <div className="flex flex-col items-center">
            <div className={`px-6 py-3 rounded-lg ${getNodeColor(currentNode.name, true)} text-white text-center min-w-48 shadow-lg`}>
              <div className="font-semibold">{currentNode.name}</div>
              <div className="text-xl mt-1 font-bold">{formatNumber(currentNode.value)}</div>
            </div>
            
            {/* Connection line */}
            {childNodes.length > 0 && (
              <div className="h-12 w-0.5 bg-blue-400 my-2"></div>
            )}
            
            {/* Child nodes */}
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {childNodes.map((child, index) => (
                <div key={index} className="flex flex-col items-center mb-4">
                  <button
                    onClick={() => handleNodeClick(child)}
                    className={`px-4 py-2.5 rounded-lg ${getNodeColor(child.name)} text-white transition-transform hover:scale-105 hover:shadow-lg text-center min-w-32`}
                  >
                    <div className="font-medium text-sm">{child.name}</div>
                    <div className="mt-1 font-semibold">{formatNumber(child.value)}</div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Instructions */}
      <div className="mt-10 text-sm text-white text-center">
        <p>
          {currentLevel < hierarchyLevels.length - 1 
            ? 'Click on a node to drill down to the next level.' 
            : 'You have reached the deepest level of the hierarchy.'}
        </p>
      </div>
    </div>
  );
}