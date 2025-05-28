
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Code, Play, Zap } from 'lucide-react';

interface AnimatedLogoProps {
  className?: string;
  isMobile?: boolean;
}

const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ className = '', isMobile = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);
  const navigate = useNavigate();

  // Cycle through different animation phases
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const logoVariants = {
    idle: {
      scale: 1,
      rotateY: 0,
    },
    hover: {
      scale: 1.05,
      rotateY: 5,
      transition: { duration: 0.3 }
    }
  };

  const codeSnippets = [
    '{ stream: true }',
    'const play = () =>',
    'render(<Video />)',
    'export default App'
  ];

  const techIcons = [Code, Play, Zap];
  const CurrentIcon = techIcons[animationPhase % techIcons.length];

  return (
    <motion.div
      className={`relative cursor-pointer select-none ${className}`}
      variants={logoVariants}
      initial="idle"
      animate={isHovered ? "hover" : "idle"}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate('/')}
      style={{ perspective: 1000 }}
    >
      {/* Main Logo Container */}
      <div className="relative flex items-center">
        {/* Animated Background */}
        <motion.div
          className="absolute inset-0 rounded-lg"
          animate={{
            background: [
              'linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))',
              'linear-gradient(135deg, rgba(147, 51, 234, 0.1), rgba(59, 130, 246, 0.1))',
              'linear-gradient(225deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))',
              'linear-gradient(315deg, rgba(147, 51, 234, 0.1), rgba(59, 130, 246, 0.1))'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />

        {/* Tech Icon Animation */}
        <motion.div
          className="relative mr-3 p-2 rounded-md bg-white/10 backdrop-blur-sm"
          animate={{ rotateZ: isHovered ? 360 : 0 }}
          transition={{ duration: 0.6 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={animationPhase}
              initial={{ opacity: 0, scale: 0.5, rotateY: 90 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.5, rotateY: -90 }}
              transition={{ duration: 0.5 }}
            >
              <CurrentIcon 
                className={`w-${isMobile ? '5' : '6'} h-${isMobile ? '5' : '6'} text-white`}
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Logo Text */}
        <div className="relative">
          <motion.div
            className={`font-bold ${isMobile ? 'text-lg' : 'text-xl'} text-white font-mono tracking-wider`}
            animate={{
              backgroundImage: [
                'linear-gradient(45deg, #ffffff, #e5e7eb)',
                'linear-gradient(135deg, #e5e7eb, #ffffff)',
                'linear-gradient(225deg, #ffffff, #e5e7eb)',
                'linear-gradient(315deg, #e5e7eb, #ffffff)'
              ]
            }}
            style={{
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent'
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Let's Stream
          </motion.div>

          {/* Code Snippet Animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={animationPhase}
              className={`absolute -bottom-1 left-0 ${isMobile ? 'text-xs' : 'text-sm'} font-mono text-blue-300 opacity-70`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.7, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
            >
              {codeSnippets[animationPhase]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Glitch Effect Overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            opacity: isHovered ? [0, 0.3, 0] : 0,
            x: isHovered ? [0, 2, -2, 0] : 0
          }}
          transition={{ duration: 0.2, repeat: isHovered ? 3 : 0 }}
        >
          <div className="w-full h-full bg-gradient-to-r from-cyan-500/20 to-pink-500/20 mix-blend-screen" />
        </motion.div>

        {/* Particle Effects */}
        {isHovered && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                initial={{
                  x: '50%',
                  y: '50%',
                  opacity: 0
                }}
                animate={{
                  x: [0, Math.random() * 100 - 50],
                  y: [0, Math.random() * 100 - 50],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 1,
                  delay: i * 0.1,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AnimatedLogo;
