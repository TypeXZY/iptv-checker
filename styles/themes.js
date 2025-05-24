const themes = {
    light: {
        '--bg-primary': '#ffffff',
        '--bg-secondary': '#f5f5f5',
        '--text-primary': '#333333',
        '--text-secondary': '#666666',
        '--accent-color': '#007bff',
        '--border-color': '#dddddd',
        '--success-color': '#28a745',
        '--error-color': '#dc3545',
        '--warning-color': '#ffc107',
        '--info-color': '#17a2b8',
        '--card-bg': '#ffffff',
        '--card-shadow': '0 2px 4px rgba(0,0,0,0.1)',
        '--input-bg': '#ffffff',
        '--button-bg': '#007bff',
        '--button-text': '#ffffff',
        '--button-hover': '#0056b3',
        '--popup-bg': '#ffffff',
        '--popup-shadow': '0 4px 6px rgba(0,0,0,0.1)',
        '--toast-bg': '#333333',
        '--toast-text': '#ffffff'
    },
    dark: {
        '--bg-primary': '#1a1a1a',
        '--bg-secondary': '#2d2d2d',
        '--text-primary': '#ffffff',
        '--text-secondary': '#b3b3b3',
        '--accent-color': '#0d6efd',
        '--border-color': '#404040',
        '--success-color': '#198754',
        '--error-color': '#dc3545',
        '--warning-color': '#ffc107',
        '--info-color': '#0dcaf0',
        '--card-bg': '#2d2d2d',
        '--card-shadow': '0 2px 4px rgba(0,0,0,0.2)',
        '--input-bg': '#333333',
        '--button-bg': '#0d6efd',
        '--button-text': '#ffffff',
        '--button-hover': '#0b5ed7',
        '--popup-bg': '#2d2d2d',
        '--popup-shadow': '0 4px 6px rgba(0,0,0,0.2)',
        '--toast-bg': '#ffffff',
        '--toast-text': '#333333'
    }
};

function applyTheme(theme) {
    const root = document.documentElement;
    const themeColors = themes[theme];
    
    Object.entries(themeColors).forEach(([property, value]) => {
        root.style.setProperty(property, value);
    });
    
    // Salva a preferência do tema
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
}

// Inicializa o tema
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
});

module.exports = {
    themes,
    applyTheme,
    toggleTheme
}; 