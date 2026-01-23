# RumbleCourt Design Principles

This document outlines the core UI/UX design aesthetics and principles for the RumbleCourt application, derived from the existing Header, Home page, and Footer components. These guidelines ensure consistency across all pages and components.

## Core Design Philosophy

RumbleCourt embodies a futuristic, high-tech courtroom experience with:
- **Dark, immersive environment** for focus and professionalism
- **Vibrant gradients** representing technological advancement
- **Smooth animations** for engaging user interactions
- **Blockchain-inspired aesthetics** with neon accents and glow effects

## Color Palette

### Primary Colors
- **Background**: `slate-950` (deepest slate) for main backgrounds
- **Secondary Background**: `slate-900/50` with backdrop blur for cards/panels
- **Text Primary**: `white` for headings and important text
- **Text Secondary**: `slate-400` for body text and labels
- **Text Accent**: `cyan-300` for highlighted text

### Gradient Palette
- **Primary Gradient**: `from-cyan-500 via-purple-500 to-pink-500`
- **Text Gradient**: `from-cyan-400 via-purple-400 to-pink-400`
- **Accent Gradient**: `from-cyan-400 to-purple-500`
- **Button Gradient**: `from-cyan-500 to-blue-600`

### Interactive States
- **Hover Glow**: Various glow colors based on context (cyan, purple, pink)
- **Active/Border**: `cyan-500/50`, `purple-500/30`
- **Success**: Green variants for connected states
- **Error**: Red variants for warnings/errors

## Typography

### Font Hierarchy
- **Display (H1)**: 6xl-8xl, font-black, tracking-tight
- **Headings (H2-H3)**: 3xl-4xl, font-bold
- **Body Large**: xl-2xl, font-medium, tracking-wide
- **Body**: sm-base, regular weight
- **Labels/Captions**: xs-sm, text-slate-400

### Text Effects
- **Gradient Text**: Use `bg-clip-text text-transparent` with linear gradients
- **Neon Glow**: Apply `text-shadow` and `filter: drop-shadow()` for enhanced readability
- **Animated Text**: Use `animate-gradient-x` for brand elements

## Layout & Spacing

### Container Structure
- **Max Width**: `max-w-7xl` for main content
- **Padding**: Responsive padding (`px-4 sm:px-6`, `py-3 sm:py-4`)
- **Grid Systems**: Use responsive grids (`md:grid-cols-3`, `sm:grid-cols-2`)
- **Flexbox**: Primary layout method with gap utilities

### Spacing Scale
- **Component Spacing**: `gap-4`, `gap-6`, `gap-8`
- **Section Spacing**: `mb-8`, `mb-12`, `mb-16`
- **Element Spacing**: `mb-3`, `mb-4`, `mb-6`

## Animations & Interactions

### Core Animations
- **Shimmer Effect**: Triple animated gradient lines (`animate-shimmer`)
- **Pulse Effects**: `animate-pulse`, `animate-pulse-slow` for breathing elements
- **Gradient Animation**: `animate-gradient-x`, `animate-gradient-xy`
- **Float Animation**: Custom keyframes for particle effects

### Hover Interactions
- **Scale Transform**: `hover:scale-105`, `hover:scale-110`
- **Glow Effects**: Dynamic box-shadow based on hover state
- **Border Transitions**: Animated border color changes
- **Icon Animations**: Rotation, translation, and color transitions

### Scroll-Based Animations
- **Header Styling**: Dynamic background blur and border changes on scroll
- **Background Effects**: Grid scrolling, particle movement

## Component Guidelines

### Buttons
```tsx
// Primary CTA Button
className="
  group relative px-8 py-4
  bg-gradient-to-r from-cyan-500 to-blue-600
  rounded-lg font-bold text-white overflow-hidden
  transition-all hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/50
"

// Secondary Button
className="
  group px-8 py-4 bg-slate-800/50 backdrop-blur-sm
  border-2 border-purple-500/50 rounded-lg font-bold text-purple-300
  hover:bg-slate-800 hover:border-purple-400
  transition-all hover:scale-105
"
```

