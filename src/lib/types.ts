export type ComponentType =
  | "frontend"
  | "backend"
  | "database"
  | "cloud"
  | "security"
  | "messagebus"
  | "external";

export type BoundaryKind = "region" | "security-group";

export type ConnectionVariant = "default" | "emphasis" | "security" | "dashed";

export type CardDot = "cyan" | "emerald" | "violet" | "amber" | "rose" | "orange" | "slate";

export interface ArchifySource {
  path: string;
  line?: number;
  end_line?: number;
  label?: string;
}

export interface ArchifyComponent {
  id: string;
  type: ComponentType;
  label: string;
  sublabel?: string;
  tag?: string;
  brand?: string | { id: string; digest?: string };
  sources?: ArchifySource[];
  pos?: [number, number]; // [x, y]
  size?: [number, number]; // [w, h]
  row?: number;
  col?: number;
}

export interface ArchifyBoundary {
  kind: BoundaryKind;
  label: string;
  wraps: string[]; // component IDs
  pad?: number;
}

export interface ArchifyConnection {
  id?: string;
  from: string;
  to: string;
  label?: string;
  variant?: ConnectionVariant;
  fromSide?: "left" | "right" | "top" | "bottom";
  toSide?: "left" | "right" | "top" | "bottom";
  route?: "auto" | "straight" | "orthogonal-h" | "orthogonal-v";
  labelDy?: number;
  labelDx?: number;
  via?: [number, number][];
}

export interface ArchifyCard {
  dot: CardDot;
  title: string;
  items: string[];
}

export interface ArchifyView {
  id: string;
  label: string;
  focus: string[]; // component IDs
  note?: string;
}

export interface ArchifyArchitectureJson {
  schema_version: 1;
  diagram_type: "architecture";
  meta: {
    title: string;
    subtitle?: string;
    output?: string;
    visual_preset?: "classic" | "signal-flow" | "blueprint" | "editorial";
    quality_profile?: "standard" | "showcase";
    views?: ArchifyView[];
  };
  components: ArchifyComponent[];
  boundaries?: ArchifyBoundary[];
  connections?: ArchifyConnection[];
  cards?: ArchifyCard[];
}

export interface RepoFileInfo {
  path: string;
  content: string;
  size: number;
}

export interface DetectedTechStack {
  frameworks: string[];
  databases: string[];
  infrastructure: string[];
  runtimes: string[];
  externalServices: string[];
  archetype: "fullstack" | "backend-api" | "frontend-app" | "library-sdk" | "cli-system" | "data-pipeline" | "monorepo";
}

export interface GenerateApiResponse {
  success: boolean;
  repo: string;
  jsonIr?: ArchifyArchitectureJson;
  html?: string;
  cached?: boolean;
  error?: string;
}


