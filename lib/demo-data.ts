/**
 * InternConnect — Demo Data (Phase 1)
 *
 * WARNING: All listings below are fictional, synthetic, and clearly labeled
 * as DEMO data. No listing represents a real job, internship, employer,
 * or verified opportunity. They exist solely to develop and preview the UI.
 */

import type { Job, JobFilters } from "@/lib/types";

export type { Job, JobFilters };

export const ROLES = [
  "Software Engineering",
  "Product Management",
  "Data Science",
  "UX Design",
  "Marketing",
  "Sales",
  "Operations",
  "Finance",
  "Cybersecurity",
  "DevOps",
] as const;

export const SKILLS = [
  "React",
  "TypeScript",
  "Node.js",
  "Python",
  "SQL",
  "MongoDB",
  "AWS",
  "Figma",
  "Sketch",
  "Machine Learning",
  "Docker",
  "Kubernetes",
  "Git",
  "Java",
  "C++",
  "Go",
  "Rust",
  "GraphQL",
  "PostgreSQL",
  "Pandas",
  "TensorFlow",
  "PyTorch",
  "Agile",
  "Scrum",
] as const;

export const LOCATIONS = [
  "San Francisco, CA",
  "New York, NY",
  "Seattle, WA",
  "Austin, TX",
  "Remote",
  "London, UK",
  "Toronto, Canada",
  "Dublin, Ireland",
  "Bangalore, India",
  "Sydney, Australia",
] as const;

export const EMPLOYMENT_TYPES = ["Remote", "On-site", "Hybrid"] as const;
export const JOB_TYPES = ["Internship", "Full-time", "Part-time", "Contract", "Co-op"] as const;

