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
  year: string;
  status: string;
  caption: string;
  diagram: string;
  accent: string;
  accent2: string;
  stack: string[];
  links: { label: string; href: string }[];
  summary: { what: string; how: string; next: string };
  caseStudy: { tag: string; title: string; body: string };
};

// NOTE: year, status, stack, links and summary.how / summary.next are placeholders
// until the real details are filled in.
const PLACEHOLDER_HOW = "Placeholder: how it's built: architecture, key decisions and tooling.";
const PLACEHOLDER_NEXT = "Placeholder: what's next for this project.";

export const projects: Project[] = [
  {
    key: "awp",
    title: "AWP",
    tag: "Research",
    year: "2026",
    status: "Live public node",
    caption: "Federated semantic knowledge protocol",
    diagram: "d-awp",
    accent: "#8b5cf6",
    accent2: "#e879a8",
    stack: ["Placeholder", "Vector embeddings", "Protocol design"],
    links: [{ label: "Paper (coming soon)", href: "#" }],
    summary: {
      what: "A federated semantic knowledge protocol for AI agents: a parallel caching layer built on vector embeddings so agents can share what they know instead of re-deriving it every time.",
      how: PLACEHOLDER_HOW,
      next: "Being written up as a research paper.",
    },
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
    year: "2026",
    status: "Placeholder",
    caption: "Digital twin, Antarctic research stations",
    diagram: "d-twin",
    accent: "#ff4d23",
    accent2: "#e879a8",
    stack: ["Placeholder", "Digital twin", "Simulation"],
    links: [],
    summary: {
      what: "A digital twin framework for India's Maitri and Bharati Antarctic research stations, built for the NCPOR/MoES problem statement at Smart India Hackathon 2026.",
      how: PLACEHOLDER_HOW,
      next: PLACEHOLDER_NEXT,
    },
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
    year: "Placeholder",
    status: "Placeholder",
    caption: "Anthropomorphic robotic hand",
    diagram: "d-hand",
    accent: "#ff6a00",
    accent2: "#ff4d23",
    stack: ["Placeholder", "McKibben muscles", "Actuation"],
    links: [],
    summary: {
      what: "An anthropomorphic robotic hand actuated with McKibben-style artificial muscles, a first step toward humanoid teleoperation work.",
      how: PLACEHOLDER_HOW,
      next: PLACEHOLDER_NEXT,
    },
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
    year: "2026",
    status: "Placeholder",
    caption: "Multi-robot warehouse coordination",
    diagram: "d-nav",
    accent: "#8b5cf6",
    accent2: "#4d7cff",
    stack: ["Placeholder", "Multi-agent", "Navigation"],
    links: [],
    summary: {
      what: "Multi-robot warehouse navigation and fleet coordination, built as part of the SIH 2026 track alongside the Digital Twin work.",
      how: PLACEHOLDER_HOW,
      next: PLACEHOLDER_NEXT,
    },
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
    year: "Placeholder",
    status: "Placeholder",
    caption: "Interactive quantum computing platform",
    diagram: "d-quantum",
    accent: "#e879a8",
    accent2: "#ff4d23",
    stack: ["Placeholder", "Quantum simulation", "AI"],
    links: [],
    summary: {
      what: "An AI-powered interactive platform for learning, designing, and simulating quantum algorithms.",
      how: PLACEHOLDER_HOW,
      next: PLACEHOLDER_NEXT,
    },
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
    year: "Placeholder",
    status: "Placeholder",
    caption: "Mocap-driven teleoperated arm",
    diagram: "d-teleop",
    accent: "#ff6a00",
    accent2: "#e879a8",
    stack: ["Placeholder", "Motion capture", "Teleoperation"],
    links: [],
    summary: {
      what: "A high-accuracy teleoperated robotic arm driven by motion capture, a first step into humanoid teleoperation.",
      how: PLACEHOLDER_HOW,
      next: PLACEHOLDER_NEXT,
    },
    caseStudy: {
      tag: "Robotics",
      title: "Teleop Arm",
      body: "A first step into humanoid teleoperation: a high-accuracy teleoperated robotic arm driven by motion capture.",
    },
  },
];
