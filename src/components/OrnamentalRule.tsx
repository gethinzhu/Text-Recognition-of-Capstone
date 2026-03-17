import { Box } from '@mui/material';

interface OrnamentalRuleProps {
  variant?: 'thick' | 'thin' | 'double';
}

export default function OrnamentalRule({ variant = 'thick' }: OrnamentalRuleProps) {
  if (variant === 'thin') {
    return (
      <Box
        sx={{
          position: 'relative',
          height: 2,
          my: 2,
          width: '100%',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: 'rgba(184, 134, 61, 0.25)',
          },
        }}
      />
    );
  }

  if (variant === 'double') {
    return (
      <Box
        sx={{
          position: 'relative',
          height: 12,
          my: 2.5,
          width: '100%',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 2,
            left: 0,
            right: 0,
            height: 4,
            background: 'rgba(184, 134, 61, 0.4)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 2,
            left: 0,
            right: 0,
            height: 2,
            background: 'rgba(184, 134, 61, 0.2)',
          },
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        height: 8,
        my: 3,
        width: '100%',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'rgba(184, 134, 61, 0.5)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 1,
          background: 'rgba(184, 134, 61, 0.3)',
        },
      }}
    />
  );
}
