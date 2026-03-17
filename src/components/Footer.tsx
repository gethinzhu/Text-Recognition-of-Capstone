import { Box, Typography, Container } from '@mui/material';
import BauhausShapes from './BauhausShapes';
import { useLanguage } from '../contexts/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <Box
      component="footer"
      sx={{
        position: 'relative',
        mt: 6,
        py: 3,
        borderTop: '3px solid',
        borderColor: 'borderThick',
        backgroundColor: 'bgDeep',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(184, 134, 61, 0.3) 50%, transparent 100%)',
        }}
      />

      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: 'textMuted',
              fontSize: '0.7rem',
              letterSpacing: '0.1em',
            }}
          >
            {t('footer')}
          </Typography>

          <BauhausShapes backgroundOnly={false} />
        </Box>
      </Container>
    </Box>
  );
}
