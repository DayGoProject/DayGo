export const Colors = {
    // Backgrounds
    background: '#F9F8F6', // Soft warm stone/paper
    surface: '#FFFFFF',
    surfaceAlt: '#F2F0E9', // Slightly darker stone for secondary backgrounds

    // Accents
    primary: '#E07A5F', // Muted Terra Cotta / Warm Clay
    secondary: '#3D5A80', // Deep Muted Blue for contrast
    accent: '#F2CC8F', // Soft Gold/Sand

    // Text
    textPrimary: '#2D2D2D', // Soft Charcoal
    textSecondary: '#5F5F5F', // Muted Gray
    textTertiary: '#8E8E93', // Light Gray

    // UI Elements
    border: '#E5E5EA',
    success: '#4CD964',
    error: '#FF3B30',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.3)',
};

export const Shadows = {
    small: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 2,
    },
    medium: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 4,
    },
    large: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8, // Soft, wide shadow
    },
};

export const Layout = {
    radius: {
        s: 8,
        m: 16,
        l: 24,
        xl: 32,
    },
    spacing: {
        xs: 4,
        s: 8,
        m: 16,
        l: 24,
        xl: 32,
        xxl: 48,
    },
};

// Helper for glassmorphism style (requires BlurView usually, but here simulating with transparency/border)
export const GlassStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
};
