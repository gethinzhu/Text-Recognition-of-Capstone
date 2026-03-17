import { Box, Typography, Button, Chip, alpha } from '@mui/material';
import { Download, Visibility, Description, PictureAsPdf } from '@mui/icons-material';
import type { FileResult } from '../types';
import { formatFileSize } from '../utils';
import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface ResultCardProps {
  result: FileResult;
  onPreview: (result: FileResult) => void;
  onDownload: (result: FileResult) => void;
}

export default function ResultCard({ result, onPreview, onDownload }: ResultCardProps) {
  const { t } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        backgroundColor: alpha('#F5F0E1', 0.06),
        border: '1px solid',
        borderColor: isHovered ? 'borderMedium' : 'borderLight',
        borderRadius: '2px',
        p: 2,
        position: 'relative',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-2px)' : 'none',
        boxShadow: isHovered
          ? `0 4px 20px ${alpha('#B8860B', 0.15)}`
          : 'none',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -1,
          left: -1,
          width: 16,
          height: 16,
          borderColor: alpha('#B8860B', 0.4),
          borderStyle: 'solid',
          borderWidth: '2px 0 0 2px',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: -1,
          right: -1,
          width: 16,
          height: 16,
          borderColor: alpha('#B8860B', 0.4),
          borderStyle: 'solid',
          borderWidth: '0 2px 2px 0',
        },
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="body2"
          sx={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.8rem',
            color: 'textPrimary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            mb: 0.5,
          }}
          title={result.fileName}
        >
          {result.fileName}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            icon={
              result.format === 'pdf' ? (
                <PictureAsPdf sx={{ fontSize: '14px !important' }} />
              ) : (
                <Description sx={{ fontSize: '14px !important' }} />
              )
            }
            label={result.format === 'pdf' ? 'PDF' : 'Text'}
            size="small"
            variant="outlined"
            sx={{
              height: 22,
              fontSize: '0.7rem',
              borderColor: 'borderMedium',
              color: 'textMuted',
              '& .MuiChip-icon': {
                color: 'bauhausGold',
              },
            }}
          />

          <Typography variant="caption" sx={{ color: 'textMuted' }}>
            {formatFileSize(result.size)}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Visibility />}
          onClick={() => onPreview(result)}
          sx={{
            flex: 1,
            borderColor: 'borderMedium',
            color: 'textPrimary',
            fontSize: '0.75rem',
            py: 0.5,
            '&:hover': {
              borderColor: 'bauhausGold',
              backgroundColor: alpha('#B8860B', 0.1),
            },
          }}
        >
          {t('preview')}
        </Button>

        <Button
          size="small"
          variant="contained"
          color="secondary"
          startIcon={<Download />}
          onClick={() => onDownload(result)}
          sx={{
            flex: 1,
            fontSize: '0.75rem',
            py: 0.5,
          }}
        >
          {t('download')}
        </Button>
      </Box>
    </Box>
  );
}
