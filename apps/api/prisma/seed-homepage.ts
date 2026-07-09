import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import {
  createEmptyPage,
  createNode,
  insertNode,
  setContainerColumnCount,
} from "@pgcms/shared";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Builds a full homepage modeled on the section structure of a membership-driven
// nonprofit federation site (utility bar -> header -> mega-menu nav -> animated 3D
// hero -> quick actions -> about -> benefits -> impact stats -> testimonials -> news ->
// FAQ -> contact form -> join CTA -> rich footer). Most sections carry a scroll/load
// entrance animation, the hero uses the Three.js particle background, and "What We Do /
// Who We Are" uses the Tabs component. All copy below is original placeholder text for
// a fictional organization ("Global Impact Alliance") — not any real organization's
// actual wording, logo, or trademarks.

const PLACEHOLDER = (label: string, size = "800x500") =>
  `https://placehold.co/${size}/1e293b/ffffff?text=${encodeURIComponent(label)}`;
const PLACEHOLDER_BG = (size: string) =>
  `https://placehold.co/${size}/0b1220/0b1220?text=+`;
const SAMPLE_VIDEO =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const IMG_HERO_1 =
  "https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?auto=format&fit=crop&w=2200&q=80";
const IMG_HERO_2 =
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=2200&q=80";
const IMG_HERO_3 =
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=2200&q=80";
const IMG_CARD_1 =
  "https://images.unsplash.com/photo-1559027615-028a7a5e9a0b?auto=format&fit=crop&w=1600&q=80";
const IMG_CARD_2 =
  "https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=1600&q=80";
const IMG_CARD_3 =
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=80";

