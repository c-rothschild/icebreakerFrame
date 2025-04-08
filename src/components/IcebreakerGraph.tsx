import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface ProfileNode {
  profileID: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  type: 'main' | 'connection';
}

interface Link {
  source: string | ProfileNode;
  target: string | ProfileNode;
}

interface GraphProps {
  profile: ProfileNode;
  connections: ProfileNode[];
}

export const IcebreakerGraph: React.FC<GraphProps> = ({ profile, connections }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Limit to max 8 connections for better visualization
  const displayedConnections = connections.slice(0, 8);
  
  useEffect(() => {
    // Safety checks
    if (!svgRef.current || !containerRef.current || !profile) return;
    if (!displayedConnections || displayedConnections.length === 0) return;
    
    try {
      // Get container dimensions
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = 250; // Fixed height
      
      // Set up SVG
      const svg = d3.select(svgRef.current)
        .attr('width', containerWidth)
        .attr('height', containerHeight);
      
      // Clear previous content
      svg.selectAll('*').remove();
      
      // Define the center point
      const centerX = containerWidth / 2;
      const centerY = containerHeight / 2;
      
      // Create main node and connection nodes with safe defaults
      const nodes: ProfileNode[] = [
        { 
          ...profile, 
          type: 'main',
          x: centerX,
          y: centerY,
          fx: centerX, // Fix position for main node
          fy: centerY
        },
        ...displayedConnections.map(connection => ({
          ...connection,
          type: 'connection' as const
        }))
      ];
      
      // Create links from main node to each connection
      const links: Link[] = displayedConnections.map(connection => ({
        source: profile.profileID,
        target: connection.profileID
      }));
      
      // Set up force simulation with safety checks
      const simulation = d3.forceSimulation<ProfileNode>(nodes)
        .force('link', d3.forceLink<ProfileNode, Link>(links)
          .id(d => d.profileID)
          .distance(100)
        )
        .force('charge', d3.forceManyBody<ProfileNode>().strength(-200))
        .force('center', d3.forceCenter<ProfileNode>(centerX, centerY))
        .force('collision', d3.forceCollide<ProfileNode>().radius(d => d.type === 'main' ? 40 : 30));
      
      // Create link lines
      const link = svg.append('g')
        .selectAll('line')
        .data(links)
        .join('line') // Use join instead of enter().append() for better update handling
        .attr('stroke', '#ccc')
        .attr('stroke-width', 1.5);
      
      // Create node groups with safer join pattern
      const node = svg.append('g')
        .selectAll('.node')
        .data(nodes)
        .join('g')
        .attr('class', d => `node ${d.type}-node`);
      
      // Setup drag behavior
      const drag = (simulation: d3.Simulation<ProfileNode, undefined>) => {
        function dragstarted(event: any, d: ProfileNode) {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        }
        
        function dragged(event: any, d: ProfileNode) {
          d.fx = event.x;
          d.fy = event.y;
        }
        
        function dragended(event: any, d: ProfileNode) {
          if (!event.active) simulation.alphaTarget(0);
          if (d.type !== 'main') {
            d.fx = null;
            d.fy = null;
          }
        }
        
        return d3.drag<SVGGElement, ProfileNode>()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended);
      };
      
      // Apply drag behavior
      node.call(drag(simulation) as any);
      
      // Add circles for nodes
      node.append('circle')
        .attr('r', d => d.type === 'main' ? 24 : 18)
        .attr('fill', 'white')
        .attr('stroke', d => d.type === 'main' ? '#ff6b6b' : '#4dabf7')
        .attr('stroke-width', d => d.type === 'main' ? 2 : 1);
      
      // Add images inside circles with more robust error handling
      node.append('clipPath')
        .attr('id', d => `clip-${d.profileID}`)
        .append('circle')
        .attr('r', d => d.type === 'main' ? 22 : 16);
      
      // Add avatar images with better error handling
      node.append('image')
        .attr('xlink:href', d => d.avatarUrl || '')
        .attr('x', d => d.type === 'main' ? -22 : -16)
        .attr('y', d => d.type === 'main' ? -22 : -16)
        .attr('width', d => d.type === 'main' ? 44 : 32)
        .attr('height', d => d.type === 'main' ? 44 : 32)
        .attr('clip-path', d => `url(#clip-${d.profileID})`)
        .on('error', function(this: SVGImageElement) {
          try {
            // Safe fallback for image load errors
            const parentNode = d3.select(this.parentNode as Element);
            if (!parentNode || !parentNode.node()) return;
            
            const data = parentNode.datum() as ProfileNode;
            if (!data) return;
            
            // Remove the failed image
            d3.select(this).remove();
            
            // Add a colored circle with initial
            parentNode.append('circle')
              .attr('r', data.type === 'main' ? 22 : 16)
              .attr('fill', data.type === 'main' ? '#ff6b6b' : '#4dabf7');
            
            // Add initials text
            parentNode.append('text')
              .attr('text-anchor', 'middle')
              .attr('dy', '0.35em')
              .attr('fill', 'white')
              .attr('font-size', data.type === 'main' ? '16px' : '12px')
              .text(data.displayName ? data.displayName.charAt(0).toUpperCase() : 'U');
          } catch (e) {
            console.error("Error handling image failure:", e);
          }
        });
      
      // Add text labels with safer truncation
      node.append('text')
        .attr('dy', d => d.type === 'main' ? 38 : 32)
        .attr('text-anchor', 'middle')
        .attr('fill', '#000')
        .attr('font-size', d => d.type === 'main' ? '11px' : '9px')
        .attr('font-weight', d => d.type === 'main' ? 'bold' : 'normal')
        .text(d => d.displayName || (d.type === 'main' ? 'User' : 'Connection'))
        .each(function(this: SVGTextElement) {
          try {
            // Safely truncate text if too long
            const element = this;
            if (!element) return;
            
            const textElement = d3.select(element);
            const data = d3.select(element).datum() as ProfileNode;
            if (!data) return;
            
            const text = textElement.text() || '';
            const maxWidth = data.type === 'main' ? 70 : 60;
            
            // Only try to truncate if we can get computed text length
            if (element.getComputedTextLength && element.getComputedTextLength() > maxWidth) {
              let truncatedText = text;
              // Safely truncate with a limit on iterations
              let iterations = 0;
              const maxIterations = 100; // Prevent infinite loops
              
              while (truncatedText.length > 3 && 
                     element.getComputedTextLength() > maxWidth && 
                     iterations < maxIterations) {
                truncatedText = truncatedText.slice(0, -1);
                textElement.text(truncatedText + '...');
                iterations++;
              }
            }
          } catch (e) {
            console.error("Error truncating text:", e);
          }
        });
      
      // Safer update function for link positions
      simulation.on('tick', () => {
        link
          .attr('x1', d => {
            const source = d.source as ProfileNode;
            return source && typeof source.x === 'number' ? source.x : centerX;
          })
          .attr('y1', d => {
            const source = d.source as ProfileNode;
            return source && typeof source.y === 'number' ? source.y : centerY;
          })
          .attr('x2', d => {
            const target = d.target as ProfileNode;
            return target && typeof target.x === 'number' ? target.x : centerX;
          })
          .attr('y2', d => {
            const target = d.target as ProfileNode;
            return target && typeof target.y === 'number' ? target.y : centerY;
          });
        
        node
          .attr('transform', d => {
            const x = typeof d.x === 'number' ? d.x : centerX;
            const y = typeof d.y === 'number' ? d.y : centerY;
            return `translate(${x}, ${y})`;
          });
      });
      
      // If there are more connections than displayed, show a count
      if (connections.length > displayedConnections.length) {
        svg.append('text')
          .attr('x', containerWidth - 10)
          .attr('y', containerHeight - 10)
          .attr('text-anchor', 'end')
          .attr('font-size', '10px')
          .attr('fill', '#666')
          .text(`+${connections.length - displayedConnections.length} more connections`);
      }
      
      // Run simulation for a few ticks before displaying
      simulation.tick(10);
      
      // Return cleanup function
      return () => {
        try {
          simulation.stop();
        } catch (e) {
          console.error("Error stopping simulation:", e);
        }
      };
    } catch (error) {
      console.error("Error in IcebreakerGraph:", error);
      return () => {};
    }
  }, [profile, displayedConnections]);
  
  return (
    <div className="social-graph-container mt-4">
      <div 
        ref={containerRef} 
        className="relative bg-gray-50 rounded-lg p-4 h-[250px] overflow-hidden"
      >
        <svg ref={svgRef} className="w-full h-full"></svg>
        
        {/* Show total connections count if more than what's displayed */}
        {connections.length > displayedConnections.length && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-500 pointer-events-none">
            +{connections.length - displayedConnections.length} more connections
          </div>
        )}
      </div>
    </div>
  );
};