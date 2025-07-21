import { DefaultTheme, configureFonts } from 'react-native-paper';

export const themeColors = {
  primary: '#800080',
  secondary: '#000000',
  background: '#FFF',
};

export const theme = {
  ...DefaultTheme,
  dark: false,
  roundness: 4,
  colors: {
    ...DefaultTheme.colors,
    ...themeColors, // your custom colors will override the defaults
  },
  fonts: configureFonts({ isV3: true }),
  animation: {
    scale: 1.0,
  },
};
