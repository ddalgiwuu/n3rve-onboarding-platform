import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { motion, AnimatePresence } from "framer-motion"

/**
 * GlassInput Component for Framer
 * Modern glassmorphism input field with validation and animations
 * 
 * @framerIntrinsicWidth 320
 * @framerIntrinsicHeight 56
 */
export function GlassInput(props) {
    const {
        placeholder,
        label,
        value,
        type,
        icon,
        required,
        disabled,
        error,
        errorMessage,
        success,
        successMessage,
        helperText,
        maxLength,
        showCharCount,
        variant,
        primaryColor,
        errorColor,
        successColor,
        fontSize,
        borderRadius,
        onValueChange,
        onFocus,
        onBlur,
        style,
    } = props

    const [isFocused, setIsFocused] = React.useState(false)
    const [internalValue, setInternalValue] = React.useState(value || "")

    React.useEffect(() => {
        setInternalValue(value || "")
    }, [value])

    // Variant styles
    const getVariantStyles = () => {
        const baseStyles = {
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            boxShadow: "0 4px 16px 0 rgba(31, 38, 135, 0.08)",
        }

        if (variant === "filled") {
            return {
                ...baseStyles,
                background: "rgba(255, 255, 255, 0.95)",
            }
        } else if (variant === "outline") {
            return {
                background: "transparent",
                border: `2px solid ${isFocused ? primaryColor : "rgba(255, 255, 255, 0.3)"}`,
                boxShadow: "none",
            }
        }

        return baseStyles
    }

    // Get border color based on state
    const getBorderColor = () => {
        if (error) return errorColor
        if (success) return successColor
        if (isFocused) return primaryColor
        return "rgba(255, 255, 255, 0.3)"
    }

    // Handle input change
    const handleChange = (e) => {
        const newValue = e.target.value
        if (maxLength && newValue.length > maxLength) return
        
        setInternalValue(newValue)
        if (onValueChange) onValueChange(newValue)
    }

    // Handle focus
    const handleFocus = (e) => {
        setIsFocused(true)
        if (onFocus) onFocus(e)
    }

    // Handle blur
    const handleBlur = (e) => {
        setIsFocused(false)
        if (onBlur) onBlur(e)
    }

    // Status icon component
    const StatusIcon = () => {
        if (error) {
            return (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{ color: errorColor }}
                >
                    ✕
                </motion.div>
            )
        }
        if (success) {
            return (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{ color: successColor }}
                >
                    ✓
                </motion.div>
            )
        }
        return null
    }

    return (
        <div style={{ width: "100%", ...style }}>
            {/* Label */}
            {label && (
                <motion.label
                    style={{
                        display: "block",
                        marginBottom: 8,
                        fontSize: fontSize - 2,
                        fontWeight: 500,
                        color: isFocused ? primaryColor : "#666",
                        transition: "color 0.3s",
                    }}
                    animate={{ color: isFocused ? primaryColor : "#666" }}
                >
                    {label}
                    {required && <span style={{ color: errorColor, marginLeft: 4 }}>*</span>}
                </motion.label>
            )}

            {/* Input container */}
            <motion.div
                style={{
                    position: "relative",
                    width: "100%",
                }}
                animate={{
                    scale: isFocused ? 1.02 : 1,
                }}
                transition={{ duration: 0.2 }}
            >
                {/* Icon */}
                {icon && (
                    <div
                        style={{
                            position: "absolute",
                            left: 16,
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: isFocused ? primaryColor : "#999",
                            transition: "color 0.3s",
                            pointerEvents: "none",
                        }}
                    >
                        {icon}
                    </div>
                )}

                {/* Input field */}
                <input
                    type={type}
                    value={internalValue}
                    placeholder={placeholder}
                    disabled={disabled}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    style={{
                        width: "100%",
                        padding: `12px ${icon ? 48 : 16}px`,
                        fontSize: fontSize,
                        borderRadius: borderRadius,
                        outline: "none",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        opacity: disabled ? 0.5 : 1,
                        cursor: disabled ? "not-allowed" : "text",
                        ...getVariantStyles(),
                        borderColor: getBorderColor(),
                    }}
                />

                {/* Status icon */}
                <div
                    style={{
                        position: "absolute",
                        right: 16,
                        top: "50%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                    }}
                >
                    <StatusIcon />
                </div>

                {/* Focus highlight */}
                <AnimatePresence>
                    {isFocused && (
                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            exit={{ scaleX: 0 }}
                            style={{
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: 2,
                                background: primaryColor,
                                transformOrigin: "center",
                            }}
                        />
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Helper text / Error message / Success message / Character count */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 4,
                    minHeight: 20,
                }}
            >
                <AnimatePresence mode="wait">
                    {error && errorMessage ? (
                        <motion.span
                            key="error"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            style={{
                                fontSize: fontSize - 4,
                                color: errorColor,
                            }}
                        >
                            {errorMessage}
                        </motion.span>
                    ) : success && successMessage ? (
                        <motion.span
                            key="success"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            style={{
                                fontSize: fontSize - 4,
                                color: successColor,
                            }}
                        >
                            {successMessage}
                        </motion.span>
                    ) : helperText ? (
                        <motion.span
                            key="helper"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                fontSize: fontSize - 4,
                                color: "#999",
                            }}
                        >
                            {helperText}
                        </motion.span>
                    ) : null}
                </AnimatePresence>

                {showCharCount && maxLength && (
                    <span
                        style={{
                            fontSize: fontSize - 4,
                            color: internalValue.length >= maxLength ? errorColor : "#999",
                        }}
                    >
                        {internalValue.length}/{maxLength}
                    </span>
                )}
            </div>
        </div>
    )
}

