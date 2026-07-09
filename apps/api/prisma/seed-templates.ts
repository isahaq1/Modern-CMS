// One-off: seeds a handful of starter PageTemplate rows so a new page can begin from
// a real, populated layout instead of a blank canvas. Idempotent (matches by name).
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { createEmptyPage, createNode, insertNode } from "@pgcms/shared";

const prisma = new PrismaClient();

const PLACEHOLDER = (label: string, size = "1600x700") =>
  `https://placehold.co/${size}/0b1220/ffffff?text=${encodeURIComponent(label)}`;

function landingPage() {
  let root = createEmptyPage();

  const hero = createNode("hero");
  hero.props.heading = "Build your next website in minutes";
  hero.props.subheading = "A visual, drag-and-drop CMS with everything a modern site needs — no code required.";
  hero.props.primaryButtonText = "Get Started";
  hero.props.primaryButtonHref = "#";
  hero.props.backgroundAnimationEnabled = true;
  hero.style.minHeight = "480px";
  root = insertNode(root, root.id, hero);

  const stats = createNode("stats");
  root = insertNode(root, root.id, stats);

  const cardGrid = createNode("cardGrid");
  cardGrid.props.heading = "Everything you need";
  root = insertNode(root, root.id, cardGrid);

  const testimonial = createNode("testimonial");
  root = insertNode(root, root.id, testimonial);

  const pricing = createNode("pricingTable");
  root = insertNode(root, root.id, pricing);

  const cta = createNode("cta");
  root = insertNode(root, root.id, cta);

  return root;
}

function aboutPage() {
  let root = createEmptyPage();

  const hero = createNode("imageBackgroundSection");
  hero.props.heading = "About Us";
  hero.props.subheading = "Learn about our mission, our story, and the people behind it.";
  hero.style.backgroundImage = PLACEHOLDER("About");
  hero.style.minHeight = "360px";
  root = insertNode(root, root.id, hero);

  const richText = createNode("richText");
  richText.props.html =
    "<h2>Our Story</h2><p>Replace this with your company's story — where you started, what you believe in, and where you're headed.</p>";
  root = insertNode(root, root.id, richText);

  const team = createNode("teamGrid");
  root = insertNode(root, root.id, team);

  const logoCloud = createNode("logoCloud");
  logoCloud.props.heading = "Trusted by teams at";
  root = insertNode(root, root.id, logoCloud);

  return root;
}

function servicesPage() {
  let root = createEmptyPage();

  const hero = createNode("hero");
  hero.props.heading = "Our Services";
  hero.props.subheading = "What we offer, and how it helps you.";
  root = insertNode(root, root.id, hero);

  const cardGrid = createNode("cardGrid");
  cardGrid.props.heading = "What we do";
  root = insertNode(root, root.id, cardGrid);

  const timeline = createNode("timeline");
  timeline.props.heading = "How it works";
  root = insertNode(root, root.id, timeline);

  const accordion = createNode("accordion");
  root = insertNode(root, root.id, accordion);

  const cta = createNode("cta");
  root = insertNode(root, root.id, cta);

  return root;
}

function blogHomePage() {
  let root = createEmptyPage();

  const hero = createNode("richText");
  hero.props.html = "<h1>Blog</h1><p>The latest updates, stories, and insights.</p>";
  hero.style.textAlign = "center";
  hero.style.paddingY = "64px";
  root = insertNode(root, root.id, hero);

  const list = createNode("collectionList");
  list.props.collectionSlug = "blog";
  root = insertNode(root, root.id, list);

  return root;
}

function contactPage() {
  let root = createEmptyPage();

  const hero = createNode("richText");
  hero.props.html = "<h1>Contact Us</h1><p>We'd love to hear from you.</p>";
  hero.style.textAlign = "center";
  hero.style.paddingY = "48px";
  root = insertNode(root, root.id, hero);

  const form = createNode("contactForm");
  root = insertNode(root, root.id, form);

  const map = createNode("mapEmbed");
  root = insertNode(root, root.id, map);

  return root;
}

const TEMPLATES: { name: string; category: string; build: () => ReturnType<typeof createEmptyPage> }[] = [
  { name: "Landing Page", category: "Marketing", build: landingPage },
  { name: "About Us", category: "Company", build: aboutPage },
  { name: "Services", category: "Marketing", build: servicesPage },
  { name: "Blog Home", category: "Content", build: blogHomePage },
  { name: "Contact", category: "Company", build: contactPage },
];

async function main() {
  for (const t of TEMPLATES) {
    const existing = await prisma.pageTemplate.findFirst({ where: { name: t.name } });
    if (existing) {
      console.log(`Skipping "${t.name}" — already exists.`);
      continue;
    }
    await prisma.pageTemplate.create({
      data: { name: t.name, category: t.category, content: t.build() as object },
    });
    console.log(`Created template "${t.name}".`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
