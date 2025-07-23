import { DefaultTheme, configureFonts } from 'react-native-paper';

export const themeColors = {
  primary: '#8e44ad',       // a rich purple shade
  secondary: '#000000',     // black
  background: '#ffffff',    // white
};

export const theme = {
  ...DefaultTheme,
  dark: false,
  roundness: 4,
  colors: {
    ...DefaultTheme.colors,
    ...themeColors,
  },
  fonts: configureFonts({ isV3: true }),
  animation: {
    scale: 1.0,
  },
};
