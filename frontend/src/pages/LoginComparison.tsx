import { useState } from 'react'
import { motion } from 'framer-motion'
import Login from './Login'
import ModernLogin from './ModernLogin'

export default function LoginComparison() {
  const [showModern, setShowModern] = useState(false)

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Toggle Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Login Page Design Comparison
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {showModern ? 'Modern Design' : 'Original Design'}
              </span>
              <button
                onClick={() => setShowModern(!showModern)}
                className="relative inline-flex h-8 w-16 items-center rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-300"
              >
                <motion.span
                  className="absolute h-6 w-6 rounded-full bg-purple-600 shadow-lg"
                  animate={{
                    x: showModern ? 36 : 4,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                  }}
                />
              </button>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Toggle to compare the original and modern login page designs
          </div>
        </div>
      </div>

      {/* Login Pages */}
      <div className="pt-20">
        <motion.div
          key={showModern ? 'modern' : 'original'}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          {showModern ? <ModernLogin /> : <Login />}
        </motion.div>
      </div>

      {/* Feature List */}
      <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 max-w-sm">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          {showModern ? 'Modern Features' : 'Original Features'}
        </h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          {showModern ? (
            <>
              <li>• Advanced glassmorphism effects</li>
              <li>• Musical note particle system</li>
              <li>• Interactive mouse tracking</li>
              <li>• Liquid button animations</li>
              <li>• Floating label inputs</li>
              <li>• Success state animations</li>
              <li>• 3D tab switching</li>
              <li>• Gradient orb backgrounds</li>
            </>
          ) : (
            <>
              <li>• Clean, functional design</li>
              <li>• Basic animations</li>
              <li>• Standard form inputs</li>
              <li>• Google OAuth integration</li>
              <li>• Email/password login</li>
              <li>• Responsive layout</li>
              <li>• Dark mode support</li>
              <li>• Multi-language support</li>
            </>
          )}
        </ul>
      </div>
    </div>
  )
}