import { createTheme, alpha } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    bgDeep: string;
    bgPrimary: string;
    bgCard: string;
    bgParchment: string;
    textHeading: string;
    textMuted: string;
    textAccent: string;
    bauhausRed: string;
    bauhausGold: string;
    bauhausBlue: string;
    sepia: string;
    borderLight: string;
    borderMedium: string;
    borderThick: string;
  }
  interface PaletteOptions {
    bgDeep?: string;
    bgPrimary?: string;
    bgCard?: string;
    bgParchment?: string;
    textHeading?: string;
    textMuted?: string;
    textAccent?: string;
    bauhausRed?: string;
    bauhausGold?: string;
    bauhausBlue?: string;
    sepia?: string;
    borderLight?: string;
    borderMedium?: string;
    borderThick?: string;
  }
}

const palette = {
  bgDeep: '#0D0D0D',
  bgPrimary: '#1A1A14',
  bgCard: '#1F1E18',
  bgParchment: '#F5F0E1',
  textPrimary: '#E8E0D0',
  textHeading: '#F5F0E1',
  textMuted: '#8A8070',
  textAccent: '#B8860B',
  bauhausRed: '#C62828',
  bauhausGold: '#B8860B',
  bauhausBlue: '#1A3A5C',
  sepia: '#8B7355',
  success: '#4A6741',
  error: '#8B2500',
  processing: '#B8860B',
  queued: '#5C5C52',
  borderLight: 'rgba(184, 134, 61, 0.2)',
  borderMedium: 'rgba(184, 134, 61, 0.35)',
  borderThick: 'rgba(184, 134, 61, 0.5)',
};

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: palette.bauhausRed,
      contrastText: '#F5F0E1',
    },
    secondary: {
      main: palette.bauhausGold,
      contrastText: '#0D0D0D',
    },
    info: {
      main: palette.bauhausBlue,
    },
    success: {
      main: palette.success,
    },
    error: {
      main: palette.error,
    },
    warning: {
      main: palette.processing,
    },
    background: {
      default: palette.bgPrimary,
      paper: palette.bgCard,
    },
    text: {
      primary: palette.textPrimary,
      secondary: palette.textMuted,
    },
    divider: palette.borderLight,
    bgDeep: palette.bgDeep,
    bgPrimary: palette.bgPrimary,
    bgCard: palette.bgCard,
    bgParchment: palette.bgParchment,
    textHeading: palette.textHeading,
    textMuted: palette.textMuted,
    textAccent: palette.textAccent,
    bauhausRed: palette.bauhausRed,
    bauhausGold: palette.bauhausGold,
    bauhausBlue: palette.bauhausBlue,
    sepia: palette.sepia,
    borderLight: palette.borderLight,
    borderMedium: palette.borderMedium,
    borderThick: palette.borderThick,
  },
  typography: {
    fontFamily: '"DM Sans", "Helvetica Neue", sans-serif',
    h1: {
      fontFamily: '"UnifrakturMaguntia", "Old English Text MT", serif',
      fontWeight: 400,
      color: palette.textHeading,
    },
    h2: {
      fontFamily: '"UnifrakturMaguntia", "Old English Text MT", serif',
      fontWeight: 400,
      color: palette.textHeading,
    },
    h3: {
      fontFamily: '"UnifrakturMaguntia", "Old English Text MT", serif',
      fontWeight: 400,
      color: palette.textHeading,
    },
    h4: {
      fontFamily: '"UnifrakturMaguntia", "Old English Text MT", serif',
      fontWeight: 400,
      color: palette.textHeading,
    },
    h5: {
      fontFamily: '"UnifrakturMaguntia", "Old English Text MT", serif',
      fontWeight: 400,
      color: palette.textHeading,
    },
    h6: {
      fontFamily: '"UnifrakturMaguntia", "Old English Text MT", serif',
      fontWeight: 400,
      color: palette.textHeading,
    },
    body1: {
      fontFamily: '"DM Sans", "Helvetica Neue", sans-serif',
      color: palette.textPrimary,
    },
    body2: {
      fontFamily: '"DM Sans", "Helvetica Neue", sans-serif',
      color: palette.textPrimary,
    },
    button: {
      fontFamily: '"DM Sans", "Helvetica Neue", sans-serif',
      fontWeight: 600,
      textTransform: 'none',
    },
    caption: {
      fontFamily: '"DM Sans", "Helvetica Neue", sans-serif',
      color: palette.textMuted,
    },
    overline: {
      fontFamily: '"DM Sans", "Helvetica Neue", sans-serif',
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 2,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: palette.bgPrimary,
          backgroundImage: `
            radial-gradient(circle at 25% 25%, ${alpha(palette.bauhausGold, 0.03)} 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, ${alpha(palette.bauhausBlue, 0.02)} 0%, transparent 50%)
          `,
          minHeight: '100vh',
        },
        '*::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '*::-webkit-scrollbar-track': {
          background: palette.bgDeep,
        },
        '*::-webkit-scrollbar-thumb': {
          background: palette.sepia,
          borderRadius: '4px',
        },
        '*::-webkit-scrollbar-thumb:hover': {
          background: palette.bauhausGold,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '2px',
          padding: '10px 24px',
          transition: 'all 0.3s ease',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: `0 4px 20px ${alpha(palette.bauhausRed, 0.3)}`,
            transform: 'translateY(-2px)',
          },
        },
        containedPrimary: {
          backgroundColor: palette.bauhausRed,
          '&:hover': {
            backgroundColor: '#A02020',
          },
        },
        containedSecondary: {
          backgroundColor: palette.bauhausGold,
          color: palette.bgDeep,
          '&:hover': {
            backgroundColor: '#D4A017',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: palette.bgCard,
          border: `1px solid ${palette.borderLight}`,
        },
        elevation1: {
          boxShadow: `0 2px 8px ${alpha('#000', 0.3)}`,
        },
        elevation2: {
          boxShadow: `0 4px 16px ${alpha('#000', 0.4)}`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(palette.bgParchment, 0.06),
          border: `1px solid ${palette.borderLight}`,
          position: 'relative',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: palette.borderMedium,
            boxShadow: `0 4px 20px ${alpha(palette.bauhausGold, 0.15)}`,
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-1px',
            left: '-1px',
            width: '16px',
            height: '16px',
            borderColor: alpha(palette.sepia, 0.4),
            borderStyle: 'solid',
            borderWidth: '2px 0 0 2px',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: '-1px',
            right: '-1px',
            width: '16px',
            height: '16px',
            borderColor: alpha(palette.sepia, 0.4),
            borderStyle: 'solid',
            borderWidth: '0 2px 2px 0',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '2px',
          fontWeight: 500,
        },
        colorSuccess: {
          backgroundColor: alpha(palette.success, 0.2),
          color: '#7BA06B',
          border: `1px solid ${alpha(palette.success, 0.3)}`,
        },
        colorError: {
          backgroundColor: alpha(palette.error, 0.2),
          color: '#D45440',
          border: `1px solid ${alpha(palette.error, 0.3)}`,
        },
        colorWarning: {
          backgroundColor: alpha(palette.processing, 0.2),
          color: palette.bauhausGold,
          border: `1px solid ${alpha(palette.processing, 0.3)}`,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 8,
          borderRadius: '2px',
          backgroundColor: alpha(palette.bgParchment, 0.1),
        },
        bar: {
          borderRadius: '2px',
          background: `linear-gradient(90deg, ${palette.sepia} 0%, ${palette.bauhausGold} 100%)`,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: palette.bgCard,
          border: `1px solid ${palette.borderMedium}`,
          backgroundImage: 'none',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: alpha(palette.bauhausGold, 0.1),
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: palette.bgDeep,
          border: `1px solid ${palette.borderMedium}`,
          color: palette.textPrimary,
          fontSize: '0.75rem',
        },
      },
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          backgroundColor: palette.error,
          color: palette.textHeading,
        },
      },
    },
  },
});

export default theme;
export { palette };
