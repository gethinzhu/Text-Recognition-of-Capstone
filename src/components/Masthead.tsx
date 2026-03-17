import { Box, Chip, Typography, useTheme, useMediaQuery, Button, alpha } from '@mui/material';
import type { PipelineStatus } from '../types';
import { useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface MastheadProps {
  pipelineStatus: PipelineStatus;
  onLoginClick: () => void;
}

const statusLabels: Record<PipelineStatus, { de: string; en: string }> = {
  idle: { de: 'Bereit', en: 'Ready' },
  processing: { de: 'Verarbeitung läuft', en: 'Processing' },
  complete: { de: 'Abgeschlossen', en: 'Complete' },
  error: { de: 'Fehler', en: 'Error' },
};

const statusColors: Record<PipelineStatus, 'default' | 'warning' | 'success' | 'error'> = {
  idle: 'default',
  processing: 'warning',
  complete: 'success',
  error: 'error',
};

export default function Masthead({ pipelineStatus, onLoginClick }: MastheadProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { language, toggleLanguage, t } = useLanguage();

  const statusLabel = useMemo(
    () => (language === 'de' ? statusLabels[pipelineStatus].de : statusLabels[pipelineStatus].en),
    [pipelineStatus, language]
  );

  return (
    <Box
      component="header"
      sx={{
        position: 'relative',
        backgroundColor: 'bgDeep',
        borderBottom: '3px solid',
        borderColor: 'borderThick',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(184, 134, 61, 0.3) 50%, transparent 100%)',
        }}
      />

      <Box
        sx={{
          maxWidth: 1400,
          mx: 'auto',
          px: { xs: 2, md: 4 },
          py: { xs: 2, md: 3 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h3"
              sx={{
                fontFamily: '"UnifrakturMaguntia", serif',
                fontSize: { xs: '1.8rem', md: '2.5rem' },
                color: 'textHeading',
                lineHeight: 1.2,
                letterSpacing: '0.02em',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
              }}
            >
              {t('title')}
            </Typography>

            {!isMobile && (
              <Typography
                variant="overline"
                sx={{
                  display: 'block',
                  mt: 0.5,
                  fontSize: '0.65rem',
                  letterSpacing: '0.25em',
                  color: 'textMuted',
                  fontWeight: 400,
                }}
              >
                {t('subtitle')}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={statusLabel}
              color={statusColors[pipelineStatus]}
              size="small"
              sx={{
                fontWeight: 500,
                fontSize: '0.75rem',
                height: 28,
              }}
            />

            {!isMobile && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid',
                  borderColor: 'borderMedium',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <Box
                  onClick={() => language !== 'de' && toggleLanguage()}
                  sx={{
                    px: 1,
                    py: 0.5,
                    cursor: language !== 'de' ? 'pointer' : 'default',
                    backgroundColor: language === 'de' ? alpha('#B8860B', 0.2) : 'transparent',
                    color: language === 'de' ? 'bauhausGold' : 'textMuted',
                    fontSize: '0.7rem',
                    fontWeight: language === 'de' ? 600 : 400,
                    transition: 'all 0.2s ease',
                    '&:hover': language !== 'de' ? {
                      backgroundColor: alpha('#B8860B', 0.1),
                    } : {},
                  }}
                >
                  DE
                </Box>
                <Box
                  sx={{
                    width: '1px',
                    height: '100%',
                    backgroundColor: 'borderMedium',
                  }}
                />
                <Box
                  onClick={() => language !== 'en' && toggleLanguage()}
                  sx={{
                    px: 1,
                    py: 0.5,
                    cursor: language !== 'en' ? 'pointer' : 'default',
                    backgroundColor: language === 'en' ? alpha('#B8860B', 0.2) : 'transparent',
                    color: language === 'en' ? 'bauhausGold' : 'textMuted',
                    fontSize: '0.7rem',
                    fontWeight: language === 'en' ? 600 : 400,
                    transition: 'all 0.2s ease',
                    '&:hover': language !== 'en' ? {
                      backgroundColor: alpha('#B8860B', 0.1),
                    } : {},
                  }}
                >
                  EN
                </Box>
              </Box>
            )}

            <Button
              variant="outlined"
              size="small"
              onClick={onLoginClick}
              sx={{
                borderColor: 'borderMedium',
                color: 'bauhausGold',
                fontSize: '0.75rem',
                fontWeight: 600,
                height: 28,
                px: 2,
                '&:hover': {
                  borderColor: 'bauhausGold',
                  backgroundColor: alpha('#B8860B', 0.1),
                },
              }}
            >
              {t('login')}
            </Button>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(184, 134, 61, 0.4) 50%, transparent 100%)',
        }}
      />
    </Box>
  );
}
