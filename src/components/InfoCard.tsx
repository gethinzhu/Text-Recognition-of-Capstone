import { Box, Typography, alpha, Divider } from '@mui/material';
import { AutoStories, Pageview, Create, Settings } from '@mui/icons-material';

type CardType = 'handbook' | 'whyThisApp' | 'mission' | 'howToUse';

interface InfoCardProps {
  cardType: CardType;
  title: string;
  content: string;
  isSteps?: boolean;
}

const cardConfig: Record<CardType, { letter: string; Icon: typeof AutoStories }> = {
  handbook: { letter: 'H', Icon: AutoStories },
  whyThisApp: { letter: 'W', Icon: Pageview },
  mission: { letter: 'M', Icon: Create },
  howToUse: { letter: 'A', Icon: Settings },
};

export default function InfoCard({ cardType, title, content, isSteps }: InfoCardProps) {
  const steps = isSteps ? content.split('\n\n') : [];
  const config = cardConfig[cardType];
  const DecorativeIcon = config.Icon;

  return (
    <Box
      sx={{
        backgroundColor: alpha('#1A1A14', 0.8),
        border: '1px solid',
        borderColor: alpha('#B8860B', 0.2),
        borderRadius: '2px',
        p: 0,
        position: 'relative',
        height: '100%',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -1,
          left: -1,
          width: 20,
          height: 20,
          borderColor: alpha('#B8860B', 0.4),
          borderStyle: 'solid',
          borderWidth: '2px 0 0 2px',
          zIndex: 2,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: -1,
          right: -1,
          width: 20,
          height: 20,
          borderColor: alpha('#B8860B', 0.4),
          borderStyle: 'solid',
          borderWidth: '0 2px 2px 0',
          zIndex: 2,
        },
      }}
    >
      {/* Layer 1: German flag tricolor stripe */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'linear-gradient(to right, #1A1A14 33%, #C62828 33% 66%, #B8860B 66%)',
          zIndex: 3,
        }}
      />

      {/* Layer 2: Fraktur watermark letter */}
      <Typography
        sx={{
          fontFamily: '"UnifrakturMaguntia", serif',
          fontSize: 180,
          color: alpha('#B8860B', 0.06),
          position: 'absolute',
          bottom: -20,
          right: 10,
          pointerEvents: 'none',
          userSelect: 'none',
          lineHeight: 1,
          zIndex: 0,
        }}
      >
        {config.letter}
      </Typography>

      {/* Card content with z-index 1 */}
      <Box sx={{ position: 'relative', zIndex: 1, p: 4, pt: 5 }}>
        {/* Layer 3: Decorative icon */}
        <DecorativeIcon
          sx={{
            position: 'absolute',
            top: 24,
            right: 24,
            fontSize: 48,
            color: alpha('#B8860B', 0.12),
            zIndex: 1,
          }}
        />

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            mb: 2,
          }}
        >
          <Box
            sx={{
              color: '#B8860B',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <DecorativeIcon sx={{ fontSize: 28 }} />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontFamily: '"UnifrakturMaguntia", serif',
              color: 'textHeading',
              fontSize: '1.25rem',
            }}
          >
            {title}
          </Typography>
        </Box>

        {isSteps ? (
          <Box>
            {steps.map((step, index) => (
              <Box key={index}>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'textPrimary',
                    lineHeight: 1.7,
                    fontFamily: '"DM Sans", sans-serif',
                    mb: index < steps.length - 1 ? 1.5 : 0,
                  }}
                >
                  {step}
                </Typography>
                {index < steps.length - 1 && (
                  <Divider
                    sx={{
                      borderColor: alpha('#B8860B', 0.15),
                      borderBottomWidth: 1,
                      my: 1.5,
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>
        ) : (
          <Typography
            variant="body2"
            sx={{
              color: 'textPrimary',
              lineHeight: 1.7,
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            {content}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
