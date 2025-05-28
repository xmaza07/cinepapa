
import React from 'react';
import { motion } from 'framer-motion';
import { Code2, Terminal, Cpu, Zap } from 'lucide-react';

interface TechVideoBackgroundProps {
  className?: string;
}

const TechVideoBackground: React.FC<TechVideoBackgroundProps> = ({ className = '' }) => {
  const codeLines = [
    'import React from "react";',
    'const StreamApp = () => {',
    '  return <Player src={url} />;',
    '};',
    'export default StreamApp;'
  ];

  const techElements = [
    { Icon: Code2, label: 'React' },
    { Icon: Terminal, label: 'TypeScript' },
    { Icon: Cpu, label: 'Vite' },
    { Icon: Zap, label: 'Fast' }
  ];

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Animated Grid Background */}
      <motion.div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
        animate={{
          backgroundPosition: ['0px 0px', '20px 20px']
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'linear'
        }}
      />

      {/* Floating Code Snippets */}
      {codeLines.map((line, index) => (
        <motion.div
          key={index}
          className="absolute text-xs font-mono text-blue-300/30"
          initial={{
            x: -100,
            y: Math.random() * 200 + 50,
            opacity: 0
          }}
          animate={{
            x: window.innerWidth + 100,
            opacity: [0, 0.6, 0]
          }}
          transition={{
            duration: 15,
            delay: index * 2,
            repeat: Infinity,
            ease: 'linear'
          }}
        >
          {line}
        </motion.div>
      ))}

      {/* Tech Icons Animation */}
      {techElements.map(({ Icon, label }, index) => (
        <motion.div
          key={label}
          className="absolute flex items-center space-x-2 text-white/20"
          initial={{
            x: window.innerWidth,
            y: Math.random() * 100 + 100
          }}
          animate={{
            x: -200,
            rotate: 360
          }}
          transition={{
            duration: 20,
            delay: index * 3,
            repeat: Infinity,
            ease: 'linear'
          }}
        >
          <Icon className="w-6 h-6" />
          <span className="text-sm font-semibold">{label}</span>
        </motion.div>
      ))}

      {/* Gradient Overlays */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)'
          ]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    </div>
  );
};

export default TechVideoBackground;
