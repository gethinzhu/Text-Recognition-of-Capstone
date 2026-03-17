import { Box, Typography, alpha, keyframes } from '@mui/material';

interface StampAnimationProps {
  show: boolean;
  onComplete?: () => void;
}

const stampIn = keyframes`
  0% {
    transform: scale(3) rotate(-45deg);
    opacity: 0;
  }
  50% {
    transform: scale(0.9) rotate(-10deg);
    opacity: 0.8;
  }
  70% {
    transform: scale(1.1) rotate(5deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
`;

export default function StampAnimation({ show, onComplete }: StampAnimationProps) {
  if (!show) return null;

  return (
    <Box
      onAnimationEnd={onComplete}
      sx={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <Box
        sx={{
          width: 150,
          height: 150,
          borderRadius: '50%',
          border: '4px solid',
          borderColor: 'bauhausRed',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: alpha('#C62828', 0.1),
          animation: `${stampIn} 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
        }}
      >
        <Typography
          sx={{
            fontFamily: '"UnifrakturMaguntia", serif',
            fontSize: '1.2rem',
            color: 'bauhausRed',
            lineHeight: 1.2,
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Fertig
        </Typography>

        <Box
          sx={{
            width: 80,
            height: 2,
            backgroundColor: 'bauhausRed',
            my: 1,
          }}
        />

        <Typography
          sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '0.6rem',
            color: 'bauhausRed',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
          }}
        >
          OCR
        </Typography>
      </Box>

      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 180,
          height: 180,
          borderRadius: '50%',
          border: '1px dashed',
          borderColor: alpha('#C62828', 0.3),
          animation: `${pulse} 2s ease-in-out infinite`,
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
}
