export const timelineStages = [
  {
    label: "Canada",
    title: "It started in Canada.",
    body: "A diploma in Computer Programming at Georgian College, Ontario. Learning the discipline of shipping software that actually works.",
    keyword: "Canada",
    accent: "#e879a8",
  },
  {
    label: "Software",
    title: "Then, software.",
    body: "Full-stack products, real users, real bugs. Building the instinct for what makes systems reliable.",
    keyword: "software",
    accent: "#ff4d23",
  },
  {
    label: "AI / ML",
    title: "Now, AI and ML.",
    body: "A BTech in Artificial Intelligence and Machine Learning at Rajalakshmi Engineering College, Chennai.",
    keyword: "AI and ML",
    accent: "#8b5cf6",
  },
  {
    label: "Agentic systems",
    title: "Agentic systems.",
    body: "Protocols and multi-agent architectures for AI that coordinates and acts on its own, not just responds.",
    keyword: "Agentic systems",
    accent: "#ff4d23",
  },
  {
    label: "Robotics",
    title: "Physical intelligence.",
    body: "Giving agents a body: actuation, teleoperation, robotics that reach into the real world.",
    keyword: "Physical intelligence",
    accent: "#e879a8",
  },
] as const;

export type Project = {
  key: string;
  title: string;
  tag: string;
  caption: string;
  diagram: string;
  accent: string;
  accent2: string;
  caseStudy: { tag: string; title: string; body: string };
};

export const projects: Project[] = [
  {
    key: "awp",
    title: "AWP",
    tag: "Research",
    caption: "Federated semantic knowledge protocol",
    diagram: "d-awp",
    accent: "#8b5cf6",
    accent2: "#e879a8",
    caseStudy: {
      tag: "Research — live public node",
      title: "AWP: Agent Web Protocol",
      body: "A federated semantic knowledge protocol for AI agents: a parallel caching layer built on vector embeddings so agents can share what they know instead of re-deriving it every time. Currently being written up as a research paper.",
    },
  },
  {
    key: "twin",
    title: "Maitri Bharati Twin",
    tag: "Hackathon",
    caption: "Digital twin, Antarctic research stations",
    diagram: "d-twin",
    accent: "#ff4d23",
    accent2: "#e879a8",
    caseStudy: {
      tag: "Smart India Hackathon 2026",
      title: "Maitri Bharati Digital Twin",
      body: "A digital twin framework for India's Maitri and Bharati Antarctic research stations, built for the NCPOR/MoES problem statement at SIH 2026.",
    },
  },
  {
    key: "godhand",
    title: "Godhand",
    tag: "Robotics",
    caption: "Anthropomorphic robotic hand",
    diagram: "d-hand",
    accent: "#ff6a00",
    accent2: "#ff4d23",
    caseStudy: {
      tag: "Robotics",
      title: "Godhand",
      body: "An anthropomorphic robotic hand actuated with McKibben-style artificial muscles, a first step toward humanoid teleoperation work.",
    },
  },
  {
    key: "autonav",
    title: "AutoNav Fleet",
    tag: "Multi-Agent",
    caption: "Multi-robot warehouse coordination",
    diagram: "d-nav",
    accent: "#8b5cf6",
    accent2: "#4d7cff",
    caseStudy: {
      tag: "Multi-Agent Systems, SIH 2026",
      title: "AutoNav Fleet",
      body: "Multi-robot warehouse navigation and fleet coordination, built as part of the SIH 2026 track alongside the Digital Twin work.",
    },
  },
  {
    key: "quantum",
    title: "Quantum Platform",
    tag: "EdTech",
    caption: "Interactive quantum computing platform",
    diagram: "d-quantum",
    accent: "#e879a8",
    accent2: "#ff4d23",
    caseStudy: {
      tag: "EdTech",
      title: "Quantum Learning Platform",
      body: "An AI-powered interactive platform for learning, designing, and simulating quantum algorithms.",
    },
  },
  {
    key: "teleop",
    title: "Teleop Arm",
    tag: "Robotics",
    caption: "Mocap-driven teleoperated arm",
    diagram: "d-teleop",
    accent: "#ff6a00",
    accent2: "#e879a8",
    caseStudy: {
      tag: "Robotics",
      title: "Teleop Arm",
      body: "A first step into humanoid teleoperation: a high-accuracy teleoperated robotic arm driven by motion capture.",
    },
  },
];
