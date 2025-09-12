import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

/**
 * GlassCard Component for Framer
 * A modern glassmorphism card with multiple variants and effects
 * 
 * @framerIntrinsicWidth 320
 * @framerIntrinsicHeight 200
 */
export function GlassCard(props) {
    const {
        children,
        variant,
        color,
        hover,
        animate,
        gradient,
        showShimmer,
        padding,
        borderRadius,
        blur,
        opacity,
        borderOpacity,
        shadowIntensity,
        width,
        height,
        style,
        onTap,
    } = props

    // Glass effect styles based on variant
    const getGlassStyles = () => {
        const baseBlur = {
            light: 8,
            default: 10,
            strong: 12,
            ultra: 16,
        }[variant] || blur

        const baseOpacity = {
            light: 0.85,
            default: 0.9,
            strong: 0.95,
            ultra: 0.98,
        }[variant] || opacity

        return {
            backdropFilter: `blur(${baseBlur}px)`,
            WebkitBackdropFilter: `blur(${baseBlur}px)`,
            backgroundColor: `rgba(255, 255, 255, ${baseOpacity})`,
        }
    }

    // Color overlay styles
    const getColorStyles = () => {
        const colors = {
            default: "transparent",
            purple: "rgba(91, 2, 255, 0.05)",
            blue: "rgba(59, 130, 246, 0.05)",
            pink: "rgba(236, 72, 153, 0.05)",
            success: "rgba(34, 197, 94, 0.05)",
            warning: "rgba(251, 146, 60, 0.05)",
            error: "rgba(239, 68, 68, 0.05)",
        }
        return colors[color] || "transparent"
    }

    // Shadow styles
    const getShadowStyles = () => {
        const shadows = {
            light: "0 4px 16px 0 rgba(31, 38, 135, 0.08)",
            medium: "0 8px 32px 0 rgba(31, 38, 135, 0.1)",
            strong: "0 12px 40px 0 rgba(31, 38, 135, 0.15)",
        }
        return shadows[shadowIntensity] || shadows.medium
    }

    // Animation classes
    const animationClass = animate ? "glass-animate" : ""
    const hoverClass = hover ? "glass-hover" : ""

    return (
        <div
            style={{
                width: width || "100%",
                height: height || "auto",
                padding: `${padding}px`,
                borderRadius: `${borderRadius}px`,
                border: `1px solid rgba(255, 255, 255, ${borderOpacity})`,
                boxShadow: getShadowStyles(),
                position: "relative",
                overflow: "hidden",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: onTap ? "pointer" : "default",
                ...getGlassStyles(),
                ...style,
            }}
            className={`${animationClass} ${hoverClass}`}
            onClick={onTap}
        >
            {/* Color overlay */}
            {color !== "default" && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor: getColorStyles(),
                        pointerEvents: "none",
                    }}
                />
            )}

            {/* Gradient overlay */}
            {gradient && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(135deg, rgba(91, 2, 255, 0.1) 0%, rgba(91, 2, 255, 0.05) 100%)",
                        pointerEvents: "none",
                    }}
                />
            )}

            {/* Shimmer effect */}
            {showShimmer && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        opacity: 0,
                        transition: "opacity 0.5s",
                        pointerEvents: "none",
                    }}
                    className="shimmer-container"
                >
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: "linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.7) 50%, transparent 60%)",
                            animation: "shimmer 2s infinite",
                        }}
                    />
                </div>
            )}

            {/* Content */}
            <div style={{ position: "relative", zIndex: 1 }}>
                {children}
            </div>
        </div>
    )
}

// Default props
GlassCard.defaultProps = {
    variant: "default",
    color: "default",
    hover: true,
    animate: false,
    gradient: false,
    showShimmer: false,
    padding: 24,
    borderRadius: 16,
    blur: 10,
    opacity: 0.9,
    borderOpacity: 0.3,
    shadowIntensity: "medium",
    width: 320,
    height: 200,
}

// Framer property controls
addPropertyControls(GlassCard, {
    children: {
        type: ControlType.ComponentInstance,
        title: "Content",
    },
    variant: {
        type: ControlType.Enum,
        title: "Variant",
        options: ["light", "default", "strong", "ultra"],
        optionTitles: ["Light", "Default", "Strong", "Ultra"],
        defaultValue: "default",
    },
    color: {
        type: ControlType.Enum,
        title: "Color",
        options: ["default", "purple", "blue", "pink", "success", "warning", "error"],
        optionTitles: ["Default", "Purple", "Blue", "Pink", "Success", "Warning", "Error"],
        defaultValue: "default",
    },
    hover: {
        type: ControlType.Boolean,
        title: "Hover Effect",
        defaultValue: true,
    },
    animate: {
        type: ControlType.Boolean,
        title: "Animate",
        defaultValue: false,
    },
    gradient: {
        type: ControlType.Boolean,
        title: "Gradient",
        defaultValue: false,
    },
    showShimmer: {
        type: ControlType.Boolean,
        title: "Shimmer",
        defaultValue: false,
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 24,
        min: 0,
        max: 100,
        step: 4,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 16,
        min: 0,
        max: 50,
        step: 2,
    },
    blur: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 10,
        min: 0,
        max: 30,
        step: 1,
        hidden: (props) => props.variant !== "custom",
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 0.9,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (props) => props.variant !== "custom",
    },
    borderOpacity: {
        type: ControlType.Number,
        title: "Border",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.05,
    },
    shadowIntensity: {
        type: ControlType.Enum,
        title: "Shadow",
        options: ["light", "medium", "strong"],
        optionTitles: ["Light", "Medium", "Strong"],
        defaultValue: "medium",
    },
    width: {
        type: ControlType.Number,
        title: "Width",
        defaultValue: 320,
        min: 100,
        max: 800,
        step: 10,
    },
    height: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 200,
        min: 50,
        max: 600,
        step: 10,
    },
})

// CSS animations (add to global styles or component)
const shimmerKeyframes = `
@keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
}

.glass-hover:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 16px 40px 0 rgba(31, 38, 135, 0.2);
}

.glass-animate {
    animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
`