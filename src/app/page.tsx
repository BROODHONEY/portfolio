"use client";

import { useSmoothScroll } from "@/lib/useSmoothScroll";
import Nav from "@/components/Nav";
import ProgressBar from "@/components/ProgressBar";
import CursorDot from "@/components/CursorDot";
import ThemeToggle from "@/components/ThemeToggle";
import Sky from "@/components/Sky";
import JumpIndex from "@/components/JumpIndex";
import DiagramDefs from "@/components/DiagramDefs";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Projects from "@/components/Projects";
import Connect from "@/components/Connect";
import Footer from "@/components/Footer";

export default function Home() {
  useSmoothScroll();

  return (
    <>
      <Sky />
      <ProgressBar />
      <CursorDot />
      <Nav />
      <ThemeToggle />
      <DiagramDefs />

      <Hero />
      <About />
      <Projects />
      <Connect />
      <Footer />

      <JumpIndex />
    </>
  );
}
