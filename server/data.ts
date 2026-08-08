// Mock data: one morning's inbound maintenance requests at a 240-unit
// property-management portfolio in Fremont, CA. Written the way tenants
// actually write them — messy, incomplete, sometimes alarming.

export type Ticket = {
  id: string;
  received: string;
  building: string;
  unit: string;
  tenant: string;
  channel: "voicemail" | "portal" | "text" | "email";
  text: string;
  /** Facts Marisol would know from the file, not from the message. */
  file: string[];
};

export const TICKETS: Ticket[] = [
  {
    id: "WO-4471",
    received: "6:42 AM",
    building: "Alder Court",
    unit: "118",
    tenant: "R. Okafor",
    channel: "voicemail",
    text: "Hi, this is 118. There's kind of a rotten-egg smell in the kitchen since last night? It comes and goes. Probably nothing but I wanted to say something.",
    file: ["Gas range", "Last appliance service 2021"],
  },
  {
    id: "WO-4472",
    received: "6:58 AM",
    building: "Birch Row",
    unit: "209",
    tenant: "M. Delgado",
    channel: "text",
    text: "water coming through the ceiling in the bathroom. its dripping into the tub. not stopping",
    file: ["Unit 309 directly above", "309 vacant since 3/1"],
  },
  {
    id: "WO-4473",
    received: "7:03 AM",
    building: "Cedar Terrace",
    unit: "302",
    tenant: "L. Trần",
    channel: "portal",
    text: "The water pressure in the shower has been getting worse. Takes forever to rinse. Also the sink drains slow.",
    file: ["Stack C-02", "No prior plumbing WO this unit"],
  },
  {
    id: "WO-4474",
    received: "7:15 AM",
    building: "Cedar Terrace",
    unit: "402",
    tenant: "J. Whitfield",
    channel: "portal",
    text: "Low water pressure, second time I'm reporting. Someone came out on the 9th and said it was the aerator but it's the same.",
    file: ["Stack C-02", "WO-4188 closed 4/9 — aerator replaced"],
  },
  {
    id: "WO-4475",
    received: "7:21 AM",
    building: "Cedar Terrace",
    unit: "502",
    tenant: "A. Boateng",
    channel: "text",
    text: "shower is basically a trickle in the morning. fine at night. is something going on with the building",
    file: ["Stack C-02", "WO-4102 closed 3/28 — 'no issue found'"],
  },
  {
    id: "WO-4476",
    received: "7:26 AM",
    building: "Alder Court",
    unit: "411",
    tenant: "E. Kowalski",
    channel: "voicemail",
    text: "The heat isn't kicking on. It's been off since yesterday evening. I've got a blanket, I'm managing, don't want to be a bother.",
    file: ["Tenant age 81", "Lives alone", "Overnight low 44°F"],
  },
  {
    id: "WO-4477",
    received: "7:34 AM",
    building: "Birch Row",
    unit: "507",
    tenant: "D. Ramírez",
    channel: "email",
    text: "The AC is doing the same thing again. This is the third time. I've taken a half day off work for each of these visits and I'd like to know what the actual plan is.",
    file: [
      "WO-4009 closed 2/14 — capacitor",
      "WO-4210 closed 3/22 — recharge",
      "Unit is 14 years old",
      "Same vendor both visits (Delta Mech)",
    ],
  },
  {
    id: "WO-4478",
    received: "7:41 AM",
    building: "Cedar Terrace",
    unit: "220",
    tenant: "S. Adeyemi",
    channel: "portal",
    text: "Saw two roaches in the kitchen last night. First time. Not an infestation but I wanted it on record.",
    file: ["Adjacent 218, 222 no reports", "Building last treated 1/12"],
  },
  {
    id: "WO-4479",
    received: "7:49 AM",
    building: "Alder Court",
    unit: "130",
    tenant: "P. Nakamura",
    channel: "text",
    text: "smoke detector in the hallway is chirping every minute. driving us crazy",
    file: ["Hardwired w/ battery backup", "Installed 2019"],
  },
  {
    id: "WO-4480",
    received: "7:55 AM",
    building: "Birch Row",
    unit: "233",
    tenant: "C. Fitzgerald",
    channel: "portal",
    text: "Garbage disposal stopped working. I think a fork went down there. Sorry.",
    file: ["Tenant-caused likely", "Lease §7 chargeback applies"],
  },
  {
    id: "WO-4481",
    received: "8:02 AM",
    building: "Cedar Terrace",
    unit: "115",
    tenant: "H. Mwangi",
    channel: "text",
    text: "fridge isn't cold anymore. freezer still works. we have a bunch of groceries in there",
    file: ["Owner-supplied appliance", "Installed 2018"],
  },
  {
    id: "WO-4482",
    received: "8:08 AM",
    building: "Alder Court",
    unit: "324",
    tenant: "B. Lindqvist",
    channel: "portal",
    text: "Closet door came off the track. It still slides if you lift it. No rush.",
    file: [],
  },
  {
    id: "WO-4483",
    received: "8:14 AM",
    building: "Birch Row",
    unit: "141",
    tenant: "G. Alvarez",
    channel: "portal",
    text: "The blinds in the living room are broken — the wand snapped off.",
    file: [],
  },
  {
    id: "WO-4484",
    received: "8:19 AM",
    building: "Cedar Terrace",
    unit: "408",
    tenant: "N. Bassi",
    channel: "text",
    text: "the deadbolt doesn't catch unless you pull the door hard. been like this a week but last night it didn't lock at all",
    file: ["Ground-floor-adjacent stairwell entry", "Single occupant"],
  },
];

/** The seed Mettle already knows about the person before the interview starts. */
export const OPERATOR = {
  name: "Marisol Vega",
  role: "Maintenance Coordinator",
  org: "240 units across three properties · Fremont, CA",
  years: 19,
  task: "Triaging the morning maintenance queue",
  today: "Tuesday, 8:30 AM · 14 requests came in overnight",
};
