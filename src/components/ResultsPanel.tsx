import { Box, Typography, Button, alpha, Tooltip } from '@mui/material';
import { FolderZip, Description } from '@mui/icons-material';
import type { FileResult } from '../types';
import ResultCard from './ResultCard';
import { createDownloadFile } from '../utils';
import { useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface ResultsPanelProps {
  results: FileResult[];
  onPreview: (result: FileResult) => void;
  hasProcessedFiles?: boolean;
}

export default function ResultsPanel({ results, onPreview, hasProcessedFiles }: ResultsPanelProps) {
  const { t } = useLanguage();
  const hasResults = results.length > 0;

  const handleDownloadAll = useMemo(() => () => {
    const files = results.map((r) => ({
      name: r.fileName.replace(/\.[^/.]+$/, '') + '.txt',
      content: r.text || '',
    }));

    const content = files.map(f => `=== ${f.name} ===\n\n${f.content}`).join('\n\n' + '='.repeat(50) + '\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ocr-results.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [results]);

  const handleDownloadSingle = useMemo(() => (result: FileResult) => {
    if (result.text) {
      createDownloadFile(result.text, result.fileName.replace(/\.[^/.]+$/, '') + '.txt');
    }
  }, []);

  const downloadAllButton = useMemo(() => {
    const button = (
      <Button
        variant="contained"
        color="secondary"
        size="small"
        startIcon={<FolderZip />}
        onClick={handleDownloadAll}
        disabled={!hasResults}
        sx={{
          fontSize: '0.8rem',
          '&:disabled': {
            backgroundColor: alpha('#B8860B', 0.2),
            color: alpha('#F5F0E1', 0.4),
          },
        }}
      >
        {t('downloadAll')}
      </Button>
    );

    if (!hasResults) {
      return (
        <Tooltip title={t('uploadFirst')} placement="top">
          <span>{button}</span>
        </Tooltip>
      );
    }

    return button;
  }, [hasResults, handleDownloadAll, t]);

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontFamily: '"UnifrakturMaguntia", serif',
            color: 'textHeading',
          }}
        >
          {t('resultsTitle')}
        </Typography>

        {downloadAllButton}
      </Box>

      {!hasResults ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 8,
            px: 3,
            textAlign: 'center',
            backgroundColor: alpha('#F5F0E1', 0.03),
            border: '1px dashed',
            borderColor: 'borderLight',
            borderRadius: '2px',
          }}
        >
          <Description
            sx={{
              fontSize: 64,
              color: 'textMuted',
              mb: 2,
              opacity: 0.4,
            }}
          />
          <Typography variant="body1" sx={{ color: 'textMuted', mb: 1 }}>
            {t('noResults')}
          </Typography>
          <Typography variant="caption" sx={{ color: 'textMuted', maxWidth: 280 }}>
            {hasProcessedFiles ? '' : t('uploadFirst')}
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            columnCount: { xs: 1, sm: 2, md: 3 },
            columnGap: '20px',
          }}
        >
          {results.map((result, index) => (
            <Box
              key={result.id}
              sx={{
                breakInside: 'avoid',
                mb: '20px',
                animation: 'fadeInUp 0.5s ease forwards',
                animationDelay: `${index * 0.1}s`,
                opacity: 0,
              }}
            >
              <ResultCard
                result={result}
                onPreview={onPreview}
                onDownload={handleDownloadSingle}
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