// Default props
GlassInput.defaultProps = {
    placeholder: "Enter text...",
    label: "",
    value: "",
    type: "text",
    required: false,
    disabled: false,
    error: false,
    errorMessage: "",
    success: false,
    successMessage: "",
    helperText: "",
    maxLength: null,
    showCharCount: false,
    variant: "glass",
    primaryColor: "#5B02FF",
    errorColor: "#EF4444",
    successColor: "#10B981",
    fontSize: 16,
    borderRadius: 12,
}

// Property controls
addPropertyControls(GlassInput, {
    placeholder: {
        type: ControlType.String,
        title: "Placeholder",
        defaultValue: "Enter text...",
    },
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "",
    },
    value: {
        type: ControlType.String,
        title: "Value",
        defaultValue: "",
    },
    type: {
        type: ControlType.Enum,
        title: "Type",
        options: ["text", "email", "password", "number", "tel", "url"],
        optionTitles: ["Text", "Email", "Password", "Number", "Phone", "URL"],
        defaultValue: "text",
    },
    icon: {
        type: ControlType.ComponentInstance,
        title: "Icon",
    },
    required: {
        type: ControlType.Boolean,
        title: "Required",
        defaultValue: false,
    },
    disabled: {
        type: ControlType.Boolean,
        title: "Disabled",
        defaultValue: false,
    },
    error: {
        type: ControlType.Boolean,
        title: "Error State",
        defaultValue: false,
    },
    errorMessage: {
        type: ControlType.String,
        title: "Error Message",
        defaultValue: "",
        hidden: (props) => !props.error,
    },
    success: {
        type: ControlType.Boolean,
        title: "Success State",
        defaultValue: false,
    },
    successMessage: {
        type: ControlType.String,
        title: "Success Message",
        defaultValue: "",
        hidden: (props) => !props.success,
    },
    helperText: {
        type: ControlType.String,
        title: "Helper Text",
        defaultValue: "",
    },
    maxLength: {
        type: ControlType.Number,
        title: "Max Length",
        defaultValue: null,
        min: 1,
        max: 500,
    },
    showCharCount: {
        type: ControlType.Boolean,
        title: "Show Count",
        defaultValue: false,
        hidden: (props) => !props.maxLength,
    },
    variant: {
        type: ControlType.Enum,
        title: "Variant",
        options: ["glass", "filled", "outline"],
        optionTitles: ["Glass", "Filled", "Outline"],
        defaultValue: "glass",
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Primary Color",
        defaultValue: "#5B02FF",
    },
    errorColor: {
        type: ControlType.Color,
        title: "Error Color",
        defaultValue: "#EF4444",
    },
    successColor: {
        type: ControlType.Color,
        title: "Success Color",
        defaultValue: "#10B981",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 16,
        min: 12,
        max: 24,
        step: 1,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 12,
        min: 0,
        max: 50,
        step: 2,
    },
    onValueChange: {
        type: ControlType.EventHandler,
    },
    onFocus: {
        type: ControlType.EventHandler,
    },
    onBlur: {
        type: ControlType.EventHandler,
    },
})