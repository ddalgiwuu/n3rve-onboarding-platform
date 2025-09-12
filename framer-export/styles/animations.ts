/**
 * Animation Variants for Framer
 * Extracted from n3rve-onboarding platform
 * Use these with Framer Motion components
 */

// Page Transitions
export const pageTransitions = {
    fadeIn: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.3 }
    },
    slideUp: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
        transition: { duration: 0.3, ease: "easeOut" }
    },
    slideFromRight: {
        initial: { opacity: 0, x: 100 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -100 },
        transition: { duration: 0.4, ease: "easeInOut" }
    },
    scaleIn: {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
        transition: { duration: 0.3, ease: "easeOut" }
    }
}

// Card Animations
export const cardVariants = {
    hidden: {
        opacity: 0,
        y: 20,
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: "easeOut"
        }
    },
    hover: {
        y: -5,
        scale: 1.02,
        transition: {
            duration: 0.3,
            ease: "easeOut"
        }
    },
    tap: {
        scale: 0.98,
        transition: {
            duration: 0.1
        }
    }
}

// Stagger Children Animation
export const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

export const staggerItem = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: "easeOut"
        }
    }
}

// Floating Animation
export const floatingAnimation = {
    animate: {
        y: [0, -10, 0],
        transition: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
        }
    }
}

// Music Notes Animation (from Login page)
export const musicNotesAnimation = {
    initial: { opacity: 0, y: 100 },
    animate: {
        opacity: [0, 0.3, 0],
        y: [-20, -500],
        x: [0, 50, -50, 0],
        rotate: [0, 15, -15, 0],
        transition: {
            duration: 20,
            repeat: Infinity,
            ease: "linear"
        }
    }
}

// Shimmer Effect
export const shimmerAnimation = {
    animate: {
        x: ["-100%", "100%"],
        transition: {
            duration: 2,
            repeat: Infinity,
            repeatDelay: 1,
            ease: "linear"
        }
    }
}

// Pulse Animation
export const pulseAnimation = {
    animate: {
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
        }
    }
}

// Loading Spinner
export const spinnerAnimation = {
    animate: {
        rotate: 360,
        transition: {
            duration: 1,
            repeat: Infinity,
            ease: "linear"
        }
    }
}

// Success Check Animation
export const checkmarkAnimation = {
    initial: { pathLength: 0, opacity: 0 },
    animate: {
        pathLength: 1,
        opacity: 1,
        transition: {
            duration: 0.5,
            ease: "easeOut"
        }
    }
}

// Error X Animation
export const errorAnimation = {
    initial: { scale: 0, rotate: 0 },
    animate: {
        scale: [0, 1.2, 1],
        rotate: [0, 10, -10, 0],
        transition: {
            duration: 0.5,
            ease: "easeOut"
        }
    }
}

// Gradient Animation
export const gradientAnimation = {
    animate: {
        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        transition: {
            duration: 5,
            repeat: Infinity,
            ease: "linear"
        }
    }
}

// Modal/Overlay Animations
export const modalVariants = {
    overlay: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.3 }
    },
    modal: {
        initial: { opacity: 0, scale: 0.9, y: 50 },
        animate: { 
            opacity: 1, 
            scale: 1, 
            y: 0,
            transition: {
                type: "spring",
                damping: 25,
                stiffness: 500
            }
        },
        exit: { 
            opacity: 0, 
            scale: 0.9, 
            y: 50,
            transition: {
                duration: 0.2
            }
        }
    }
}

// Text Reveal Animation
export const textRevealAnimation = {
    hidden: {
        opacity: 0,
        y: 20,
        clipPath: "inset(100% 0% 0% 0%)"
    },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        clipPath: "inset(0% 0% 0% 0%)",
        transition: {
            duration: 0.5,
            delay: i * 0.1,
            ease: "easeOut"
        }
    })
}

// Bounce Animation
export const bounceAnimation = {
    animate: {
        y: [0, -20, 0],
        transition: {
            duration: 0.6,
            ease: "easeOut",
            times: [0, 0.5, 1]
        }
    }
}

// Slide Menu Animation
export const slideMenuVariants = {
    closed: {
        x: "-100%",
        transition: {
            type: "spring",
            stiffness: 400,
            damping: 40
        }
    },
    open: {
        x: 0,
        transition: {
            type: "spring",
            stiffness: 400,
            damping: 40
        }
    }
}

// Progress Bar Animation
export const progressBarAnimation = {
    initial: { width: 0 },
    animate: (progress) => ({
        width: `${progress}%`,
        transition: {
            duration: 0.5,
            ease: "easeOut"
        }
    })
}

// Notification Animation
export const notificationAnimation = {
    initial: { 
        opacity: 0, 
        x: 100,
        scale: 0.8
    },
    animate: { 
        opacity: 1, 
        x: 0,
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 500,
            damping: 30
        }
    },
    exit: { 
        opacity: 0, 
        x: 100,
        scale: 0.8,
        transition: {
            duration: 0.2
        }
    }
}

// Skeleton Loading Animation
export const skeletonAnimation = {
    animate: {
        backgroundPosition: ["200% 0", "-200% 0"],
        transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
        }
    }
}

// Wave Animation (for backgrounds)
export const waveAnimation = {
    animate: {
        x: [0, -1920],
        transition: {
            duration: 20,
            repeat: Infinity,
            ease: "linear"
        }
    }
}

// Confetti Animation (for success states)
export const confettiAnimation = {
    initial: { 
        opacity: 0,
        scale: 0,
        rotate: 0
    },
    animate: {
        opacity: [0, 1, 1, 0],
        scale: [0, 1, 1, 0],
        rotate: [0, 180, 360],
        y: [0, -200],
        transition: {
            duration: 2,
            ease: "easeOut"
        }
    }
}

// Export all animations as a single object for easy import
export const animations = {
    page: pageTransitions,
    card: cardVariants,
    stagger: { container: staggerContainer, item: staggerItem },
    floating: floatingAnimation,
    musicNotes: musicNotesAnimation,
    shimmer: shimmerAnimation,
    pulse: pulseAnimation,
    spinner: spinnerAnimation,
    checkmark: checkmarkAnimation,
    error: errorAnimation,
    gradient: gradientAnimation,
    modal: modalVariants,
    textReveal: textRevealAnimation,
    bounce: bounceAnimation,
    slideMenu: slideMenuVariants,
    progressBar: progressBarAnimation,
    notification: notificationAnimation,
    skeleton: skeletonAnimation,
    wave: waveAnimation,
    confetti: confettiAnimation
}