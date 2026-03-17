import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  alpha,
} from '@mui/material';
import { Close, Download, Refresh } from '@mui/icons-material';
import type { FileResult } from '../types';
import { createDownloadFile } from '../utils';

interface TextPreviewModalProps {
  open: boolean;
  result: FileResult | null;
  onClose: () => void;
}

export default function TextPreviewModal({ open, result, onClose }: TextPreviewModalProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  const fullText = result?.text || '';

  useEffect(() => {
    if (open && fullText) {
      setDisplayedText('');
      setIsAnimating(true);

      let currentIndex = 0;
      const chars = fullText.split('');
      const totalChars = chars.length;

      const interval = setInterval(() => {
        if (currentIndex < totalChars) {
          setDisplayedText(fullText.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(interval);
          setIsAnimating(false);
        }
      }, 30);

      return () => clearInterval(interval);
    }
  }, [open, fullText]);

  const handleRestart = useMemo(() => () => {
    if (fullText) {
      setDisplayedText('');
      setIsAnimating(true);

      let currentIndex = 0;
      const chars = fullText.split('');
      const totalChars = chars.length;

      const interval = setInterval(() => {
        if (currentIndex < totalChars) {
          setDisplayedText(fullText.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(interval);
          setIsAnimating(false);
        }
      }, 30);
    }
  }, [fullText]);

  const handleDownload = useMemo(() => () => {
    if (result && fullText) {
      createDownloadFile(fullText, result.fileName.replace(/\.[^/.]+$/, '') + '.txt');
    }
  }, [result, fullText]);

  if (!result) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#1F1E18',
          backgroundImage: 'none',
          border: '1px solid',
          borderColor: 'borderMedium',
          maxHeight: '85vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'borderLight',
          py: 2,
          px: 3,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontFamily: '"UnifrakturMaguntia", serif',
              color: 'textHeading',
              fontSize: '1.5rem',
            }}
          >
            Texterkennung
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'textMuted',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.7rem',
            }}
          >
            {result.fileName}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            size="small"
            onClick={handleRestart}
            title="Erneut abspielen"
            sx={{ color: 'textMuted' }}
          >
            <Refresh />
          </IconButton>
          <IconButton
            size="small"
            onClick={onClose}
            sx={{ color: 'textMuted' }}
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          p: 0,
          backgroundColor: alpha('#F5F0E1', 0.04),
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            opacity: 0.03,
            pointerEvents: 'none',
          },
        }}
      >
        <Box
          sx={{
            p: 3,
            minHeight: 300,
            maxHeight: '60vh',
            overflowY: 'auto',
          }}
        >
          <Typography
            component="pre"
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.85rem',
              lineHeight: 1.8,
              color: 'textPrimary',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              m: 0,
              '&::after': {
                content: '""',
                display: 'inline-block',
                width: '2px',
                height: '1.2em',
                backgroundColor: isAnimating ? 'bauhausGold' : 'transparent',
                marginLeft: '2px',
                verticalAlign: 'text-bottom',
                animation: isAnimating ? 'blink 0.7s step-end infinite' : 'none',
                '@keyframes blink': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0 },
                },
              },
            }}
          >
            {displayedText}
          </Typography>
        </Box>
      </DialogContent>

      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'borderLight',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1,
        }}
      >
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            borderColor: 'borderMedium',
            color: 'textPrimary',
          }}
        >
          Schließen
        </Button>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<Download />}
          onClick={handleDownload}
        >
          Herunterladen
        </Button>
      </Box>
    </Dialog>
  );
}
