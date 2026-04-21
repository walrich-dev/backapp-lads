import { ForumTag, PostIcon, PrismaClient, RequestStatus, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Clean (for dev resets) ──────────────────────────────
  await prisma.postLike.deleteMany();
  await prisma.forumComment.deleteMany();
  await prisma.forumPost.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.service.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.professionalExpertise.deleteMany();
  await prisma.professionalAchievement.deleteMany();
  await prisma.professional.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  // ─── Users ───────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('senha123', 12);

  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin LADS',
      email: 'admin@lads.com',
      passwordHash,
      role: UserRole.ADMIN,
      avatarUrl: 'https://i.pravatar.cc/200?img=1',
    },
  });

  const coordUser = await prisma.user.create({
    data: {
      name: 'Carlos Oliveira',
      email: 'carlos@lads.com',
      passwordHash,
      role: UserRole.COORDINATOR,
      avatarUrl: 'https://i.pravatar.cc/200?img=12',
      bio: 'Full Stack Developer e Coordenador de Projetos no LADS',
    },
  });

  const fernandaUser = await prisma.user.create({
    data: {
      name: 'Fernanda Rodrigues',
      email: 'fernanda@lads.com',
      passwordHash,
      role: UserRole.PROFESSIONAL,
      avatarUrl: 'https://i.pravatar.cc/200?img=45',
      bio: 'AI/ML Specialist apaixonada por dados',
    },
  });

  const lucasUser = await prisma.user.create({
    data: {
      name: 'Lucas Pereira',
      email: 'lucas@lads.com',
      passwordHash,
      role: UserRole.PROFESSIONAL,
      avatarUrl: 'https://i.pravatar.cc/200?img=33',
      bio: 'Mobile Developer especialista em React Native',
    },
  });

  const memberUser = await prisma.user.create({
    data: {
      name: 'Maria Santos',
      email: 'maria@lads.com',
      passwordHash,
      role: UserRole.MEMBER,
      avatarUrl: 'https://i.pravatar.cc/200?img=47',
    },
  });

  const carlosDevUser = await prisma.user.create({
    data: {
      name: 'Carlos Dev',
      email: 'carlosdev@lads.com',
      passwordHash,
      role: UserRole.MEMBER,
      avatarUrl: 'https://i.pravatar.cc/200?img=52',
    },
  });

  console.log('✅ Users created');

  // ─── Professionals ───────────────────────────────────────
  await prisma.professional.create({
    data: {
      userId: coordUser.id,
      headline: 'Full Stack Developer',
      affiliation: 'Líder de Projetos - LADS',
      memberSince: 'Jan/2023',
      rating: 5,
      votes: 47,
      website: 'https://carlosoliveira.dev',
      linkedin: 'https://linkedin.com/in/carlosoliveira',
      github: 'https://github.com/carlosoliveira',
      expertise: {
        create: [
          { name: 'Backend' }, { name: 'Frontend' }, { name: 'DevOps' },
          { name: 'Python' }, { name: 'JavaScript' }, { name: 'Docker' },
          { name: 'AWS' }, { name: 'PostgreSQL' }, { name: 'Django' }, { name: 'React' },
        ],
      },
      achievements: {
        create: [
          { title: 'AWS Solutions Architect' },
          { title: 'Vencedor Hackathon 2023' },
          { title: '10+ Projetos Entregues' },
          { title: 'Mentor de 15 devs' },
        ],
      },
    },
  });

  await prisma.professional.create({
    data: {
      userId: fernandaUser.id,
      headline: 'AI/ML Specialist',
      affiliation: 'LADS Member',
      memberSince: 'Mar/2023',
      rating: 5,
      votes: 32,
      linkedin: 'https://linkedin.com/in/fernandar',
      github: 'https://github.com/fernandar',
      expertise: {
        create: [
          { name: 'Python' }, { name: 'Machine Learning' }, { name: 'Deep Learning' },
          { name: 'TensorFlow' }, { name: 'PyTorch' }, { name: 'Data Science' },
        ],
      },
      achievements: {
        create: [
          { title: 'Google ML Engineer' },
          { title: 'Kaggle Expert' },
          { title: '5 Papers Publicados' },
        ],
      },
    },
  });

  await prisma.professional.create({
    data: {
      userId: lucasUser.id,
      headline: 'Mobile Developer',
      affiliation: 'LADS Member',
      memberSince: 'Jun/2023',
      rating: 4,
      votes: 28,
      github: 'https://github.com/lucaspereira',
      expertise: {
        create: [
          { name: 'React Native' }, { name: 'Flutter' }, { name: 'TypeScript' },
          { name: 'iOS' }, { name: 'Android' },
        ],
      },
      achievements: {
        create: [
          { title: '3 Apps na App Store' },
          { title: 'React Native Expert' },
        ],
      },
    },
  });

  console.log('✅ Professionals created');

  // ─── Events ──────────────────────────────────────────────
  const event1 = await prisma.event.create({
    data: {
      name: 'Noite Sem Pijama',
      description: 'Hackathon noturno de 12 horas para desenvolver projetos inovadores',
      emoji: '🌙',
      dateLabel: '15/03/2026',
      date: new Date('2026-03-15T20:00:00'),
      location: 'LADS - Laboratório de Desenvolvimento de Software',
      subscribers: 234,
    },
  });

  const event2 = await prisma.event.create({
    data: {
      name: 'LADS Tech Talk',
      description: 'Palestras sobre as últimas tendências em tecnologia',
      emoji: '🎤',
      dateLabel: '22/04/2026',
      date: new Date('2026-04-22T18:00:00'),
      location: 'Auditório Principal',
      subscribers: 98,
    },
  });

  const event3 = await prisma.event.create({
    data: {
      name: 'Workshop React Native',
      description: 'Workshop prático de desenvolvimento mobile com React Native e Expo',
      emoji: '📱',
      dateLabel: '10/05/2026',
      date: new Date('2026-05-10T09:00:00'),
      location: 'LADS - Sala 3',
      subscribers: 45,
    },
  });

  console.log('✅ Events created');

  // ─── Forum Posts ─────────────────────────────────────────
  const pinnedPost = await prisma.forumPost.create({
    data: {
      title: 'Dicas para Madrugada',
      content: 'Compilado de dicas essenciais para sobreviver e produzir na madrugada do hackathon.',
      icon: PostIcon.BULB,
      tag: ForumTag.GERAL,
      likes: 34,
      authorId: coordUser.id,
      eventId: event1.id,
      pinned: true,
    },
  });

  const post1 = await prisma.forumPost.create({
    data: {
      title: 'Qual linguagem usar na madrugada?',
      content: 'Pessoal, estou em dúvida entre Python e TypeScript para o projeto. Qual vocês recomendam?',
      icon: PostIcon.BULB,
      tag: ForumTag.TECNICO,
      likes: 18,
      authorId: memberUser.id,
      eventId: event1.id,
    },
  });

  const post2 = await prisma.forumPost.create({
    data: {
      title: 'Alguém para formar equipe?',
      content: 'Procuro 2-3 pessoas para trabalhar no projeto de automação. DM me!',
      icon: PostIcon.HANDSHAKE,
      tag: ForumTag.NETWORKING,
      likes: 42,
      authorId: carlosDevUser.id,
      eventId: event1.id,
    },
  });

  await prisma.forumPost.create({
    data: {
      title: 'Horário de check-in confirmado?',
      content: 'Alguém sabe o horário exato do check-in? O site diz 19h mas o email diz 20h.',
      icon: PostIcon.QUESTION,
      tag: ForumTag.DUVIDAS,
      likes: 7,
      authorId: memberUser.id,
      eventId: event1.id,
    },
  });

  // Comments
  await prisma.forumComment.createMany({
    data: [
      { content: 'Python é sempre uma boa escolha para prototipagem rápida!', postId: post1.id, authorId: fernandaUser.id },
      { content: 'TypeScript com bom tipagem salva muito tempo na depuração.', postId: post1.id, authorId: lucasUser.id },
      { content: 'Tenho interesse! Sou full stack, manda DM.', postId: post2.id, authorId: lucasUser.id },
    ],
  });

  console.log('✅ Forum posts created');

  // ─── Service Categories ───────────────────────────────────
  await prisma.serviceCategory.createMany({
    data: [
      { id: 'web', title: 'Desenvolvimento Web', icon: 'laptop', surfaceColor: '#EFF6FF', borderColor: '#BEDBFF', iconColor: '#1447E6' },
      { id: 'mobile', title: 'Mobile', icon: 'mobile-phone', surfaceColor: '#F0FDF4', borderColor: '#B9F8CF', iconColor: '#16A34A', emoji: '📱', emojiColor: '#008236' },
      { id: 'ia', title: 'IA/ML', icon: 'cogs', surfaceColor: '#FAF5FF', borderColor: '#E9D4FF', iconColor: '#7C3AED', emoji: '🤖', emojiColor: '#8200DB' },
      { id: 'uiux', title: 'UI/UX', icon: 'paint-brush', surfaceColor: '#FDF2F8', borderColor: '#FCCEE8', iconColor: '#DB2777' },
      { id: 'devops', title: 'DevOps', icon: 'cloud', surfaceColor: '#ECFEFF', borderColor: '#A5F3FC', iconColor: '#0891B2' },
      { id: 'consultoria', title: 'Consultoria', icon: 'bar-chart', surfaceColor: '#FFFBEB', borderColor: '#FDE68A', iconColor: '#D97706' },
    ],
  });

  // ─── Services ────────────────────────────────────────────
  const carlosProfessional = await prisma.professional.findUnique({ where: { userId: coordUser.id } });
  const fernandaProfessional = await prisma.professional.findUnique({ where: { userId: fernandaUser.id } });
  const lucasProfessional = await prisma.professional.findUnique({ where: { userId: lucasUser.id } });

  await prisma.service.createMany({
    data: [
      { title: 'Desenvolvimento de API REST', description: 'API REST com Node.js, Express e PostgreSQL', categoryId: 'web', professionalId: carlosProfessional!.id, price: 2500 },
      { title: 'E-commerce com Next.js', description: 'Loja virtual completa com Next.js e Stripe', categoryId: 'web', professionalId: carlosProfessional!.id, price: 5000 },
      { title: 'App Mobile React Native', description: 'Aplicativo mobile multiplataforma iOS e Android', categoryId: 'mobile', professionalId: lucasProfessional!.id, price: 4500 },
      { title: 'Dashboard React Native', description: 'Dashboard analítico para dispositivos móveis', categoryId: 'mobile', professionalId: lucasProfessional!.id, price: 3000 },
      { title: 'Modelo de Classificação NLP', description: 'Modelo de machine learning para análise de texto', categoryId: 'ia', professionalId: fernandaProfessional!.id, price: 3500 },
      { title: 'Chatbot com IA', description: 'Chatbot inteligente com integração à API da OpenAI', categoryId: 'ia', professionalId: fernandaProfessional!.id, price: 2800 },
      { title: 'Pipeline CI/CD', description: 'Automação de deploy com GitHub Actions e Docker', categoryId: 'devops', professionalId: carlosProfessional!.id, price: 1800 },
      { title: 'Design System', description: 'Biblioteca de componentes UI com Figma e Storybook', categoryId: 'uiux', price: 2200 },
      { title: 'Consultoria de Arquitetura', description: 'Revisão e proposta de arquitetura de software', categoryId: 'consultoria', professionalId: carlosProfessional!.id, price: 1200 },
    ],
  });

  // Service requests
  const services = await prisma.service.findMany({ take: 3 });
  await prisma.serviceRequest.createMany({
    data: [
      { serviceId: services[0].id, userId: memberUser.id, status: RequestStatus.PROGRESSO, meta: '2 semanas de desenvolvimento' },
      { serviceId: services[1].id, userId: memberUser.id, status: RequestStatus.ORCAMENTO, meta: 'Solicitação de orçamento inicial' },
      { serviceId: services[2].id, userId: memberUser.id, status: RequestStatus.CONCLUIDO, meta: 'Projeto entregue com sucesso' },
    ],
  });

  console.log('✅ Services & requests created');
  console.log('\n🎉 Seed complete!');
  console.log('\n📋 Test accounts (all passwords: senha123):');
  console.log('  admin@lads.com     - ADMIN');
  console.log('  carlos@lads.com    - COORDINATOR');
  console.log('  fernanda@lads.com  - PROFESSIONAL');
  console.log('  lucas@lads.com     - PROFESSIONAL');
  console.log('  maria@lads.com     - MEMBER');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
