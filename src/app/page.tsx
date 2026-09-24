"use client";

import { useSmoothScroll } from "@/lib/useSmoothScroll";
import Nav from "@/components/Nav";
import ProgressBar from "@/components/ProgressBar";
import CursorDot from "@/components/CursorDot";
import JumpIndex from "@/components/JumpIndex";
import DiagramDefs from "@/components/DiagramDefs";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Stack from "@/components/Stack";
import Projects from "@/components/Projects";
import Connect from "@/components/Connect";
import Footer from "@/components/Footer";

export default function Home() {
  useSmoothScroll();

  return (
    <>
      <ProgressBar />
      <CursorDot />
      <Nav />
      <DiagramDefs />

      <Hero />
      <About />
      <Stack />
      <Projects />
      <Connect />
      <Footer />

      <JumpIndex />
    </>
  );
}
