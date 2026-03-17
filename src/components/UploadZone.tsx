import { useCallback, useState, useRef } from 'react';
import { Box, Typography, alpha } from '@mui/material';
import { CloudUpload, InsertDriveFile } from '@mui/icons-material';
import { validateFile } from '../utils';
import type { FileItem } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface UploadZoneProps {
  onFilesAdded: (files: FileItem[]) => void;
  disabled?: boolean;
  onError?: (message: string) => void;
}

export default function UploadZone({ onFilesAdded, disabled, onError }: UploadZoneProps) {
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      const validFiles: FileItem[] = [];
      const invalidFiles: string[] = [];

      for (const file of files) {
        const validation = validateFile(file);

        if (!validation.valid) {
          invalidFiles.push(`${file.name}: ${validation.error}`);
          continue;
        }

        const uploadedFile: FileItem = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'queued',
          progress: 0,
        };

        validFiles.push(uploadedFile);
      }

      if (invalidFiles.length > 0 && onError) {
        onError(invalidFiles.join('\n'));
      }

      if (validFiles.length > 0) {
        onFilesAdded(validFiles);
      }
    },
    [onFilesAdded, onError]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (!disabled && e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFiles(files);
      }
    },
    [handleFiles, disabled]
  );

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFiles(files);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFiles]
  );

  return (
    <Box>
      <Typography
        variant="h5"
        sx={{
          mb: 2,
          fontFamily: '"UnifrakturMaguntia", serif',
          color: 'textHeading',
        }}
      >
        {t('uploadTitle')}
      </Typography>

      <Box
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        sx={{
          position: 'relative',
          border: '2px solid',
          borderColor: isDragging ? 'bauhausGold' : 'borderLight',
          borderRadius: '2px',
          p: 4,
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.3s ease',
          backgroundColor: isDragging
            ? alpha('#B8860B', 0.08)
            : alpha('#F5F0E1', 0.03),
          boxShadow: isDragging
            ? `0 0 20px ${alpha('#B8860B', 0.4)}, inset 0 0 30px ${alpha('#B8860B', 0.1)}`
            : 'none',
          '&:hover': {
            borderColor: disabled ? 'borderLight' : 'borderMedium',
            backgroundColor: disabled ? undefined : alpha('#B8860B', 0.05),
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -2,
            left: -2,
            width: 20,
            height: 20,
            borderColor: isDragging ? '#FFD700' : alpha('#B8860B', 0.5),
            borderStyle: 'solid',
            borderWidth: '3px 0 0 3px',
            boxShadow: isDragging ? `0 0 8px ${alpha('#FFD700', 0.6)}` : 'none',
            transition: 'all 0.3s ease',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 20,
            height: 20,
            borderColor: isDragging ? '#FFD700' : alpha('#B8860B', 0.5),
            borderStyle: 'solid',
            borderWidth: '0 3px 3px 0',
            boxShadow: isDragging ? `0 0 8px ${alpha('#FFD700', 0.6)}` : 'none',
            transition: 'all 0.3s ease',
          },
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".tiff,.tif,.png,.jpg,.jpeg,image/tiff,image/tif,image/png,image/jpeg"
          multiple
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          disabled={disabled}
        />

        {isDragging ? (
          <CloudUpload
            sx={{
              fontSize: 64,
              color: 'bauhausGold',
              mb: 2,
            }}
          />
        ) : (
          <InsertDriveFile
            sx={{
              fontSize: 64,
              color: 'textMuted',
              mb: 2,
            }}
          />
        )}

        <Typography
          variant="body1"
          sx={{
            color: isDragging ? 'bauhausGold' : 'textPrimary',
            mb: 1,
            fontWeight: 500,
          }}
        >
          {isDragging ? t('dragAndDropActive') : t('dropZoneText')}
        </Typography>

        <Typography variant="caption" sx={{ color: 'textMuted' }}>
          {t('supportedFormats')}
        </Typography>
      </Box>
    </Box>
  );
}
