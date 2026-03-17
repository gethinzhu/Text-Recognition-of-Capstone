import { Box, Typography, Card, CardContent, IconButton, Chip, LinearProgress, alpha } from '@mui/material';
import { Close, Image as ImageIcon, Refresh } from '@mui/icons-material';
import type { FileItem, FileStatus } from '../types';
import { formatFileSize } from '../utils';
import { useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface FileListProps {
  files: FileItem[];
  onRemoveFile: (id: string) => void;
  onRetryFile: (id: string) => void;
}

const statusLabels: Record<FileStatus, { de: string; en: string }> = {
  queued: { de: 'Warteschlange', en: 'Queued' },
  processing: { de: 'Verarbeitung', en: 'Processing' },
  complete: { de: 'Fertig', en: 'Complete' },
  error: { de: 'Fehler', en: 'Error' },
};

const statusTooltips: Record<FileStatus, string> = {
  queued: 'In queue for processing',
  processing: 'Currently processing',
  complete: 'Processing complete',
  error: 'Processing failed',
};

const statusColors: Record<FileStatus, 'default' | 'warning' | 'success' | 'error'> = {
  queued: 'default',
  processing: 'warning',
  complete: 'success',
  error: 'error',
};

export default function FileList({ files, onRemoveFile, onRetryFile }: FileListProps) {
  const { t, language } = useLanguage();

  const completedCount = useMemo(
    () => files.filter((f) => f.status === 'complete').length,
    [files]
  );

  const getStatusLabel = (status: FileStatus) => {
    return language === 'de' ? statusLabels[status].de : statusLabels[status].en;
  };

  const getFileCountText = (count: number) => {
    const suffix = count !== 1 ? (language === 'de' ? 'en' : 's') : '';
    return `${count} Datei${suffix}`;
  };

  const getFilesCompleteText = (count: number) => {
    return `${count} ${language === 'de' ? 'fertig' : 'complete'}`;
  };

  if (files.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 6,
          px: 3,
          textAlign: 'center',
        }}
      >
        <ImageIcon
          sx={{
            fontSize: 80,
            color: 'textMuted',
            mb: 2,
            opacity: 0.5,
          }}
        />
        <Typography variant="body1" sx={{ color: 'textMuted' }}>
          {t('filesLoaded')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" sx={{ color: 'textMuted' }}>
          {getFileCountText(files.length)}
          {completedCount > 0 && (
            <Chip
              label={getFilesCompleteText(completedCount)}
              size="small"
              color="success"
              sx={{ ml: 1, height: 20, fontSize: '0.65rem' }}
            />
          )}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {files.map((file, index) => (
          <Card
            key={file.id}
            sx={{
              backgroundColor: alpha('#F5F0E1', 0.06),
              transition: 'all 0.3s ease',
              animation: 'slideInLeft 0.4s ease forwards',
              animationDelay: `${index * 0.05}s`,
              opacity: 0,
              '&:hover': {
                backgroundColor: alpha('#F5F0E1', 0.08),
              },
            }}
          >
            <CardContent
              sx={{
                p: 2,
                '&:last-child': { pb: 2 },
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: '2px',
                  overflow: 'hidden',
                  backgroundColor: alpha('#F5F0E1', 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {file.thumbnail ? (
                  <img
                    src={file.thumbnail}
                    alt={file.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <ImageIcon sx={{ color: 'textMuted', fontSize: 24 }} />
                )}
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 0.5,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: '0.8rem',
                      color: 'textPrimary',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={file.name}
                  >
                    {file.name}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: 'textMuted' }}>
                    {formatFileSize(file.size)}
                  </Typography>

                  <Chip
                    label={getStatusLabel(file.status)}
                    color={statusColors[file.status]}
                    size="small"
                    title={statusTooltips[file.status]}
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      '& .MuiChip-label': { px: 1 },
                    }}
                  />

                  {file.status === 'error' && file.errorMessage && (
                    <Typography
                      variant="caption"
                      sx={{ color: 'error', fontSize: '0.65rem' }}
                      title={file.errorMessage}
                    >
                      {file.errorMessage.length > 30
                        ? `${file.errorMessage.slice(0, 30)}...`
                        : file.errorMessage}
                    </Typography>
                  )}
                </Box>

                {file.status === 'processing' && (
                  <LinearProgress
                    variant="determinate"
                    value={file.progress}
                    sx={{
                      height: 6,
                      borderRadius: '2px',
                      backgroundColor: alpha('#F5F0E1', 0.1),
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #8B7355 0%, #B8860B 100%)',
                      },
                    }}
                  />
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {file.status === 'error' && (
                  <IconButton
                    size="small"
                    onClick={() => onRetryFile(file.id)}
                    title={t('retryTooltip')}
                    sx={{
                      color: 'bauhausGold',
                      '&:hover': {
                        backgroundColor: alpha('#B8860B', 0.1),
                      },
                    }}
                  >
                    <Refresh fontSize="small" />
                  </IconButton>
                )}

                {file.status !== 'processing' && (
                  <IconButton
                    size="small"
                    onClick={() => onRemoveFile(file.id)}
                    title={t('removeTooltip')}
                    sx={{
                      color: 'textMuted',
                      '&:hover': {
                        color: 'error',
                        backgroundColor: alpha('#8B2500', 0.1),
                      },
                    }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