/** ALL demo listings — clearly marked isDemo: true */
export const DEMO_JOBS: Job[] = [
  {
    id: "job-1",
    title: "Software Engineering Intern — Summer 2026",
    role: "Software Engineering",
    company: {
      name: "Nebula Labs (Demo)",
      logo: "🚀",
      description:
        "Nebula Labs is a fictional space-tech startup building next-gen satellite communication systems. We solve complex engineering challenges with elegant solutions and love mentoring the next generation of builders.",
      website: "",
      size: "51-200 employees",
      industry: "Space Technology",
    },
    location: "San Francisco, CA",
    remote: false,
    type: "Internship",
    employmentType: "Hybrid",
    paid: true,
    compensation: {
      min: 35,
      max: 45,
      currency: "USD",
      period: "hour",
    },
    posted: "2026-09-15",
    deadline: "2026-10-31",
    isDemo: true,
    responsibilities: [
      "Build and maintain React components for our dashboard platform",
      "Collaborate with senior engineers on API integration and data pipelines",
      "Write clean, well-tested code with TypeScript and Jest",
      "Participate in code reviews and agile ceremonies",
      "Document features and contribute to internal wikis",
    ],
    eligibility: [
      "Pursuing BS/MS in Computer Science, Software Engineering, or related field",
      "Expected graduation: Summer 2027 or later",
      "3+ relevant coursework projects in CS",
      "Strong problem-solving skills and attention to detail",
    ],
    skills: ["React", "TypeScript", "Node.js", "SQL", "Git"],
    description:
      "This is a DEMO listing for development purposes only. Join our fictional engineering team for a 12-week internship where you'll work on real products (not real customers) and mentor (not real mentors) who are passionate about engineering excellence. You'll gain hands-on experience with modern web technologies and contribute to products that power space exploration (in simulation).",
    applicationLink: "",
    applicants: 128,
  },
  {
    id: "job-2",
    title: "Product Management Co-op",
    role: "Product Management",
    company: {
      name: "Vertex Dynamics (Demo)",
      logo: "⚙️",
      description:
        "Vertex Dynamics is a fictional enterprise SaaS company that helps businesses optimize supply chains through predictive analytics. We are a fast-growing team that values curiosity, collaboration, and customer obsession.",
      website: "",
      size: "200-500 employees",
      industry: "Enterprise Software",
    },
    location: "New York, NY",
    remote: false,
    type: "Co-op",
    employmentType: "On-site",
    paid: true,
    compensation: {
      min: 2800,
      max: 3400,
      currency: "USD",
      period: "month",
    },
    posted: "2026-09-30",
    deadline: "2026-11-15",
    isDemo: true,
    responsibilities: [
      "Define product requirements and roadmap for our inventory optimization module",
      "Conduct user research and analyze customer feedback",
      "Coordinate with engineering, design, and data science teams",
      "Track KPIs and build dashboards to measure feature success",
      "Present product updates to cross-functional stakeholders",
    ],
    eligibility: [
      "Pursuing BS/MS in Business, Computer Science, or related technical field",
      "Strong analytical and communication skills",
      "Interest in SaaS product management",
      "Excellent written and verbal communication",
    ],
    skills: ["Product Management", "Figma", "SQL", "Agile", "Data Analysis"],
    description:
      "This is a DEMO listing for development purposes only. At Vertex Dynamics (a fictional company), you'll dive into product management for our flagship supply-chain optimization platform. You'll shape features that help imaginary businesses move inventory efficiently using data-driven insights. This is a learning role, not a real employment opportunity.",
    applicationLink: "",
    applicants: 94,
  },
  {
    id: "job-3",
    title: "Data Science Intern",
    role: "Data Science",
    company: {
      name: "AstraMind AI (Demo)",
      logo: "🧠",
      description:
        "AstraMind AI is a fictional artificial intelligence research lab focused on democratizing AI tools for education and healthcare. We build models, mentor researchers, and publish (fictional) papers.",
      website: "",
      size: "10-50 employees",
      industry: "Artificial Intelligence",
    },
    location: "Toronto, Canada",
    remote: true,
    type: "Internship",
    employmentType: "Remote",
    paid: true,
    compensation: {
      min: 24,
      max: 32,
      currency: "USD",
      period: "hour",
    },
    posted: "2026-09-20",
    deadline: "2026-11-01",
    isDemo: true,
    responsibilities: [
      "Build and evaluate machine learning models for educational use cases",
      "Clean, process, and analyze large datasets",
      "Collaborate with research scientists on novel model architectures",
      "Write reproducible notebooks and document experiments",
      "Present findings in weekly research syncs",
    ],
    eligibility: [
      "Pursuing BS/MS/PhD in Computer Science, Statistics, Math, or related field",
      "Coursework in machine learning and statistics",
      "Proficiency in Python, pandas, and scikit-learn",
      "Strong analytical and communication skills",
    ],
    skills: ["Python", "Machine Learning", "SQL", "TensorFlow", "Pandas", "PyTorch"],
    description:
      "This is a DEMO listing for development purposes only. At AstraMind AI (fictional), we explore how AI can transform education and healthcare. As a data science intern on our (fictional) research team, you'll work with real datasets on hypothetical problems and collaborate with researchers who don't actually exist. This role is for UI development practice, not a real research position.",
    applicationLink: "",
    applicants: 206,
  },
  {
    id: "job-4",
    title: "Marketing Intern — Growth Team",
    role: "Marketing",
    company: {
      name: "Summit Digital (Demo)",
      logo: "📈",
      description:
        "Summit Digital is a fictional growth marketing agency that helps startups scale their user acquisition and retention. We blend creativity, data, and a healthy obsession with experimentation.",
      website: "",
      size: "50-100 employees",
      industry: "Marketing & Advertising",
    },
    location: "Austin, TX",
    remote: false,
    type: "Internship",
    employmentType: "Hybrid",
    paid: true,
    compensation: {
      min: 1800,
      max: 2200,
      currency: "USD",
      period: "month",
    },
    posted: "2026-09-10",
    deadline: "2026-10-25",
    isDemo: true,
    responsibilities: [
      "Run and optimize paid social and search campaigns",
      "Analyze campaign performance with GA4 and Looker",
      "Support content creation for blog posts and social media",
      "Coordinate with designers on landing page optimization",
      "Prepare weekly performance reports for clients (fictional)",
    ],
    eligibility: [
      "Pursuing BS/MS in Marketing, Communications, Business, or related field",
      "Interest in digital marketing and analytics",
      "Basic Excel and spreadsheet modeling skills",
      "Strong written and verbal communication",
      "Prior coursework in marketing, business, or analytics preferred",
    ],
    skills: ["Marketing", "Google Ads", "Analytics", "Figma", "SQL"],
    description:
      "This is a DEMO listing for development purposes only. Summit Digital is a fictional marketing agency that helps fictional startups grow. As a marketing intern on our fictional growth team, you'll run (fictional) campaigns, analyze (fictional) metrics, and present results to (fictional) clients. This is a learning opportunity, not a real position.",
    applicationLink: "",
    applicants: 153,
  },
  {
    id: "job-5",
    title: "Junior UX Designer",
    role: "UX Design",
    company: {
      name: "Canvas Collective (Demo)",
      logo: "🎨",
      description:
        "Canvas Collective is a fictional design studio that partners with mission-driven organizations to build beautiful, humane digital experiences. We believe design should serve people, not the other way around.",
      website: "",
      size: "20-50 employees",
      industry: "Design & Creative",
    },
    location: "Remote",
    remote: true,
    type: "Full-time",
    employmentType: "Remote",
    paid: true,
    compensation: {
      min: 65000,
      max: 75000,
      currency: "USD",
      period: "year",
    },
    posted: "2026-09-05",
    deadline: "2026-10-20",
    isDemo: true,
    responsibilities: [
      "Design user interfaces for our fictional web and mobile products",
      "Create wireframes, prototypes, and design systems",
      "Conduct usability research with (fictional) participants",
      "Collaborate with product managers and engineers",
      "Participate in design critiques and iterate on feedback",
    ],
    eligibility: [
      "0-2 years of design experience or a strong portfolio",
      "Proficiency in Figma or Sketch",
      "Understanding of design systems and accessibility",
      "Ability to present and rationalize design decisions",
    ],
    skills: ["Figma", "Sketch", "UX Design", "Design Systems", "Adobe XD"],
    description:
      "This is a DEMO listing for development purposes only. Canvas Collective is a fictional design studio built for UI development. We create interfaces for imaginary products and conduct research with fictional users. If you're passionate about design and want to build a portfolio (of fictional work), this is for you. Not a real position.",
    applicationLink: "",
    applicants: 87,
  },
  {
    id: "job-6",
    title: "Frontend Engineering Intern",
    role: "Software Engineering",
    company: {
      name: "CloudShift (Demo)",
      logo: "☁️",
      description:
        "CloudShift is a fictional cloud infrastructure platform that helps developers deploy and scale applications with zero friction. We're backed by (fictional) investors and built for developers, by (fictional) developers.",
      website: "",
      size: "500-1000 employees",
      industry: "Cloud Computing",
    },
    location: "Seattle, WA",
    remote: false,
    type: "Internship",
    employmentType: "On-site",
    paid: false,
    compensation: {
      min: 0,
      max: 0,
      currency: "USD",
      period: "hour",
    },
    posted: "2026-09-28",
    deadline: "2026-11-10",
    isDemo: true,
    responsibilities: [
      "Build responsive UI components for our (fictional) admin console",
      "Integrate with REST and GraphQL APIs",
      "Implement performance monitoring and fix rendering bottlenakes",
      "Write unit and integration tests",
      "Collaborate with backend and design teams",
    ],
    eligibility: [
      "Pursuing BS/MS in Computer Science or related field",
      "Experience with React, TypeScript, and modern CSS",
      "Understanding of HTTP APIs and state management",
      "Coursework in data structures and algorithms",
      "Passion for performance and developer experience",
    ],
    skills: ["React", "TypeScript", "Node.js", "GraphQL", "Docker"],
    description:
      "This is an unpaid DEMO listing for development purposes only. CloudShift is a fictional cloud platform with no real customers or products. This internship provides experience building UIs for imaginary infrastructure, not real employment. All company logos, descriptions, and opportunities are synthetic and for UI development practice only. Not a real position.",
    applicationLink: "",
    applicants: 176,
  },
];

