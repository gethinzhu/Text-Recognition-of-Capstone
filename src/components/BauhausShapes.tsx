import { Box, useTheme, useMediaQuery } from '@mui/material';
import { useMemo } from 'react';

interface BauhausShapesProps {
  backgroundOnly?: boolean;
}

export default function BauhausShapes({ backgroundOnly = true }: BauhausShapesProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const shapes = useMemo(() => {
    if (isMobile) {
      return [
        { type: 'circle', size: 80, top: '10%', left: '5%', color: '#B8860B' },
        { type: 'triangle', size: 50, top: '60%', left: '80%', color: '#C62828' },
        { type: 'square', size: 40, top: '85%', left: '15%', color: '#1A3A5C' },
      ];
    }

    return [
      { type: 'circle', size: 120, top: '5%', left: '3%', color: '#B8860B' },
      { type: 'circle', size: 60, top: '70%', left: '90%', color: '#1A3A5C' },
      { type: 'triangle', size: 80, top: '15%', left: '85%', color: '#C62828' },
      { type: 'triangle', size: 45, top: '80%', left: '5%', color: '#B8860B' },
      { type: 'square', size: 70, top: '40%', left: '92%', color: '#1A3A5C' },
      { type: 'square', size: 50, top: '75%', left: '50%', color: '#C62828' },
    ];
  }, [isMobile]);

  if (backgroundOnly) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        {shapes.map((shape, index) => (
          <Box
            key={index}
            sx={{
              position: 'absolute',
              top: shape.top,
              left: shape.left,
              width: shape.size,
              height: shape.size,
              opacity: 0.03,
              ...(shape.type === 'circle' && {
                borderRadius: '50%',
                border: `2px solid ${shape.color}`,
              }),
              ...(shape.type === 'triangle' && {
                width: 0,
                height: 0,
                borderLeft: `${shape.size / 2}px solid transparent`,
                borderRight: `${shape.size / 2}px solid transparent`,
                borderBottom: `${shape.size}px solid ${shape.color}`,
                backgroundColor: 'transparent',
              }),
              ...(shape.type === 'square' && {
                backgroundColor: shape.color,
              }),
            }}
          />
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {['circle', 'square', 'triangle'].map((type) => (
        <Box
          key={type}
          sx={{
            width: 12,
            height: 12,
            opacity: 0.5,
            ...(type === 'circle' && {
              borderRadius: '50%',
              border: '1px solid',
              borderColor: 'bauhausGold',
            }),
            ...(type === 'square' && {
              backgroundColor: 'bauhausBlue',
            }),
            ...(type === 'triangle' && {
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderBottom: '10px solid',
              borderBottomColor: 'bauhausRed',
              backgroundColor: 'transparent',
            }),
          }}
        />
      ))}
    </Box>
  );
}
