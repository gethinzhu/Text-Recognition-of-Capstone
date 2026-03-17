import { Box, Button, Typography, LinearProgress, Tooltip, alpha } from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';

interface PipelineControlProps {
  isProcessing: boolean;
  totalFiles: number;
  completedFiles: number;
  currentFileName?: string;
  onStartProcessing: () => void;
  onStopProcessing: () => void;
  disabled?: boolean;
}

export default function PipelineControl({
  isProcessing,
  totalFiles,
  completedFiles,
  currentFileName,
  onStartProcessing,
  onStopProcessing,
  disabled,
}: PipelineControlProps) {
  const { t, language } = useLanguage();
  const progress = totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0;
  const hasQueuedFiles = totalFiles - completedFiles > 0;

  const buttonText = isProcessing
    ? t('stopProcessing')
    : t('startProcessing');

  const getProcessingProgressText = () => {
    return language === 'de'
      ? `Verarbeitung ${completedFiles + 1} von ${totalFiles} Dateien...`
      : `Processing ${completedFiles + 1} of ${totalFiles} files...`;
  };

  const getProcessingCompleteText = () => {
    const suffix = totalFiles !== 1 ? (language === 'de' ? 'en' : 's') : '';
    return language === 'de'
      ? `Alle ${totalFiles} Datei${suffix} verarbeitet`
      : `All ${totalFiles} file${suffix} processed`;
  };

  const button = (
    <Button
      variant="contained"
      color="primary"
      startIcon={
        isProcessing ? (
          <Box
            sx={{
              width: 16,
              height: 16,
              border: '2px solid',
              borderColor: 'inherit',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'rotateGeometric 1s linear infinite',
            }}
          />
        ) : (
          <PlayArrow />
        )
      }
      onClick={isProcessing ? onStopProcessing : onStartProcessing}
      disabled={disabled || (!hasQueuedFiles && !isProcessing)}
      sx={{
        backgroundColor: 'bauhausRed',
        color: 'textHeading',
        fontWeight: 600,
        px: 3,
        py: 1.2,
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          backgroundColor: '#A02020',
        },
        '&:disabled': {
          backgroundColor: alpha('#C62828', 0.3),
          color: alpha('#F5F0E1', 0.5),
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
          transition: 'left 0.5s ease',
        },
        '&:hover::before': {
          left: '100%',
        },
      }}
    >
      {buttonText}
    </Button>
  );

  return (
    <Box
      sx={{
        mt: 3,
        p: 2,
        backgroundColor: alpha('#F5F0E1', 0.04),
        border: '1px solid',
        borderColor: 'borderLight',
        borderRadius: '2px',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        {disabled && !isProcessing ? (
          <Tooltip title={t('uploadFilesFirst')} placement="top">
            <span>{button}</span>
          </Tooltip>
        ) : (
          button
        )}

        {isProcessing && currentFileName && (
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="body2"
              sx={{
                color: 'bauhausGold',
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '0.8rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {currentFileName}
            </Typography>
          </Box>
        )}
      </Box>

      {isProcessing && (
        <Box>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1,
            }}
          >
            <Typography variant="caption" sx={{ color: 'textMuted' }}>
              {getProcessingProgressText()}
            </Typography>
            <Typography variant="caption" sx={{ color: 'bauhausGold' }}>
              {Math.round(progress)}%
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: '2px',
              backgroundColor: alpha('#F5F0E1', 0.1),
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #8B7355 0%, #B8860B 100%)',
                borderRadius: '2px',
              },
            }}
          />
        </Box>
      )}

      {!isProcessing && completedFiles > 0 && completedFiles === totalFiles && (
        <Box
          sx={{
            p: 1.5,
            backgroundColor: alpha('#4A6741', 0.1),
            border: '1px solid',
            borderColor: alpha('#4A6741', 0.3),
            borderRadius: '2px',
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" sx={{ color: 'success.main' }}>
            {getProcessingCompleteText()}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