### Cards/Panels
```tsx
className="
  relative bg-slate-900/50 backdrop-blur-sm
  border border-slate-700/50 rounded-xl p-6
  hover:border-cyan-500/50 transition-all duration-300
  hover:shadow-[0_0_40px_rgba(34,211,238,0.5)]
"
```

### Icons
- Use Lucide React icons consistently
- Apply gradient backgrounds to icon containers
- Implement hover color transitions
- Size variants: w-4 h-4 (small), w-6 h-6 (medium), w-8 h-8 (large)

### Navigation Elements
- Animated underlines on hover
- Icon + text combinations
- Consistent hover states across all nav items

## Page Structure

### Header Integration
- Fixed positioning with z-50
- Responsive height adjustments
- Scroll-based opacity/transparency changes
- Triple animated gradient top border

### Main Content Layout
```tsx
<main className="relative min-h-screen bg-slate-950 overflow-hidden">
  {/* Animated Background */}
  <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/20 to-cyan-950/20">
    {/* Grid pattern with animation */}
  </div>

  {/* Floating Elements */}
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Particles, orbs, etc. */}
  </div>

  {/* Content Container */}
  <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
    {/* Page content with mt-26 (accounting for fixed header) */}
  </div>
</main>
```

### Footer Structure
- Consistent with header styling
- Gradient orbs background
- Triple animated lines
- Organized link sections with icons
- Social media integration

## Background Effects

### Grid Pattern
```tsx
style={{
  backgroundImage: `
    linear-gradient(rgba(139,92,246,.1) 1px,transparent 1px),
    linear-gradient(90deg,rgba(139,92,246,.1) 1px,transparent 1px)
  `,
  backgroundSize: '50px 50px',
  animation: 'gridScroll 20s linear infinite',
}}
```

### Floating Particles
- Randomly positioned dots with float animation
- Opacity variations for depth
- Cyan color palette

### Gradient Orbs
- Large blurred circles with different colors
- Pulse animations with delays
- Positioned strategically for visual interest

## Responsive Design

### Breakpoints
- **Mobile**: Default (up to sm)
- **Tablet**: sm (640px+)
- **Desktop**: md (768px+), lg (1024px+)
- **Large Desktop**: xl (1280px+)

### Mobile Considerations
- Collapsible navigation (mobile menu)
- Adjusted padding and spacing
- Touch-friendly button sizes
- Responsive typography scaling
- Hidden elements on smaller screens

## Accessibility

### Color Contrast
- Ensure sufficient contrast ratios for text readability
- Use opacity carefully to maintain accessibility
- Provide alternative visual cues beyond color

### Focus States
- Visible focus indicators for keyboard navigation
- Consistent focus styling across interactive elements

### Motion Preferences
- Respect `prefers-reduced-motion` settings
- Provide static alternatives where appropriate

## Implementation Notes

### CSS Framework
- **Tailwind CSS** with custom animations
- **PostCSS** for processing
- Custom utility classes for repeated patterns

### Animation Performance
- Use `transform` and `opacity` for smooth animations
- Leverage `will-change` for complex animations
- Optimize particle systems for performance

### State Management
- React hooks for component state
- Wagmi for Web3 wallet integration
- Responsive state handling for mobile/desktop

## Best Practices

1. **Consistency**: Always reference this document before creating new components
2. **Performance**: Optimize animations and effects for smooth user experience
3. **Accessibility**: Ensure all interactive elements are accessible
4. **Mobile-First**: Design for mobile and enhance for larger screens
5. **Brand Cohesion**: Maintain the tech-courtroom aesthetic throughout
6. **Animation Balance**: Use animations purposefully, not excessively

## Component Checklist

Before implementing a new component, ensure it includes:
- [ ] Consistent color scheme (slate backgrounds, cyan/purple/pink accents)
- [ ] Responsive design across all breakpoints
- [ ] Hover/focus states with appropriate animations
- [ ] Proper spacing using the defined scale
- [ ] Backdrop blur effects where appropriate
- [ ] Gradient accents for visual hierarchy
- [ ] Mobile menu integration if navigation-related

This design system creates a cohesive, futuristic experience that reflects the innovative nature of AI-driven legal simulation while maintaining usability and accessibility.