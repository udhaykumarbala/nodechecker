# 0G Foundation Design System

Extracted from https://claim.0gfoundation.ai/

## Color Palette

### Primary Colors
```css
--primary-purple: #7C3AED;        /* Main brand purple */
--primary-purple-dark: #6D28D9;   /* Hover/active states */
--primary-purple-light: #A78BFA;  /* Light accents */
```

### Secondary Colors
```css
--secondary-lavender: #E9D5FF;    /* Card backgrounds, highlights */
--secondary-lavender-light: #F3E8FF; /* Lighter backgrounds */
--secondary-pink: #FDF4FF;        /* Very light purple tints */
```

### Neutral Colors
```css
--white: #FFFFFF;
--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--gray-200: #E5E7EB;
--gray-300: #D1D5DB;
--gray-400: #9CA3AF;
--gray-500: #6B7280;
--gray-600: #4B5563;
--gray-700: #374151;
--gray-800: #1F2937;
--gray-900: #111827;
--black: #000000;
```

### Semantic Colors
```css
--success: #10B981;
--error: #EF4444;
--warning: #F59E0B;
--info: #3B82F6;
```

## Typography

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Display', 'Inter', sans-serif;
```

### Font Sizes
```css
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
```

### Font Weights
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Line Heights
```css
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

## Spacing System

Based on 4px/0.25rem base unit:

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
```

## Border Radius

```css
--radius-sm: 0.375rem;    /* 6px - Small elements */
--radius-md: 0.5rem;      /* 8px - Buttons, inputs */
--radius-lg: 0.75rem;     /* 12px - Cards */
--radius-xl: 1rem;        /* 16px - Large cards */
--radius-2xl: 1.5rem;     /* 24px - Hero sections */
--radius-full: 9999px;    /* Pills, badges */
```

## Shadows

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

## Components

### Buttons

#### Primary Button
```css
.btn-primary {
  background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%);
  color: #FFFFFF;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.2);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(124, 58, 237, 0.3);
}

