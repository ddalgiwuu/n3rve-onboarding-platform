import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { motion } from "framer-motion"

/**
 * LoginForm Example Component for Framer
 * Demonstrates how to combine Glass components in a real form
 * 
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 500
 */
export function LoginForm(props) {
    const {
        title,
        subtitle,
        primaryColor,
        showSocialLogin,
        onSubmit,
        style,
    } = props

    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(false)
    const [errors, setErrors] = React.useState({})

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault()
        setErrors({})
        
        // Basic validation
        const newErrors = {}
        if (!email) newErrors.email = "Email is required"
        if (!password) newErrors.password = "Password is required"
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }
        
        setIsLoading(true)
        if (onSubmit) {
            onSubmit({ email, password })
        }
        
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false)
        }, 2000)
    }

    // Glass card styles
    const cardStyles = {
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.3)",
        boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
        borderRadius: 24,
        padding: 40,
        width: "100%",
        maxWidth: 400,
        ...style,
    }

    // Input styles
    const inputStyles = {
        width: "100%",
        padding: "14px 20px",
        fontSize: 16,
        borderRadius: 12,
        border: "1px solid rgba(255, 255, 255, 0.3)",
        background: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        outline: "none",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    }

    // Button styles
    const buttonStyles = {
        width: "100%",
        padding: "14px 20px",
        fontSize: 16,
        fontWeight: 600,
        borderRadius: 12,
        border: "none",
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(primaryColor, -20)} 100%)`,
        color: "white",
        cursor: isLoading ? "not-allowed" : "pointer",
        opacity: isLoading ? 0.7 : 1,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        overflow: "hidden",
    }

    return (
        <motion.div
            style={cardStyles}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
                <motion.h1
                    style={{
                        fontSize: 32,
                        fontWeight: 700,
                        marginBottom: 8,
                        background: `linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(primaryColor, -20)} 100%)`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                    }}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    {title}
                </motion.h1>
                <motion.p
                    style={{
                        fontSize: 14,
                        color: "#666",
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    {subtitle}
                </motion.p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Email Input */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500, color: "#333" }}>
                        Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        style={{
                            ...inputStyles,
                            borderColor: errors.email ? "#EF4444" : "rgba(255, 255, 255, 0.3)",
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = primaryColor
                            e.target.style.boxShadow = `0 0 0 3px ${hexToRgba(primaryColor, 0.1)}`
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = errors.email ? "#EF4444" : "rgba(255, 255, 255, 0.3)"
                            e.target.style.boxShadow = "none"
                        }}
                    />
                    {errors.email && (
                        <motion.span
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ fontSize: 12, color: "#EF4444", marginTop: 4, display: "block" }}
                        >
                            {errors.email}
                        </motion.span>
                    )}
                </motion.div>

                {/* Password Input */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500, color: "#333" }}>
                        Password
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        style={{
                            ...inputStyles,
                            borderColor: errors.password ? "#EF4444" : "rgba(255, 255, 255, 0.3)",
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = primaryColor
                            e.target.style.boxShadow = `0 0 0 3px ${hexToRgba(primaryColor, 0.1)}`
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = errors.password ? "#EF4444" : "rgba(255, 255, 255, 0.3)"
                            e.target.style.boxShadow = "none"
                        }}
                    />
                    {errors.password && (
                        <motion.span
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ fontSize: 12, color: "#EF4444", marginTop: 4, display: "block" }}
                        >
                            {errors.password}
                        </motion.span>
                    )}
                </motion.div>

                {/* Remember & Forgot */}
                <motion.div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <label style={{ display: "flex", alignItems: "center", fontSize: 14, color: "#666" }}>
                        <input type="checkbox" style={{ marginRight: 8 }} />
                        Remember me
                    </label>
                    <a href="#" style={{ fontSize: 14, color: primaryColor, textDecoration: "none" }}>
                        Forgot password?
                    </a>
                </motion.div>

                {/* Submit Button */}
                <motion.button
                    type="submit"
                    style={buttonStyles}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {isLoading ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <motion.div
                                style={{
                                    width: 20,
                                    height: 20,
                                    border: "2px solid rgba(255, 255, 255, 0.3)",
                                    borderTop: "2px solid white",
                                    borderRadius: "50%",
                                    marginRight: 8,
                                }}
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            Loading...
                        </div>
                    ) : (
                        "Sign In"
                    )}
                </motion.button>

                {/* Social Login */}
                {showSocialLogin && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        <div style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            margin: "24px 0",
                            color: "#999",
                            fontSize: 14,
                        }}>
                            <div style={{ flex: 1, height: 1, background: "#E5E5E5" }} />
                            <span style={{ margin: "0 16px" }}>or continue with</span>
                            <div style={{ flex: 1, height: 1, background: "#E5E5E5" }} />
                        </div>
                        
                        <div style={{ display: "flex", gap: 12 }}>
                            <button
                                type="button"
                                style={{
                                    flex: 1,
                                    padding: "12px",
                                    borderRadius: 12,
                                    border: "1px solid #E5E5E5",
                                    background: "white",
                                    cursor: "pointer",
                                    transition: "all 0.3s",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = primaryColor
                                    e.currentTarget.style.transform = "translateY(-2px)"
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = "#E5E5E5"
                                    e.currentTarget.style.transform = "translateY(0)"
                                }}
                            >
                                Google
                            </button>
                            <button
                                type="button"
                                style={{
                                    flex: 1,
                                    padding: "12px",
                                    borderRadius: 12,
                                    border: "1px solid #E5E5E5",
                                    background: "white",
                                    cursor: "pointer",
                                    transition: "all 0.3s",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = primaryColor
                                    e.currentTarget.style.transform = "translateY(-2px)"
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = "#E5E5E5"
                                    e.currentTarget.style.transform = "translateY(0)"
                                }}
                            >
                                GitHub
                            </button>
                        </div>
                    </motion.div>
                )}
            </form>
        </motion.div>
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
LoginForm.defaultProps = {
    title: "Welcome Back",
    subtitle: "Sign in to your account to continue",
    primaryColor: "#5B02FF",
    showSocialLogin: true,
}

// Property controls
addPropertyControls(LoginForm, {
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Welcome Back",
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: "Sign in to your account to continue",
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Primary Color",
        defaultValue: "#5B02FF",
    },
    showSocialLogin: {
        type: ControlType.Boolean,
        title: "Show Social",
        defaultValue: true,
    },
    onSubmit: {
        type: ControlType.EventHandler,
    },
})