export async function seedAdvancedHomepage(prisma: PrismaClient) {
  // --- Navigation: rebuild with mega-menu dropdowns ---
  const navCount = await prisma.navItem.count();
  if (navCount === 0) {
    const topLevel = [
      { label: "Home", href: "/", order: 0 },
      { label: "Who We Are", href: "#who-we-are", order: 10 },
      { label: "What We Do", href: "#what-we-do", order: 20 },
      { label: "Get Involved", href: "#get-involved", order: 30 },
      { label: "Events", href: "#events", order: 40 },
      { label: "News", href: "#news", order: 50 },
      { label: "Contact Us", href: "#contact", order: 60 },
      { label: "Members", href: "#members", order: 70 },
    ];
    const created: Record<string, string> = {};
    for (const item of topLevel) {
      const row = await prisma.navItem.create({ data: item });
      created[item.label] = row.id;
    }
    const subItems = [
      {
        label: "Our History",
        href: "#our-history",
        parent: "Who We Are",
        order: 0,
      },
      {
        label: "Our Foundation",
        href: "#our-foundation",
        parent: "Who We Are",
        order: 10,
      },
      {
        label: "Our Charities",
        href: "/our-charities",
        parent: "What We Do",
        order: 0,
      },
      {
        label: "Our Impact",
        href: "#our-impact",
        parent: "What We Do",
        order: 10,
      },
      {
        label: "Become a Member",
        href: "#become-a-member",
        parent: "Get Involved",
        order: 0,
      },
      {
        label: "Volunteer",
        href: "#volunteer",
        parent: "Get Involved",
        order: 10,
      },
      { label: "Donate", href: "#donate", parent: "Get Involved", order: 20 },
      { label: "Upcoming Events", href: "#events", parent: "Events", order: 0 },
      { label: "Latest News", href: "#news", parent: "News", order: 0 },
      { label: "Press", href: "#press", parent: "News", order: 10 },
    ];
    for (const item of subItems) {
      await prisma.navItem.create({
        data: {
          label: item.label,
          href: item.href,
          order: item.order,
          parentId: created[item.parent],
        },
      });
    }
  }

  let globalHeader = createEmptyPage();

  // 1. Top utility bar
  const utilityLeft = createNode("richText");
  utilityLeft.props.html =
    "<p><strong>Join Us</strong> — Together, we make that difference.</p>";
  const utilityRight = createNode("buttonGroup");
  utilityRight.props.buttons = [
    { text: "Members", href: "#members", variant: "text" },
    { text: "Club Finder", href: "#club-finder", variant: "text" },
    { text: "Join Us", href: "#join", variant: "text" },
    { text: "Donate", href: "#donate", variant: "primary" },
  ];
  let utilityBar = createNode("container");
  utilityBar = setContainerColumnCount(utilityBar, 2);
  utilityBar.style = {
    backgroundColor: "#0f172a",
    textColor: "#ffffff",
    paddingY: "10px",
    paddingX: "24px",
  };
  utilityBar.children[0].children.push(utilityLeft);
  utilityBar.children[1].children.push(utilityRight);
  utilityBar.children[1].style = { textAlign: "right" };
  globalHeader = insertNode(globalHeader, globalHeader.id, utilityBar);

  // 2. Header (logo, nav links, members + join buttons)
  const header = createNode("header");
  header.props.sticky = true;
  header.style = {
    backgroundColor: "#ffffff",
    textColor: "#111827",
    paddingY: "0px",
    paddingX: "0px",
  };
  const startZone = header.children[0];
  const middleZone = header.children[1];
  const endZone = header.children[2];
  const logo = createNode("logo");
  const navLinks = createNode("navLinks");
  startZone.children.push(logo);
  middleZone.children.push(navLinks);
  const headerButtons = createNode("buttonGroup");
  headerButtons.props.buttons = [
    { text: "Members", href: "#members", variant: "text" },
    { text: "Join Us", href: "#join", variant: "primary" },
  ];
  const lang = createNode("languageSwitcher");
  lang.props.compact = true;
  let headerEndCluster = createNode("container");
  headerEndCluster = setContainerColumnCount(headerEndCluster, 2);
  headerEndCluster.style = { paddingY: "0px", paddingX: "0px" };
  headerEndCluster.children[0].children.push(lang);
  headerEndCluster.children[1].children.push(headerButtons);
  headerEndCluster.children[1].style = { textAlign: "right" };
  endZone.children.push(headerEndCluster);
  globalHeader = insertNode(globalHeader, globalHeader.id, header);

  await prisma.globalSection.upsert({
    where: { kind: "header" },
    update: { enabled: true, content: globalHeader as any },
    create: { kind: "header", enabled: true, content: globalHeader as any },
  });

  let globalFooter = createEmptyPage();
  const footer = createNode("footer");
  footer.props.description =
    "Global Impact Alliance is a worldwide federation of volunteers advancing education, equality, and " +
    "opportunity for women and girls.";
  footer.props.text =
    "© 2026 Global Impact Alliance. All rights reserved. Registered charity no. 000000.";
  footer.props.linkColumns = [
    {
      title: "Global Impact Websites",
      links: [
        { label: "Global Impact Foundation", href: "#foundation" },
        { label: "Regional Federations", href: "#regions" },
        { label: "Member Shop", href: "#shop" },
      ],
    },
  ];
  footer.props.contactInfo = {
    address: "1 Federation Way, London, UK",
    phone: "+1 (555) 010-2020",
    email: "hello@globalimpactalliance.org",
    extraLine: "Company No. 00000000 · Charity No. 000000",
  };
  footer.props.bottomLinks = [
    { label: "Members Area", href: "#members" },
    { label: "Find A Club", href: "#club-finder" },
    { label: "Join Us", href: "#join" },
    { label: "Donate", href: "#donate" },
    { label: "Privacy Policy", href: "#privacy" },
    { label: "Site Map", href: "#sitemap" },
    { label: "Contact Us", href: "#contact" },
  ];
  footer.props.socialLinks = [
    { platform: "facebook", url: "#" },
    { platform: "twitter", url: "#" },
    { platform: "instagram", url: "#" },
    { platform: "linkedin", url: "#" },
    { platform: "youtube", url: "#" },
  ];
  globalFooter = insertNode(globalFooter, globalFooter.id, footer);

  await prisma.globalSection.upsert({
    where: { kind: "footer" },
    update: { enabled: true, content: globalFooter as any },
    create: { kind: "footer", enabled: true, content: globalFooter as any },
  });

  // Go to Top - global section
  let globalGoToTop = createEmptyPage();
  const goToTop = createNode("goToTop");
  goToTop.props.enabled = true;
  goToTop.props.showAfterScroll = 300;
  goToTop.style.backgroundColor = "#3b82f6";
  goToTop.style.textColor = "#ffffff";
  goToTop.style.paddingX = "16px";
  goToTop.style.paddingY = "16px";
  goToTop.style.borderRadius = "50%";
  goToTop.style.boxShadow = "lg";
  globalGoToTop = insertNode(globalGoToTop, globalGoToTop.id, goToTop);

  await prisma.globalSection.upsert({
    where: { kind: "goToTop" },
    update: { enabled: true, content: globalGoToTop as any },
    create: { kind: "goToTop", enabled: true, content: globalGoToTop as any },
  });

  let root = createEmptyPage();

  const hero = createNode("slider");
  hero.props.autoplay = true;
  hero.props.intervalMs = 6500;
  hero.props.slides = [
    {
      image: IMG_HERO_1,
      heading: "Standing Up for Women and Girls",
      subheading:
        "Programs, advocacy, and member-led action in communities worldwide.",
      buttonText: "Find out more",
      buttonHref: "#who-we-are",
    },
    {
      image: IMG_HERO_2,
      heading: "A Global Network of Changemakers",
      subheading:
        "Connect locally, learn globally, and deliver measurable impact.",
      buttonText: "Become a member",
      buttonHref: "#become-a-member",
    },
    {
      image: IMG_HERO_3,
      heading: "Education. Opportunity. Safety.",
      subheading:
        "Support appeals that create lasting outcomes for women and girls.",
      buttonText: "Donate",
      buttonHref: "#donate",
    },
  ];
  hero.style = {
    minHeight: "620px",
    paddingY: "0px",
    paddingX: "0px",
    textColor: "#ffffff",
    animationType: "fadeIn",
    animationTrigger: "onLoad",
    animationDuration: 0.9,
  };
  root = insertNode(root, root.id, hero);

  // 4. Three quick-action cards
  const quickActions = createNode("cardGrid");
  quickActions.props.heading = "";
  quickActions.props.columns = 3;
  quickActions.props.cards = [
    {
      image: IMG_CARD_1,
      title: "Become A Member",
      excerpt: "Join a global community of changemakers.",
      buttonText: "Get Started",
      href: "#become-a-member",
    },
    {
      image: IMG_CARD_2,
      title: "Find A Local Club",
      excerpt: "Connect with members near you.",
      buttonText: "Find A Club",
      href: "#club-finder",
    },
    {
      image: IMG_CARD_3,
      title: "Donate",
      excerpt: "Support the causes we champion worldwide.",
      buttonText: "Donate Now",
      href: "#donate",
    },
  ];
  quickActions.style.customAttributes = { id: "get-involved" };
  quickActions.style.paddingY = "48px";
  quickActions.style.animationType = "slideUp";
  quickActions.style.animationTrigger = "onScroll";
  quickActions.style.animationStagger = 0.08;
  quickActions.style.hoverEffect = "lift";
  root = insertNode(root, root.id, quickActions);

  // 5. About intro
  const about = createNode("richText");
  about.props.html =
    "<h2>Who We Are</h2><p>Global Impact Alliance is a worldwide federation of volunteers working to transform the lives of women and girls through education, empowerment, and community action.</p><p>We support local clubs, coordinate international initiatives, and fund appeals that deliver real outcomes.</p>";
  about.style.customAttributes = { id: "who-we-are" };
  about.style.textAlign = "center";
  about.style.animationType = "fadeIn";
  about.style.animationTrigger = "onScroll";
  root = insertNode(root, root.id, about);
  const aboutLinks = createNode("buttonGroup");
  aboutLinks.props.buttons = [
    { text: "Join A Local Club", href: "#club-finder", variant: "outline" },
    { text: "What We Do", href: "#what-we-do", variant: "outline" },
    { text: "Who We Are", href: "#who-we-are", variant: "outline" },
  ];
  aboutLinks.style.animationType = "fadeIn";
  aboutLinks.style.animationTrigger = "onScroll";
  aboutLinks.style.animationDelay = 0.15;
  root = insertNode(root, root.id, aboutLinks);

  // 6. Find your local club
  const findClub = createNode("cta");
  findClub.props.heading = "Find Your Local Club";
  findClub.props.subheading =
    "With clubs in dozens of countries, there's likely one near you.";
  findClub.props.buttonText = "View Club Finder";
  findClub.props.buttonHref = "#club-finder";
  findClub.style.customAttributes = { id: "club-finder" };
  findClub.style = {
    backgroundColor: "#f1f5f9",
    textColor: "#111827",
    paddingY: "56px",
    animationType: "zoomIn",
    animationTrigger: "onScroll",
  };
  root = insertNode(root, root.id, findClub);

  // 7 & 8. What We Do / Who We Are — a Tabs component instead of a static 2-column
  // layout, so a visitor picks one at a time rather than scanning both at once.
  const whatWho = createNode("tabs");
  whatWho.props.tabTransition = "slide";
  whatWho.props.items = [
    {
      label: "What We Do",
      content:
        '<h3>What We Do</h3><p>We fund appeals and member-led projects spanning education, health, safety, and emergency response. Every campaign is chosen and supported with transparency and reporting.</p><p><a href="/our-charities">Explore our charities and appeals →</a></p>',
    },
    {
      label: "Who We Are",
      content:
        '<h3>Who We Are</h3><p>We are a federation of independent local clubs united by a shared mission: creating opportunity for women and girls everywhere. Our members volunteer time, skills, and resources to deliver impact.</p><p><a href="#our-history">Learn our story →</a></p>',
    },
  ];
  whatWho.style.customAttributes = { id: "what-we-do" };
  whatWho.style.paddingY = "56px";
  whatWho.style.animationType = "slideUp";
  whatWho.style.animationTrigger = "onScroll";
  root = insertNode(root, root.id, whatWho);

  const charities = createNode("cardGrid");
  charities.props.heading = "Our Charities & Appeals";
  charities.props.columns = 3;
  charities.props.cards = [
    {
      image:
        "https://images.unsplash.com/photo-1520975682071-a7a18c79a2a6?auto=format&fit=crop&w=1600&q=80",
      title: "Education Grants",
      excerpt:
        "Helping women and girls access education, skills, and training.",
      buttonText: "Learn more",
      href: "/our-charities",
    },
    {
      image:
        "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1600&q=80",
      title: "Emergency Relief",
      excerpt:
        "Rapid response for communities impacted by disaster and crisis.",
      buttonText: "Learn more",
      href: "/our-charities",
    },
    {
      image:
        "https://images.unsplash.com/photo-1520975682071-a7a18c79a2a6?auto=format&fit=crop&w=1600&q=80",
      title: "Health & Safety",
      excerpt: "Programs supporting health equity, protection, and advocacy.",
      buttonText: "Learn more",
      href: "/our-charities",
    },
  ];
  charities.style.animationType = "slideUp";
  charities.style.animationTrigger = "onScroll";
  charities.style.animationStagger = 0.06;
  root = insertNode(root, root.id, charities);

  const membershipBenefits = createNode("cardGrid");
  membershipBenefits.props.heading = "Why Join";
  membershipBenefits.props.columns = 4;
  membershipBenefits.props.cards = [
    {
      icon: "Globe2",
      title: "International Network",
      excerpt: "Belong to a truly global community.",
      buttonText: "",
      href: "#become-a-member",
    },
    {
      icon: "HeartHandshake",
      title: "Volunteer Impact",
      excerpt: "Hands-on projects that matter locally.",
      buttonText: "",
      href: "#become-a-member",
    },
    {
      icon: "GraduationCap",
      title: "Learn & Grow",
      excerpt: "Workshops, training, and leadership skills.",
      buttonText: "",
      href: "#become-a-member",
    },
    {
      icon: "Users",
      title: "Meet Friends",
      excerpt: "A lifelong network of support and purpose.",
      buttonText: "",
      href: "#become-a-member",
    },
  ];
  membershipBenefits.style.customAttributes = { id: "become-a-member" };
  membershipBenefits.style.animationType = "scrollReveal";
  membershipBenefits.style.animationTrigger = "onScroll";
  membershipBenefits.style.animationStagger = 0.05;
  root = insertNode(root, root.id, membershipBenefits);

  // 10. Impact stats
  const stats = createNode("stats");
  stats.props.columns = 4;
  stats.props.items = [
    { value: "2M+", label: "Women & Girls Helped" },
    { value: "70K+", label: "Members Worldwide" },
    { value: "25K+", label: "Federation Members" },
    { value: "1.2K", label: "Local Clubs" },
  ];
  stats.style = {
    backgroundColor: "#0f172a",
    textColor: "#ffffff",
    paddingY: "64px",
    animationType: "zoomIn",
    animationTrigger: "onScroll",
  };
  const statsHeading = createNode("richText");
  statsHeading.props.html =
    '<h2 style="text-align:center">Making A Difference Worldwide</h2>';
  statsHeading.style = {
    customAttributes: { id: "our-impact" },
    backgroundColor: "#0f172a",
    textColor: "#ffffff",
    paddingY: "0px",
    animationType: "fadeIn",
    animationTrigger: "onScroll",
  };
  root = insertNode(root, root.id, statsHeading);
  root = insertNode(root, root.id, stats);

  const eventBanner = createNode("videoBackgroundSection");
  eventBanner.props.heading = "Global Convention 2026";
  eventBanner.props.subheading =
    "Workshops, speakers, and member-led sessions across three days.";
  eventBanner.props.buttonText = "View Agenda";
  eventBanner.props.buttonHref = "#events";
  eventBanner.style = {
    customAttributes: { id: "events" },
    backgroundVideo: SAMPLE_VIDEO,
    backgroundOverlay: "rgba(11,18,32,0.65)",
    textColor: "#ffffff",
    minHeight: "520px",
    paddingY: "96px",
    animationType: "blurIn",
    animationTrigger: "onScroll",
  };
  const countdown = createNode("countdown");
  countdown.props.heading = "Countdown to Opening Keynote";
  countdown.props.expiredText = "The event is live — welcome!";
  countdown.props.buttonText = "Get Tickets";
  countdown.props.buttonHref = "#events";
  countdown.style = {
    maxWidth: "860px",
    marginY: "28px",
    paddingY: "24px",
    paddingX: "24px",
    glass: true,
    hoverEffect: "glow",
  };
  eventBanner.children.push(countdown);
  root = insertNode(root, root.id, eventBanner);

  const testimonialsSlider = createNode("slider");
  testimonialsSlider.props.autoplay = true;
  testimonialsSlider.props.slides = [
    {
      image: PLACEHOLDER_BG("1600x700"),
      heading: "“A network that turns ideas into action.”",
      subheading: "Regional leader, 2025",
      buttonText: "",
      buttonHref: "",
    },
    {
      image: PLACEHOLDER_BG("1600x700"),
      heading: "“The projects are real, measurable, and member-led.”",
      subheading: "Club coordinator",
      buttonText: "",
      buttonHref: "",
    },
    {
      image: PLACEHOLDER_BG("1600x700"),
      heading: "“The community is global, welcoming, and ambitious.”",
      subheading: "Member since 2018",
      buttonText: "",
      buttonHref: "",
    },
  ];
  testimonialsSlider.style = {
    paddingY: "0px",
    animationType: "fadeIn",
    animationTrigger: "onScroll",
  };
  root = insertNode(root, root.id, testimonialsSlider);

  const eventsHeading = createNode("richText");
  eventsHeading.props.html =
    '<h2 style="text-align:center">Upcoming Events</h2><p style="text-align:center">Published items from the Events collection.</p>';
  eventsHeading.style = {
    paddingY: "56px",
    paddingX: "24px",
    animationType: "fadeIn",
    animationTrigger: "onScroll",
  };
  root = insertNode(root, root.id, eventsHeading);
  const events = createNode("collectionList");
  events.props.collectionSlug = "events";
  events.props.columns = 3;
  events.props.limit = 6;
  events.style = {
    paddingY: "0px",
    paddingX: "24px",
    animationType: "slideUp",
    animationTrigger: "onScroll",
    animationStagger: 0.06,
  };
  root = insertNode(root, root.id, events);

  const newsHeading = createNode("richText");
  newsHeading.props.html =
    '<h2 style="text-align:center">Latest News</h2><p style="text-align:center">Published items from the News collection.</p>';
  newsHeading.style = {
    customAttributes: { id: "news" },
    paddingY: "56px",
    paddingX: "24px",
    animationType: "fadeIn",
    animationTrigger: "onScroll",
  };
  root = insertNode(root, root.id, newsHeading);
  const news = createNode("collectionList");
  news.props.collectionSlug = "news";
  news.props.columns = 3;
  news.props.limit = 6;
  news.style = {
    paddingY: "0px",
    paddingX: "24px",
    animationType: "slideUp",
    animationTrigger: "onScroll",
    animationStagger: 0.06,
  };
  root = insertNode(root, root.id, news);

  // 13. FAQ accordion
  const faq = createNode("accordion");
  faq.style.animationType = "fadeIn";
  faq.style.animationTrigger = "onScroll";
  faq.props.heading = "Frequently Asked Questions";
  faq.props.items = [
    {
      question: "How do I join a local club?",
      answer:
        "Use our Club Finder to locate a club near you and reach out to its membership contact.",
    },
    {
      question: "What does membership cost?",
      answer:
        "Dues vary by club and cover federation and club-level programs — your local club can share exact figures.",
    },
    {
      question: "Can I volunteer without becoming a member?",
      answer:
        "Yes — many of our projects welcome volunteers who aren't yet members.",
    },
    {
      question: "How are donations used?",
      answer:
        "Donations fund our appeals directly, with full transparency published in our annual report.",
    },
    {
      question: "Do you operate outside your founding country?",
      answer: "Yes, we have member clubs across dozens of countries worldwide.",
    },
  ];
  root = insertNode(root, root.id, faq);

  // 14. Contact form
  let contactSection = createNode("container");
  contactSection = setContainerColumnCount(contactSection, 2);
  contactSection.style.paddingY = "56px";
  contactSection.style.backgroundColor = "#f8fafc";
  contactSection.style.customAttributes = { id: "contact" };
  contactSection.style.animationType = "slideUp";
  contactSection.style.animationTrigger = "onScroll";
  const contactForm = createNode("contactForm");
  contactForm.props.heading = "Contact Us";
  contactForm.props.formName = "Homepage Contact";
  const contactInfoText = createNode("richText");
  contactInfoText.props.html =
    "<h3>Head Office</h3><p>Have a question? Reach out directly:</p><p><strong>Phone:</strong> +1 (555) 010-2020<br/>" +
    "<strong>Email:</strong> hello@globalimpactalliance.org</p>";
  contactSection.children[0].children.push(contactForm);
  contactSection.children[1].children.push(contactInfoText);
  root = insertNode(root, root.id, contactSection);

  // 15. Join CTA banner
  const joinCta = createNode("cta");
  joinCta.props.heading = "Join Global Impact Alliance Today";
  joinCta.props.subheading =
    "Add your voice to a worldwide community standing up for women and girls.";
  joinCta.props.buttonText = "Join Us";
  joinCta.props.buttonHref = "#join";
  joinCta.style.animationType = "zoomIn";
  joinCta.style.animationTrigger = "onScroll";
  root = insertNode(root, root.id, joinCta);

  const data = {
    title: "Home",
    status: "PUBLISHED" as const,
    content: root as any,
    seoTitle: "Global Impact Alliance — Standing Up for Women and Girls",
    seoDescription:
      "A worldwide federation of volunteers advancing education, equality, and opportunity for women and girls.",
    ogImage: PLACEHOLDER("Global Impact Alliance", "1200x630"),
  };

  const existing = await prisma.page.findUnique({ where: { slug: "" } });
  if (existing) {
    await prisma.page.update({ where: { id: existing.id }, data });
    const existingEs = await prisma.page.findFirst({
      where: { translationOfId: existing.id, locale: "es" },
    });
    const existingAr = await prisma.page.findFirst({
      where: { translationOfId: existing.id, locale: "ar" },
    });
    const base = await prisma.page.findUnique({ where: { slug: "" } });
    if (base) {
      const esData = {
        ...data,
        title: "Inicio",
        locale: "es",
        seoTitle: "Alianza de Impacto Global — Igualdad, salud y seguridad",
        seoDescription:
          "Un sitio demo multi-idioma creado con pg-cms, con animaciones modernas y contenido dinámico.",
        translationOfId: base.id,
      };
      const arData = {
        ...data,
        title: "الرئيسية",
        locale: "ar",
        seoTitle: "تحالف الأثر العالمي — المساواة والصحة والسلامة",
        seoDescription:
          "موقع تجريبي متعدد اللغات مبني بـ pg-cms، مع حركات حديثة ومحتوى ديناميكي.",
        translationOfId: base.id,
      };
      if (existingEs)
        await prisma.page.update({
          where: { id: existingEs.id },
          data: { ...esData, slug: "es" },
        });
      else await prisma.page.create({ data: { ...esData, slug: "es" } });
      if (existingAr)
        await prisma.page.update({
          where: { id: existingAr.id },
          data: { ...arData, slug: "ar" },
        });
      else await prisma.page.create({ data: { ...arData, slug: "ar" } });
    }
  } else {
    const created = await prisma.page.create({ data: { ...data, slug: "" } });
    await prisma.page.create({
      data: {
        ...data,
        slug: "es",
        title: "Inicio",
        locale: "es",
        seoTitle: "Alianza de Impacto Global — Igualdad, salud y seguridad",
        seoDescription:
          "Un sitio demo multi-idioma creado con pg-cms, con animaciones modernas y contenido dinámico.",
        translationOfId: created.id,
      },
    });
    await prisma.page.create({
      data: {
        ...data,
        slug: "ar",
        title: "الرئيسية",
        locale: "ar",
        seoTitle: "تحالف الأثر العالمي — المساواة والصحة والسلامة",
        seoDescription:
          "موقع تجريبي متعدد اللغات مبني بـ pg-cms، مع حركات حديثة ومحتوى ديناميكي.",
        translationOfId: created.id,
      },
    });
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const prisma = new PrismaClient();
  seedAdvancedHomepage(prisma)
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
