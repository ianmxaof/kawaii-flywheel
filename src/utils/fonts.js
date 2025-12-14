export const AVAILABLE_FONTS = [
  { name: 'Impact', value: 'Impact, sans-serif', category: 'Bold' },
  { name: 'Arial Black', value: '"Arial Black", sans-serif', category: 'Bold' },
  { name: 'Bebas Neue', value: '"Bebas Neue", cursive', category: 'Bold' },
  { name: 'Oswald', value: 'Oswald, sans-serif', category: 'Bold' },
  { name: 'Roboto', value: 'Roboto, sans-serif', category: 'Sans' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif', category: 'Sans' },
  { name: 'Poppins', value: 'Poppins, sans-serif', category: 'Sans' },
  { name: 'Open Sans', value: '"Open Sans", sans-serif', category: 'Sans' },
  { name: 'Lato', value: 'Lato, sans-serif', category: 'Sans' },
  { name: 'Raleway', value: 'Raleway, sans-serif', category: 'Sans' },
  { name: 'Playfair Display', value: '"Playfair Display", serif', category: 'Serif' },
  { name: 'Merriweather', value: 'Merriweather, serif', category: 'Serif' },
  { name: 'Roboto Slab', value: '"Roboto Slab", serif', category: 'Serif' },
  { name: 'Comic Sans MS', value: '"Comic Sans MS", cursive', category: 'Fun' },
  { name: 'Courier New', value: '"Courier New", monospace', category: 'Monospace' },
];

export function loadGoogleFonts() {
  const fontsToLoad = [
    'Bebas+Neue',
    'Oswald',
    'Roboto',
    'Montserrat',
    'Poppins',
    'Open+Sans',
    'Lato',
    'Raleway',
    'Playfair+Display',
    'Merriweather',
    'Roboto+Slab',
  ];

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${fontsToLoad.map(f => `family=${f}:wght@400;700;900`).join('&')}&display=swap`;
  document.head.appendChild(link);
}

