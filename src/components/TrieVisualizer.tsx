import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { RadixNode } from '../lib/radix';

interface TrieVisualizerProps {
  root: RadixNode;
  highlightPath: string[];
  deletingNode?: string | null;
  version: number;
}

export function TrieVisualizer({ root, highlightPath, deletingNode, version }: TrieVisualizerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    // Add zoom support
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on("zoom", (e) => {
        g.attr("transform", e.transform);
      });

    svg.call(zoom);

    // Build hierarchy
    function buildHierarchy(node: RadixNode, edgeLabel: string = ""): any {
      return {
        id: node.id,
        name: edgeLabel,
        isEndOfWord: node.isEndOfWord,
        children: Array.from(node.edges.values()).map(edge => buildHierarchy(edge.target, edge.label))
      };
    }

    const rootData = buildHierarchy(root);
    const hierarchy = d3.hierarchy(rootData);

    // Setup tree layout
    // Increase spacing to prevent overlapping of long words and dense branches
    const treeWidth = Math.max(width - 100, hierarchy.leaves().length * 160);
    const treeHeight = Math.max(height - 100, hierarchy.height * 140);
    const treeLayout = d3.tree().size([treeWidth, treeHeight]);
    const treeData = treeLayout(hierarchy);

    // Center the tree initially
    const initialScale = 1;
    const initialX = (width - treeWidth) / 2;
    const initialY = 40;
    
    svg.call(zoom.transform, d3.zoomIdentity.translate(initialX, initialY).scale(initialScale));

    // Draw links
    const links = g.selectAll(".link")
      .data(treeData.links())
      .enter()
      .append("g")
      .attr("class", "link-group");

    links.append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", d => {
        const sourceIndex = highlightPath.indexOf(d.source.data.id);
        const targetIndex = highlightPath.indexOf(d.target.data.id);
        if (sourceIndex !== -1 && targetIndex !== -1 && targetIndex >= sourceIndex) {
          return "#3b82f6"; // blue-500
        }
        return "#e5e7eb"; // gray-200
      })
      .attr("stroke-width", d => {
        const sourceIndex = highlightPath.indexOf(d.source.data.id);
        const targetIndex = highlightPath.indexOf(d.target.data.id);
        return (sourceIndex !== -1 && targetIndex !== -1 && targetIndex >= sourceIndex) ? 3 : 2;
      })
      .attr("d", d3.linkVertical()
        .x(d => (d as any).x)
        .y(d => (d as any).y)
      );

    // Draw edge labels
    links.append("text")
      .attr("x", d => ((d.source as any).x + (d.target as any).x) / 2)
      .attr("y", d => ((d.source as any).y + (d.target as any).y) / 2)
      .attr("dy", -5)
      .attr("text-anchor", "middle")
      .attr("fill", "#4b5563")
      .attr("font-size", "14px")
      .attr("font-weight", "600")
      .attr("paint-order", "stroke")
      .attr("stroke", "white")
      .attr("stroke-width", 4)
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .text(d => d.target.data.name);

    // Draw nodes
    const nodes = g.selectAll(".node")
      .data(treeData.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${(d as any).x},${(d as any).y})`);

    nodes.append("circle")
      .attr("r", 18)
      .attr("fill", d => {
        if (d.data.id === deletingNode) return "#fca5a5"; // red-300
        if (highlightPath.includes(d.data.id)) return "#bfdbfe"; // blue-200
        return d.data.isEndOfWord ? "#10b981" : "#f3f4f6"; // emerald-500 or gray-100
      })
      .attr("stroke", d => {
        if (d.data.id === deletingNode) return "#dc2626"; // red-600
        if (highlightPath.includes(d.data.id)) return "#2563eb"; // blue-600
        return d.data.isEndOfWord ? "#059669" : "#d1d5db"; // emerald-600 or gray-300
      })
      .attr("stroke-width", 2);

    // Root label
    nodes.filter(d => d.depth === 0)
      .append("text")
      .attr("dy", 5)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .attr("fill", "#374151")
      .text("GỐC");

  }, [root, highlightPath, deletingNode, version]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-move">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
}
