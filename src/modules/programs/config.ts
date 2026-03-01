export type ProgramTask = {
  id: string;
  title: string;
  description: string;
  points: number;
};

export type Program = {
  slug: string;
  typeKey: string;
  cardTitleKey: string;
  cardDescriptionKey: string;
  durationKey: string;
  participantsKey: string;
  featureKeys: string[];
  tasks: ProgramTask[];
};

export const programs: Program[] = [
  {
    slug: "weight-loss",
    typeKey: "home.programs.weight_loss.title",
    cardTitleKey: "programs.cards.weight_loss.title",
    cardDescriptionKey: "programs.cards.weight_loss.description",
    durationKey: "programs.cards.weight_loss.duration",
    participantsKey: "programs.cards.weight_loss.participants",
    featureKeys: [
      "programs.cards.weight_loss.feature1",
      "programs.cards.weight_loss.feature2",
      "programs.cards.weight_loss.feature3",
      "programs.cards.weight_loss.feature4",
    ],
    tasks: [
      {
        id: "weight-loss-plan",
        title: "Həftəlik qida planına başla",
        description: "Mütəxəssisin tövsiyə etdiyi ilk həftəlik qida planına uyğunlaş.",
        points: 100,
      },
      {
        id: "weight-loss-water",
        title: "Gündəlik su hədəfi",
        description: "7 gün ardıcıl olaraq gündəlik su hədəfini yerinə yetir.",
        points: 120,
      },
      {
        id: "weight-loss-activity",
        title: "Fəallıq əlavə et",
        description: "Həftədə ən azı 3 dəfə yüngül fiziki aktivlik et.",
        points: 150,
      },
      {
        id: "weight-loss-checkin",
        title: "Çəki izləməsi",
        description: "Həftəlik çəkini qeyd et və nəticəni qiymətləndir.",
        points: 130,
      },
    ],
  },
  {
    slug: "muscle-gain",
    typeKey: "home.programs.muscle_gain.title",
    cardTitleKey: "programs.cards.muscle_gain.title",
    cardDescriptionKey: "programs.cards.muscle_gain.description",
    durationKey: "programs.cards.muscle_gain.duration",
    participantsKey: "programs.cards.muscle_gain.participants",
    featureKeys: [
      "programs.cards.muscle_gain.feature1",
      "programs.cards.muscle_gain.feature2",
      "programs.cards.muscle_gain.feature3",
      "programs.cards.muscle_gain.feature4",
    ],
    tasks: [
      {
        id: "muscle-gain-protein",
        title: "Zülal planı",
        description: "Gündəlik zülal qəbulunu hədəfə uyğunlaşdır.",
        points: 120,
      },
      {
        id: "muscle-gain-training",
        title: "Məşq cədvəli",
        description: "Həftədə ən azı 3 dəfə qüvvə məşqləri et.",
        points: 150,
      },
      {
        id: "muscle-gain-calories",
        title: "Kalori artımı",
        description: "2 həftə ərzində kalori qəbulunu mərhələli şəkildə artır.",
        points: 130,
      },
      {
        id: "muscle-gain-rest",
        title: "Bərpa və yuxu",
        description: "7 gün ardıcıl 7-8 saat yuxunu qoruyaraq bərpəni gücləndir.",
        points: 100,
      },
    ],
  },
  {
    slug: "healthy-life",
    typeKey: "home.programs.healthy_life.title",
    cardTitleKey: "programs.cards.healthy_life.title",
    cardDescriptionKey: "programs.cards.healthy_life.description",
    durationKey: "programs.cards.healthy_life.duration",
    participantsKey: "programs.cards.healthy_life.participants",
    featureKeys: [
      "programs.cards.healthy_life.feature1",
      "programs.cards.healthy_life.feature2",
      "programs.cards.healthy_life.feature3",
      "programs.cards.healthy_life.feature4",
    ],
    tasks: [
      {
        id: "healthy-life-routine",
        title: "Səhər rutini",
        description: "7 gün ardıcıl sağlam səhər rutini formalaşdır.",
        points: 100,
      },
      {
        id: "healthy-life-sleep",
        title: "Yuxu rejimi",
        description: "Gecə yuxusunu eyni saatlarda təmin et.",
        points: 120,
      },
      {
        id: "healthy-life-mind",
        title: "Rahatlama praktikaları",
        description: "Həftə ərzində ən azı 3 dəfə rahatlama praktikası et.",
        points: 130,
      },
      {
        id: "healthy-life-habits",
        title: "Sağlam vərdişlər",
        description: "Şirniyyat və zərərli qidaların qəbulunu məhdudlaşdır.",
        points: 110,
      },
    ],
  },
];

export function getProgramBySlug(slug: string): Program | undefined {
  return programs.find((p) => p.slug === slug);
}