.btn-primary:active {
  transform: translateY(0);
}
```

#### Secondary Button
```css
.btn-secondary {
  background: #FFFFFF;
  color: #7C3AED;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  border: 2px solid #E9D5FF;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #F3E8FF;
  border-color: #7C3AED;
}
```

### Cards

```css
.card {
  background: #FFFFFF;
  border-radius: 0.75rem;
  padding: 1.5rem;
  border: 1px solid #E5E7EB;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.card-purple {
  background: linear-gradient(135deg, #FDF4FF 0%, #F3E8FF 100%);
  border: 1px solid #E9D5FF;
}
```

### Stats Card
```css
.stats-card {
  background: #FFFFFF;
  border-radius: 0.75rem;
  padding: 1.5rem;
  border: 1px solid #E9D5FF;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stats-icon {
  width: 3rem;
  height: 3rem;
  background: #F3E8FF;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7C3AED;
}

.stats-value {
  font-size: 2.25rem;
  font-weight: 700;
  color: #111827;
  line-height: 1;
}

.stats-label {
  font-size: 0.875rem;
  color: #6B7280;
  font-weight: 500;
}
```

### Badges

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-purple {
  background: #E9D5FF;
  color: #6D28D9;
}

.badge-gray {
  background: #F3F4F6;
  color: #6B7280;
}

.badge-success {
  background: #D1FAE5;
  color: #065F46;
}
```

### Tabs

```css
.tabs {
  display: inline-flex;
  background: #F9FAFB;
  border-radius: 0.5rem;
  padding: 0.25rem;
  gap: 0.25rem;
}

.tab {
  padding: 0.5rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  color: #6B7280;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  background: transparent;
}

.tab:hover {
  color: #111827;
}

.tab.active {
  background: #FFFFFF;
  color: #7C3AED;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}
```

### Input Fields

```css
.input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #E5E7EB;
  border-radius: 0.5rem;
  font-size: 1rem;
  color: #111827;
  transition: all 0.2s;
  background: #FFFFFF;
}

.input:focus {
  outline: none;
  border-color: #7C3AED;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.input::placeholder {
  color: #9CA3AF;
}

.input-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}
```

### Radio Buttons

```css
.radio-card {
  padding: 1.25rem;
  border: 2px solid #E5E7EB;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  background: #FFFFFF;
}

.radio-card:hover {
  border-color: #A78BFA;
  background: #FDFBFF;
}

.radio-card.selected {
  border-color: #7C3AED;
  background: #F3E8FF;
}

.radio-title {
  font-weight: 600;
  font-size: 1rem;
  color: #111827;
  margin-bottom: 0.25rem;
}

.radio-description {
  font-size: 0.875rem;
  color: #6B7280;
}
```

### Sidebar Navigation

```css
.sidebar {
  width: 16rem;
  background: #FFFFFF;
  border-right: 1px solid #E5E7EB;
  height: 100vh;
  padding: 1.5rem;
}

.nav-section {
  margin-bottom: 2rem;
}

.nav-section-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #9CA3AF;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
  padding: 0 0.75rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6B7280;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 0.25rem;
}

.nav-item:hover {
  background: #F9FAFB;
  color: #111827;
}

.nav-item.active {
  background: #F3E8FF;
  color: #7C3AED;
}

.nav-icon {
  width: 1.25rem;
  height: 1.25rem;
}
```

## Backgrounds

### Gradient Backgrounds
```css
.bg-gradient-purple {
  background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%);
}

.bg-gradient-light-purple {
  background: linear-gradient(135deg, #FDF4FF 0%, #F3E8FF 100%);
}

.bg-gradient-soft {
  background: radial-gradient(ellipse at bottom, #F3E8FF 0%, #FFFFFF 50%);
}
```

### Background Overlays
```css
.overlay-purple {
  position: relative;
}

.overlay-purple::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(124, 58, 237, 0.1) 0%, transparent 70%);
  pointer-events: none;
}
```

## Layout

### Container
```css
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.5rem;
}
```

### Grid System
```css
.grid {
  display: grid;
  gap: 1.5rem;
}

.grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}

.grid-cols-3 {
  grid-template-columns: repeat(3, 1fr);
}

.grid-cols-4 {
  grid-template-columns: repeat(4, 1fr);
}

@media (max-width: 768px) {
  .grid-cols-2,
  .grid-cols-3,
  .grid-cols-4 {
    grid-template-columns: 1fr;
  }
}
```

## Animations

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

.animate-slide-in {
  animation: slideIn 0.3s ease-out;
}
```

## Transitions

```css
.transition-all {
  transition: all 0.2s ease-in-out;
}

.transition-colors {
  transition: background-color 0.2s, color 0.2s, border-color 0.2s;
}

.transition-transform {
  transition: transform 0.2s ease-out;
}
```

## Breakpoints

```css
/* Mobile first approach */
--breakpoint-sm: 640px;   /* Small devices */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Laptops */
--breakpoint-xl: 1280px;  /* Desktops */
--breakpoint-2xl: 1536px; /* Large screens */
```

## Usage Examples

### Example: Stats Dashboard
```html
<div class="grid grid-cols-2" style="gap: 1.5rem;">
  <div class="stats-card">
    <div class="stats-icon">
      <svg><!-- icon --></svg>
    </div>
    <div>
      <div class="stats-value">2</div>
      <div class="stats-label">Total Nodes</div>
    </div>
  </div>
  <div class="stats-card">
    <div class="stats-icon">
      <svg><!-- icon --></svg>
    </div>
    <div>
      <div class="stats-value">2</div>
      <div class="stats-label">Delegated Nodes</div>
    </div>
  </div>
</div>
```

### Example: Form with Tabs
```html
<div class="card">
  <div class="tabs">
    <button class="tab active">Delegate</button>
    <button class="tab">Undelegate</button>
  </div>

  <div style="margin-top: 1.5rem;">
    <label class="input-label">Node Operator Address</label>
    <input
      type="text"
      class="input"
      placeholder="Enter a valid wallet address to delegate your nodes"
    />
  </div>
</div>
```

## Design Principles

1. **Clarity First**: Every element should have a clear purpose
2. **Consistent Spacing**: Use the 4px spacing system throughout
3. **Subtle Animations**: Enhance UX without being distracting
4. **Purple Accent**: Use purple to highlight important actions and states
5. **Clean Borders**: 1px borders with light gray for separation
6. **Card-Based Layout**: Group related information in cards
7. **Generous Whitespace**: Don't crowd elements
8. **Mobile Responsive**: Design mobile-first, enhance for desktop

## Accessibility

- Maintain 4.5:1 contrast ratio for text
- Use semantic HTML elements
- Provide focus states for all interactive elements
- Support keyboard navigation
- Use aria labels where needed
