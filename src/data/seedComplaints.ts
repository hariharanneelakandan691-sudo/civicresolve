import type { CivicComplaint } from "../types/civic";

const now = Date.now();
const HOUR = 60 * 60 * 1000;

export const INITIAL_DEMO_COMPLAINTS: CivicComplaint[] = [
  {
    id: "seed-pothole-001",
    caseNumber: "CR-2026-1042",
    title: "Deep Waterlogged Pothole at Route 15 Bus Stop",
    location: "Central Ave & 4th St — Northbound Bus Shelter",
    description:
      "A roughly 3-foot wide asphalt crater has formed right along the curb in the bus lane. Rainwater hides the depth, causing buses and taxis to jolt heavily and splash commuters waiting at the shelter.",
    imageUrl: "/src/assets/images/civic_pothole_bus_stop_1795244807496.jpg",
    category: "Roads & Potholes",
    priority: "High",
    department: "Public Works Dept",
    aiSummary:
      "Severe waterlogged asphalt crater inside an active transit lane creates an immediate vehicle damage and commuter safety hazard requiring urgent patching.",
    status: "In Progress",
    createdAt: new Date(now - 5 * HOUR).toISOString(),
    updatedAt: new Date(now - 2 * HOUR).toISOString(),
  },
  {
    id: "seed-streetlight-002",
    caseNumber: "CR-2026-1041",
    title: "Shattered & Tilted Streetlight Over Pedestrian Crosswalk",
    location: "Hackney Rd & Elm St Intersection Crosswalk",
    description:
      "The streetlamp housing right above the zebra crossing has shattered glass and is hanging at an angle with no illumination after dusk. Cars struggle to see pedestrians crossing toward the grocery storefronts.",
    imageUrl: "/src/assets/images/civic_broken_streetlight_1795244807363.jpg",
    category: "Streetlights & Electricity",
    priority: "High",
    department: "Electrical Dept",
    aiSummary:
      "Damaged overhead lamp housing and total outage at a high-foot-traffic pedestrian crosswalk pose an urgent nighttime visibility and falling-debris risk.",
    status: "Reported",
    createdAt: new Date(now - 9 * HOUR).toISOString(),
    updatedAt: new Date(now - 9 * HOUR).toISOString(),
  },
  {
    id: "seed-waste-003",
    caseNumber: "CR-2026-1038",
    title: "Overflowing Municipal Waste Bin Beside Market",
    location: "Al's Neighborhood Market, 214 Maple St Sidewalk",
    description:
      "The public dumpster and sidewalk collection point have been overflowing since yesterday evening. Produce crates, cardboard boxes, and leaking trash bags are spilling onto the curb and narrowing pedestrian access.",
    imageUrl: "/src/assets/images/civic_overflowing_bin_market_1795244807984.jpg",
    category: "Waste Management",
    priority: "Medium",
    department: "Sanitation Wing",
    aiSummary:
      "Overflowing municipal waste bin and spilled market refuse are obstructing pedestrian walkway clearance and require prompt sanitation dispatch.",
    status: "Reported",
    createdAt: new Date(now - 14 * HOUR).toISOString(),
    updatedAt: new Date(now - 14 * HOUR).toISOString(),
  },
];
