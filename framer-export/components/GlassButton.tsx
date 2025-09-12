import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { motion } from "framer-motion"

/**
 * GlassButton Component for Framer
 * Modern glassmorphism button with multiple variants and animations
 * 
 * @framerIntrinsicWidth 160
 * @framerIntrinsicHeight 48
 */
export function GlassButton(props) {
    const {
        text,
        variant,
        size,
        icon,
        iconPosition,
        fullWidth,
        loading,
        disabled,
        primaryColor,
        textColor,
        fontSize,
        fontWeight,
        borderRadius,
        paddingX,
        paddingY,
        onTap,
        style,
    } = props

    // Size presets
    const sizeStyles = {
        small: {
            paddingX: 12,
            paddingY: 6,
            fontSize: 14,
        },
        medium: {
            paddingX: 24,
            paddingY: 12,
            fontSize: 16,
        },
        large: {
            paddingX: 32,
            paddingY: 16,
            fontSize: 18,
        },
    }

    const currentSize = sizeStyles[size] || sizeStyles.medium

    // Variant styles
    const getVariantStyles = () => {
        const styles = {
            primary: {
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(primaryColor, -20)} 100%)`,
                color: "white",
                border: "none",
                boxShadow: `0 4px 16px 0 ${hexToRgba(primaryColor, 0.3)}`,
            },
            secondary: {
                background: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                color: primaryColor,
                border: `1px solid ${hexToRgba(primaryColor, 0.3)}`,
                boxShadow: "0 4px 16px 0 rgba(31, 38, 135, 0.1)",
            },
            glass: {
                background: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                color: textColor || primaryColor,
                border: "1px solid rgba(255, 255, 255, 0.3)",
                boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
            },
            outline: {
                background: "transparent",
                color: primaryColor,
                border: `2px solid ${primaryColor}`,
                boxShadow: "none",
            },
            ghost: {
                background: "transparent",
                color: primaryColor,
                border: "none",
                boxShadow: "none",
            },
        }
        return styles[variant] || styles.primary
    }

    const variantStyles = getVariantStyles()

    // Animation variants
    const buttonVariants = {
        idle: { scale: 1 },
        hover: { scale: 1.05 },
        tap: { scale: 0.95 },
    }

    // Loading spinner
    const LoadingSpinner = () => (
        <motion.div
            style={{
                width: 16,
                height: 16,
                border: "2px solid rgba(255, 255, 255, 0.3)",
                borderTop: "2px solid white",
                borderRadius: "50%",
                marginRight: 8,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
    )

    return (
        <motion.button
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                paddingLeft: paddingX || currentSize.paddingX,
                paddingRight: paddingX || currentSize.paddingX,
                paddingTop: paddingY || currentSize.paddingY,
                paddingBottom: paddingY || currentSize.paddingY,
                fontSize: fontSize || currentSize.fontSize,
                fontWeight: fontWeight,
                borderRadius: borderRadius,
                width: fullWidth ? "100%" : "auto",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.5 : 1,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "relative",
                overflow: "hidden",
                ...variantStyles,
                ...style,
            }}
            variants={buttonVariants}
            initial="idle"
            whileHover={!disabled && "hover"}
            whileTap={!disabled && "tap"}
            onClick={!disabled && onTap}
            disabled={disabled}
        >
            {/* Shimmer effect for primary variant */}
            {variant === "primary" && (
                <motion.div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: "-100%",
                        width: "100%",
                        height: "100%",
                        background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
                        transition: "left 0.5s",
                    }}
                    animate={{ left: "100%" }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
            )}

            {/* Button content */}
            <div style={{ display: "flex", alignItems: "center", position: "relative", zIndex: 1 }}>
                {loading && <LoadingSpinner />}
                {icon && iconPosition === "left" && !loading && (
                    <span style={{ marginRight: 8, display: "flex" }}>{icon}</span>
                )}
                {text}
                {icon && iconPosition === "right" && !loading && (
                    <span style={{ marginLeft: 8, display: "flex" }}>{icon}</span>
                )}
            </div>
        </motion.button>
    )
}

// Helper functions
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function adjustColor(hex, percent) {
    const num = parseInt(hex.slice(1), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = (num >> 8 & 0x00FF) + amt
    const B = (num & 0x0000FF) + amt
    return `#${(0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255))
        .toString(16).slice(1)}`
}

// Default props
GlassButton.defaultProps = {
    text: "Button",
    variant: "primary",
    size: "medium",
    iconPosition: "left",
    fullWidth: false,
    loading: false,
    disabled: false,
    primaryColor: "#5B02FF",
    textColor: "#ffffff",
    fontSize: 16,
    fontWeight: 500,
    borderRadius: 12,
}

// Property controls
addPropertyControls(GlassButton, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Button",
    },
    variant: {
        type: ControlType.Enum,
        title: "Variant",
        options: ["primary", "secondary", "glass", "outline", "ghost"],
        optionTitles: ["Primary", "Secondary", "Glass", "Outline", "Ghost"],
        defaultValue: "primary",
    },
    size: {
        type: ControlType.Enum,
        title: "Size",
        options: ["small", "medium", "large"],
        optionTitles: ["Small", "Medium", "Large"],
        defaultValue: "medium",
    },
    icon: {
        type: ControlType.ComponentInstance,
        title: "Icon",
    },
    iconPosition: {
        type: ControlType.Enum,
        title: "Icon Position",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "left",
        hidden: (props) => !props.icon,
    },
    fullWidth: {
        type: ControlType.Boolean,
        title: "Full Width",
        defaultValue: false,
    },
    loading: {
        type: ControlType.Boolean,
        title: "Loading",
        defaultValue: false,
    },
    disabled: {
        type: ControlType.Boolean,
        title: "Disabled",
        defaultValue: false,
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Primary Color",
        defaultValue: "#5B02FF",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#ffffff",
        hidden: (props) => props.variant === "primary",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 16,
        min: 12,
        max: 24,
        step: 1,
    },
    fontWeight: {
        type: ControlType.Number,
        title: "Font Weight",
        defaultValue: 500,
        min: 300,
        max: 700,
        step: 100,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 12,
        min: 0,
        max: 50,
        step: 2,
    },
    paddingX: {
        type: ControlType.Number,
        title: "Padding X",
        defaultValue: 24,
        min: 8,
        max: 48,
        step: 4,
    },
    paddingY: {
        type: ControlType.Number,
        title: "Padding Y",
        defaultValue: 12,
        min: 4,
        max: 24,
        step: 2,
    },
    onTap: {
        type: ControlType.EventHandler,
    },
})