import type { ComponentType } from "react";
import type { SectionProps } from "./sections/types";
import { Header } from "./sections/Header";
import { Footer } from "./sections/Footer";
import { Container } from "./sections/Container";
import { Column } from "./sections/Column";
import { Grid } from "./sections/Grid";
import { GridCell } from "./sections/GridCell";
import { NavZone } from "./sections/NavZone";
import { Logo } from "./sections/Logo";
import { NavLinks } from "./sections/NavLinks";
import { Hero } from "./sections/Hero";
import { RichText } from "./sections/RichText";
import { ImageBlock } from "./sections/ImageBlock";
import { Slider } from "./sections/Slider";
import { ImageBackgroundSection } from "./sections/ImageBackgroundSection";
import { VideoBackgroundSection } from "./sections/VideoBackgroundSection";
import { ThreeBackground } from "./sections/ThreeBackground";
import { MapEmbed } from "./sections/MapEmbed";
import { ButtonGroup } from "./sections/ButtonGroup";
import { Gallery } from "./sections/Gallery";
import { Cta } from "./sections/Cta";
import { Countdown } from "./sections/Countdown";
import { Stats } from "./sections/Stats";
import { CardGrid } from "./sections/CardGrid";
import { Accordion } from "./sections/Accordion";
import { Tabs } from "./sections/Tabs";
import { Marquee } from "./sections/Marquee";
import { LanguageSwitcher } from "./sections/LanguageSwitcher";
import { CollectionList } from "./sections/CollectionList";
import { ContactForm } from "./sections/ContactForm";
import { SiteSearch } from "./sections/SiteSearch";
import { EmbedBlock } from "./sections/EmbedBlock";
import { GoToTop } from "./sections/GoToTop";
import { Testimonial } from "./sections/Testimonial";
import { PricingTable } from "./sections/PricingTable";
import { VideoEmbed } from "./sections/VideoEmbed";
import { TeamGrid } from "./sections/TeamGrid";
import { LogoCloud } from "./sections/LogoCloud";
import { Timeline } from "./sections/Timeline";
import { BeforeAfter } from "./sections/BeforeAfter";
import { Divider } from "./sections/Divider";
import { Spacer } from "./sections/Spacer";

export const SECTION_COMPONENTS: Record<string, ComponentType<SectionProps>> = {
  goToTop: GoToTop,
  header: Header,
  footer: Footer,
  container: Container,
  column: Column,
  grid: Grid,
  gridCell: GridCell,
  navZone: NavZone,
  logo: Logo,
  navLinks: NavLinks,
  hero: Hero,
  richText: RichText,
  imageBlock: ImageBlock,
  slider: Slider,
  imageBackgroundSection: ImageBackgroundSection,
  videoBackgroundSection: VideoBackgroundSection,
  threeBackground: ThreeBackground,
  mapEmbed: MapEmbed,
  buttonGroup: ButtonGroup,
  gallery: Gallery,
  cta: Cta,
  countdown: Countdown,
  stats: Stats,
  cardGrid: CardGrid,
  accordion: Accordion,
  tabs: Tabs,
  marquee: Marquee,
  languageSwitcher: LanguageSwitcher,
  collectionList: CollectionList,
  contactForm: ContactForm,
  siteSearch: SiteSearch,
  embed: EmbedBlock,
  testimonial: Testimonial,
  pricingTable: PricingTable,
  videoEmbed: VideoEmbed,
  teamGrid: TeamGrid,
  logoCloud: LogoCloud,
  timeline: Timeline,
  beforeAfter: BeforeAfter,
  divider: Divider,
  spacer: Spacer,
};
