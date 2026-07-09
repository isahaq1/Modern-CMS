import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { createEmptyPage, createNode, insertNode, setContainerColumnCount } from "@pgcms/shared";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Builds a demo "Our Charities" page, structurally modeled on the kind of nonprofit
// charities-listing page you'd find at an organization like sigbi.org/what-we-do/our-charities/
// (intro -> charity listings -> impact stats -> donation deadline -> foundation blurb ->
// testimonials -> gallery -> video -> map -> news -> donate -> join CTA -> footer), using
// original/generic content and placeholder imagery — not any real organization's text,
// logo, or trademarks. Exercises every component type currently in the registry.

const PLACEHOLDER = (label: string, size = "800x500") =>
  `https://placehold.co/${size}/1e293b/ffffff?text=${encodeURIComponent(label)}`;
// For images used as a *background behind real heading text* — a baked-in text label
// would visually clash with the actual copy layered on top, so keep these blank.
const PLACEHOLDER_BG = (size: string) => `https://placehold.co/${size}/1e293b/1e293b?text=+`;

const SAMPLE_VIDEO = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

export async function seedOurCharitiesPage(prisma: PrismaClient) {
  let root = createEmptyPage();

  // 1. Hero banner (image background)
  const heroBanner = createNode("imageBackgroundSection");
  heroBanner.props.heading = "Standing Up for Women and Girls";
  heroBanner.props.subheading =
    "Discover the charities and appeals our federation supports to change lives around the world.";
  heroBanner.props.buttonText = "Donate Now";
  heroBanner.props.buttonHref = "#donate";
  heroBanner.style.backgroundImage = PLACEHOLDER_BG("1600x700");
  root = insertNode(root, root.id, heroBanner);

  // 2. Intro rich text
  const intro = createNode("richText");
  intro.props.html =
    "<p>Every year, our federation raises funds for a small number of carefully chosen appeals. " +
    "Explore the funds below, see the impact your support has already made, and find out how to " +
    "give to the causes that matter most.</p>";
  root = insertNode(root, root.id, intro);

  // 3. Card grid — the charity listings themselves
  const charities = createNode("cardGrid");
  charities.props.heading = "Our Charities";
  charities.props.columns = 3;
  charities.props.cards = [
    {
      image: PLACEHOLDER("Benevolent Fund"),
      title: "Benevolent Fund",
      excerpt: "Financial assistance for members and their families facing hardship.",
      buttonText: "Learn more",
      href: "#benevolent-fund",
    },
    {
      image: PLACEHOLDER("Education Grant"),
      title: "Diamond Education Grant",
      excerpt: "Funding education and skills training for women rebuilding their lives.",
      buttonText: "Learn more",
      href: "#education-grant",
    },
    {
      image: PLACEHOLDER("Emergency Relief"),
      title: "Emergency Relief Fund",
      excerpt: "Rapid-response aid for communities affected by disaster and crisis.",
      buttonText: "Learn more",
      href: "#emergency-relief",
    },
  ];
  root = insertNode(root, root.id, charities);

  // 4. Impact stats
  const stats = createNode("stats");
  stats.props.columns = 4;
  stats.props.items = [
    { value: "500+", label: "Charities Supported" },
    { value: "$2M+", label: "Raised This Year" },
    { value: "40", label: "Countries Reached" },
    { value: "12K", label: "Volunteer Hours" },
  ];
  stats.style.backgroundColor = "#f1f5f9";
  root = insertNode(root, root.id, stats);

  // 5. Countdown to the next grant cycle deadline
  const countdown = createNode("countdown");
  countdown.props.heading = "Next Grant Cycle Deadline";
  countdown.props.expiredText = "Applications for this cycle are now closed — check back soon for the next round.";
  countdown.props.buttonText = "Apply Now";
  countdown.props.buttonHref = "#apply";
  root = insertNode(root, root.id, countdown);

  // 6. Foundation feature — two-column layout (image + copy)
  let foundation = createNode("container");
  foundation = setContainerColumnCount(foundation, 2);
  const foundationImage = createNode("imageBlock");
  foundationImage.props.src = PLACEHOLDER("Our Foundation", "700x500");
  foundationImage.props.alt = "Our Foundation";
  const foundationText = createNode("richText");
  foundationText.props.html =
    "<h2>Our Foundation</h2><p>Our federation's charitable foundation focuses on education, poverty " +
    "prevention, and human rights for women and girls worldwide. Together with our member clubs, it " +
    "funds grassroots projects that create lasting change.</p><p><a href=\"#foundation\">Visit the Foundation →</a></p>";
  foundation.children[0].children.push(foundationImage);
  foundation.children[1].children.push(foundationText);
  root = insertNode(root, root.id, foundation);

  // 7. Testimonial slider
  const testimonials = createNode("slider");
  testimonials.props.autoplay = true;
  testimonials.props.slides = [
    {
      image: PLACEHOLDER_BG("1600x600"),
      heading: "“The Emergency Relief Fund reached our village within days.”",
      subheading: "Flood relief recipient, 2025",
      buttonText: "",
      buttonHref: "",
    },
    {
      image: PLACEHOLDER_BG("1600x600"),
      heading: "“The Education Grant let me finish my nursing degree.”",
      subheading: "Diamond Education Grant recipient",
      buttonText: "",
      buttonHref: "",
    },
    {
      image: PLACEHOLDER_BG("1600x600"),
      heading: "“Membership gave me a global community of changemakers.”",
      subheading: "Federation member since 2019",
      buttonText: "",
      buttonHref: "",
    },
  ];
  root = insertNode(root, root.id, testimonials);

  // 8. Photo gallery
  const gallery = createNode("gallery");
  gallery.props.columns = 4;
  gallery.props.images = [1, 2, 3, 4].map((n) => ({ src: PLACEHOLDER(`Impact ${n}`, "500x500"), alt: `Impact photo ${n}` }));
  root = insertNode(root, root.id, gallery);

  // 9. Video background section
  const video = createNode("videoBackgroundSection");
  video.props.heading = "See Our Work in Action";
  video.props.subheading = "A look at the projects your donations make possible.";
  video.style.backgroundVideo = SAMPLE_VIDEO;
  root = insertNode(root, root.id, video);

  // 10. Map — find a local club
  const map = createNode("mapEmbed");
  map.props.lat = 51.5074;
  map.props.lng = -0.1278;
  map.props.zoom = 11;
  root = insertNode(root, root.id, map);

  // 11. Latest news
  const news = createNode("cardGrid");
  news.props.heading = "Latest News";
  news.props.columns = 3;
  news.props.cards = [
    {
      image: PLACEHOLDER("News 1"),
      title: "Federation Announces Record Fundraising Year",
      excerpt: "Member clubs raised more for our appeals in the last year than ever before.",
      buttonText: "Read more",
      href: "#news-1",
    },
    {
      image: PLACEHOLDER("News 2"),
      title: "Education Grant Opens for New Applications",
      excerpt: "The Diamond Education Grant is now accepting applications for the next cohort.",
      buttonText: "Read more",
      href: "#news-2",
    },
    {
      image: PLACEHOLDER("News 3"),
      title: "Emergency Relief Fund Responds to Flooding",
      excerpt: "Rapid-response aid was distributed to affected communities within 72 hours.",
      buttonText: "Read more",
      href: "#news-3",
    },
  ];
  root = insertNode(root, root.id, news);

  // 12. Donation buttons
  const donate = createNode("buttonGroup");
  donate.style.paddingY = "48px";
  donate.props.buttons = [
    { text: "Donate to Benevolent Fund", href: "#donate-benevolent", variant: "primary" },
    { text: "Donate to Education Grant", href: "#donate-education", variant: "secondary" },
    { text: "Donate to Emergency Relief", href: "#donate-emergency", variant: "outline" },
  ];
  root = insertNode(root, root.id, donate);

  // 13. Join CTA
  const cta = createNode("cta");
  cta.props.heading = "Ready to Make a Difference?";
  cta.props.subheading = "Join a community of changemakers standing up for women and girls worldwide.";
  cta.props.buttonText = "Join Us";
  cta.props.buttonHref = "#join";
  root = insertNode(root, root.id, cta);

  const data = {
    title: "Our Charities",
    status: "PUBLISHED" as const,
    content: root as any,
    seoTitle: "Our Charities",
    seoDescription:
      "Explore the charities and appeals we support, see our impact, and find out how to give or get involved.",
  };

  const existing = await prisma.page.findUnique({ where: { slug: "our-charities" } });
  if (existing) {
    await prisma.page.update({ where: { id: existing.id }, data });
    console.log("Updated existing 'Our Charities' page");
  } else {
    await prisma.page.create({ data: { ...data, slug: "our-charities" } });
    console.log("Created 'Our Charities' page");
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const prisma = new PrismaClient();
  seedOurCharitiesPage(prisma)
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
