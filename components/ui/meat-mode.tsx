'use client'

import { motion } from 'framer-motion'

export function MeatMode({ isActive }: { isActive: boolean }) {
  if (!isActive) return null

  // Generate positions for meat shapes - only on sides
  const meatShapes = Array.from({ length: 5 }, (_, i) => ({
    id: i,
    left: i % 2 === 0 ? `${Math.random() * 10}%` : `${90 + Math.random() * 10}%`,
    delay: i * 2,
    duration: 20 + Math.random() * 10,
    size: 50 + Math.random() * 30,
    rotation: Math.random() * 360
  }))

  return (
    <>
      {/* Solid dark red background */}
      <div className="fixed inset-0 z-[0]" style={{ backgroundColor: '#1a0505' }} />

      {/* Very subtle gradient overlay */}
      <div className="fixed inset-0 pointer-events-none z-[2]">
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/10 via-transparent to-red-900/10" />
      </div>

      {/* SVG Meat Shapes falling on the sides */}
      <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
        {meatShapes.map((shape) => (
          <motion.div
            key={shape.id}
            className="absolute opacity-40"
            style={{
              left: shape.left,
              width: `${shape.size}px`,
              height: `${shape.size}px`
            }}
            initial={{ y: -100, rotate: shape.rotation }}
            animate={{
              y: typeof window !== 'undefined' ? window.innerHeight + 100 : 1000,
              rotate: shape.rotation + 360
            }}
            transition={{
              y: {
                duration: shape.duration,
                delay: shape.delay,
                repeat: Infinity,
                ease: "linear"
              },
              rotate: {
                duration: shape.duration * 2,
                delay: shape.delay,
                repeat: Infinity,
                ease: "linear"
              }
            }}
          >
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full"
              style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}
            >
              {shape.id % 3 === 0 ? (
                // T-bone steak shape
                <g>
                  <path
                    d="M 25,40 Q 20,30 30,25 L 60,20 Q 75,20 80,30 L 85,55 Q 85,70 75,75 L 45,80 Q 30,80 25,70 Z"
                    fill="#8B2F2F"
                    stroke="#5C1F1F"
                    strokeWidth="2"
                  />
                  {/* Bone */}
                  <rect x="15" y="45" width="70" height="8" rx="4" fill="#F5E6D3" />
                  <circle cx="12" cy="49" r="8" fill="#F5E6D3" />
                  <circle cx="88" cy="49" r="8" fill="#F5E6D3" />
                  {/* Fat marbling */}
                  <path
                    d="M 35,35 Q 40,38 45,35 M 50,45 Q 55,48 60,45 M 40,55 Q 45,58 50,55"
                    stroke="#FFF5EE"
                    strokeWidth="1.5"
                    fill="none"
                    opacity="0.4"
                  />
                </g>
              ) : shape.id % 3 === 1 ? (
                // Bacon strips
                <g>
                  <path
                    d="M 15,20 Q 25,15 35,20 Q 45,25 55,20 Q 65,15 75,20 Q 85,25 85,30 L 85,80 Q 75,85 65,80 Q 55,75 45,80 Q 35,85 25,80 Q 15,75 15,70 Z"
                    fill="#CD5C5C"
                    stroke="#8B3A3A"
                    strokeWidth="1.5"
                  />
                  {/* Fat stripes */}
                  <path d="M 15,30 L 85,30" stroke="#FFF0F0" strokeWidth="3" opacity="0.5" />
                  <path d="M 15,45 L 85,45" stroke="#FFF0F0" strokeWidth="3" opacity="0.5" />
                  <path d="M 15,60 L 85,60" stroke="#FFF0F0" strokeWidth="3" opacity="0.5" />
                  <path d="M 15,75 L 85,75" stroke="#FFF0F0" strokeWidth="3" opacity="0.5" />
                </g>
              ) : (
                // Ribeye steak
                <g>
                  <ellipse cx="50" cy="50" rx="35" ry="30" fill="#A52A2A" stroke="#6B1818" strokeWidth="2"/>
                  {/* Eye of fat in center */}
                  <ellipse cx="50" cy="50" rx="12" ry="10" fill="#FFE4E1" opacity="0.3"/>
                  {/* Marbling lines */}
                  <path
                    d="M 30,40 Q 35,42 40,40 M 60,40 Q 65,42 70,40 M 35,60 Q 40,62 45,60 M 55,60 Q 60,62 65,60"
                    stroke="#FFF5EE"
                    strokeWidth="1"
                    fill="none"
                    opacity="0.4"
                  />
                  {/* Grill marks */}
                  <line x1="25" y1="35" x2="75" y2="35" stroke="#4A1818" strokeWidth="2" opacity="0.3" />
                  <line x1="25" y1="50" x2="75" y2="50" stroke="#4A1818" strokeWidth="2" opacity="0.3" />
                  <line x1="25" y1="65" x2="75" y2="65" stroke="#4A1818" strokeWidth="2" opacity="0.3" />
                </g>
              )}
            </svg>
          </motion.div>
        ))}
      </div>
    </>
  )
}