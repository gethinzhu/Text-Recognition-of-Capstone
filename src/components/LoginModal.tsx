import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  alpha,
} from '@mui/material';
import { Lock } from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const { t } = useLanguage();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'bgCard',
          border: '1px solid',
          borderColor: 'borderMedium',
          borderRadius: '2px',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -2,
            left: -2,
            width: 20,
            height: 20,
            borderColor: alpha('#B8860B', 0.5),
            borderStyle: 'solid',
            borderWidth: '3px 0 0 3px',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 20,
            height: 20,
            borderColor: alpha('#B8860B', 0.5),
            borderStyle: 'solid',
            borderWidth: '0 3px 3px 0',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          fontFamily: '"UnifrakturMaguntia", serif',
          color: 'textHeading',
          textAlign: 'center',
          pb: 1,
        }}
      >
        {t('loginModalTitle')}
      </DialogTitle>

      <DialogContent sx={{ textAlign: 'center' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 2,
          }}
        >
          <Lock
            sx={{
              fontSize: 64,
              color: 'bauhausGold',
              mb: 2,
              opacity: 0.8,
            }}
          />
          <Typography
            variant="body1"
            sx={{
              color: 'textPrimary',
              mb: 1,
            }}
          >
            {t('loginComingSoon')}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderColor: 'borderMedium',
            color: 'textPrimary',
            '&:hover': {
              borderColor: 'bauhausGold',
              backgroundColor: alpha('#B8860B', 0.1),
            },
          }}
        >
          {t('closeButton')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