/** Filter helpers */
export function filterJobs(jobs: import("@/lib/types").Job[], filters: import("@/lib/types").JobFilters): import("@/lib/types").Job[] {
  return jobs.filter((job) => {
    if (
      filters.query &&
      !job.title.toLowerCase().includes(filters.query.toLowerCase()) &&
      !job.company.name.toLowerCase().includes(filters.query.toLowerCase()) &&
      !job.skills.some((s) =>
        s.toLowerCase().includes(filters.query.toLowerCase())
      )
    )
      return false;

    if (filters.role && filters.role !== "all") {
      if (job.role !== filters.role) return false;
    }

    if (filters.location && filters.location !== "all") {
      const matchesLocation =
        job.location === filters.location ||
        (filters.location === "Remote" && job.remote);
      if (!matchesLocation) return false;
    }

    if (filters.remote === "remote" && !job.remote) return false;
    if (filters.remote === "onsite" && job.remote) return false;

    if (filters.type && filters.type !== "all" && job.type !== filters.type)
      return false;

    if (filters.paid === "paid" && !job.paid) return false;
    if (filters.paid === "unpaid" && job.paid) return false;

    if (filters.skill && filters.skill !== "all") {
      if (!job.skills.includes(filters.skill)) return false;
    }

    return true;
  });
}
