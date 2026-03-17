import { Grid } from '@mui/material';
import InfoCard from './InfoCard';
import { useLanguage } from '../contexts/LanguageContext';

type CardType = 'handbook' | 'whyThisApp' | 'mission' | 'howToUse';

export default function InfoSection() {
  const { t } = useLanguage();

  const cards: { cardType: CardType; titleKey: string; contentKey: string; isSteps?: boolean }[] = [
    {
      cardType: 'handbook',
      titleKey: 'handbook',
      contentKey: 'handbookContent',
    },
    {
      cardType: 'whyThisApp',
      titleKey: 'whyThisApp',
      contentKey: 'whyThisAppContent',
    },
    {
      cardType: 'mission',
      titleKey: 'mission',
      contentKey: 'missionContent',
    },
    {
      cardType: 'howToUse',
      titleKey: 'howToUse',
      contentKey: 'howToUseStep1',
      isSteps: true,
    },
  ];

  return (
    <Grid container spacing={3}>
      {cards.map((card) => (
        <Grid item xs={12} sm={6} key={card.cardType}>
          <InfoCard
            cardType={card.cardType}
            title={t(card.titleKey as any)}
            content={
              card.isSteps
                ? `${t('howToUseStep1')}\n\n${t('howToUseStep2')}\n\n${t('howToUseStep3')}\n\n${t('howToUseStep4')}`
                : t(card.contentKey as any)
            }
            isSteps={card.isSteps}
          />
        </Grid>
      ))}
    </Grid>
  );
}
