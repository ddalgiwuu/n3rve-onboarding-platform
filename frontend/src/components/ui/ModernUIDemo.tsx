import React from 'react';
import Button from './Button';
import Input from './Input';
import { Music, Search, Star, Heart } from 'lucide-react';

/**
 * Modern UI Demo Component
 * Showcases the new premium dark mode styling system
 */
export default function ModernUIDemo() {
  return (
    <div className="min-h-screen bg-surface p-8 scrollbar-premium">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Hero Section with Premium Text */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-premium animate-spring-in">
            ✨ Modern UI Showcase
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 animate-fade-in-up">
            Experience the new premium dark mode with trendy animations
          </p>
        </div>

        {/* Button Showcase */}
        <div className="card-premium animate-stagger-in stagger-1">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
            🚀 Premium Buttons
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button variant="primary" icon={<Music className="w-4 h-4" />}>
              Primary Action
            </Button>
            <Button variant="glass-premium" icon={<Star className="w-4 h-4" />}>
              Glass Premium
            </Button>
            <Button variant="glass-modern" icon={<Heart className="w-4 h-4" />}>
              Glass Modern
            </Button>
            <Button variant="secondary">
              Secondary
            </Button>
            <Button variant="ghost">
              Ghost Button
            </Button>
            <Button variant="glass-success" size="lg">
              Success Glass
            </Button>
          </div>
        </div>

        {/* Input Showcase */}
        <div className="card-premium animate-stagger-in stagger-2">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
            ✍️ Premium Inputs
          </h2>
          <div className="space-y-6">
            <Input
              variant="premium"
              label="Premium Input"
              placeholder="Type something magical..."
              icon={<Search className="w-4 h-4" />}
              hint="This input has neumorphic design and breathing animation"
            />
            <Input
              variant="glass-enhanced"
              label="Glass Enhanced Input"
              placeholder="Enter your details..."
              hint="Glass morphism with modern borders"
            />
            <Input
              variant="glass"
              label="Glass Input with Shimmer"
              placeholder="Shimmer effect on hover..."
              icon={<Music className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Glass Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Magnetic Card', desc: 'Hover for magnetic effect', classes: 'magnetic neuro-raised' },
            { title: 'Shimmer Card', desc: 'Glass shimmer animation', classes: 'glass-shimmer glass-enhanced' },
            { title: 'Morphic Card', desc: 'Subtle breathing effect', classes: 'animate-morphic-breath glass-premium' }
          ].map((card, index) => (
            <div
              key={index}
              className={`card-premium animate-stagger-in stagger-${index + 3} ${card.classes}`}
            >
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                {card.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {card.desc}
              </p>
              <div className="mt-4">
                <Button variant="glass" size="sm">
                  Try It
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Loading States */}
        <div className="card-premium animate-stagger-in stagger-4">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
            ⚡ Loading States
          </h2>
          <div className="space-y-4">
            <div className="loading-shimmer h-4 rounded-lg" />
            <div className="loading-shimmer h-6 rounded-lg w-3/4" />
            <div className="loading-shimmer h-4 rounded-lg w-1/2" />
          </div>
        </div>

        {/* Gradient Border Example */}
        <div className="gradient-border p-6 animate-stagger-in stagger-5">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            🌈 Animated Gradient Border
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            This card has an animated gradient border that flows around the edges.
            Perfect for highlighting premium features or important announcements.
          </p>
        </div>

        {/* Navigation Example */}
        <div className="card-premium animate-stagger-in stagger-6">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
            🧭 Modern Navigation
          </h2>
          <div className="flex flex-wrap gap-3">
            {['Home', 'About', 'Services', 'Contact'].map((item, index) => (
              <div
                key={item}
                className="glass-nav-item magnetic glass-shimmer px-4 py-2 rounded-xl cursor-pointer"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Text Effects */}
        <div className="text-center space-y-4 animate-stagger-in stagger-7">
          <h2 className="text-3xl font-bold text-premium">
            Modern Typography
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 animate-glow-pulse">
            ✨ Premium text effects and animations
          </p>
        </div>

      </div>
    </div>
  );
}
