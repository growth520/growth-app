import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { Sparkles, PartyPopper } from 'lucide-react';

const LevelUpModal = ({ open, onOpenChange, newLevel }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-sun-beige border-forest-green/20 sm:max-w-md overflow-hidden">
        <DialogHeader className="z-10">
          <div className="flex justify-center">
            <PartyPopper className="h-16 w-16 text-warm-orange" />
          </div>
          <DialogTitle className="text-3xl font-poppins font-bold text-forest-green text-center mt-4">
            Level Up!
          </DialogTitle>
          <DialogDescription className="text-center text-charcoal-gray/80 text-lg pt-2">
            You've reached Level {newLevel}!
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 text-center text-charcoal-gray/70">
          Keep up the amazing work on your growth journey!
        </div>
        
        {/* Background animations */}
        <motion.div
          className="absolute top-0 left-0 w-full h-full"
          initial="initial"
          animate={open ? "animate" : "initial"}
          variants={{
            initial: { opacity: 0 },
            animate: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
        >
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
              variants={{
                initial: { scale: 0, opacity: 0 },
                animate: {
                  scale: [0, 1.2, 1],
                  opacity: [0, 1, 0],
                  transition: {
                    duration: 1.5,
                    delay: Math.random() * 0.5,
                    ease: "easeOut"
                  }
                }
              }}
            >
              <Sparkles className="h-6 w-6 text-warm-orange/50" />
            </motion.div>
          ))}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default LevelUpModal;