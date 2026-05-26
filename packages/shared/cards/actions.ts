import type { CardInfo, CardTypes } from "../cards";

export type ActionName = 
    "Village" | 
    "Smithy" | 
    "Council Room" | 
    "Festival" | 
    "Laboratory" | 
    "Market" | 
    "Witch";

interface Village extends CardInfo {
  name: "Village";
  types: [typeof CardTypes.ACTION];
  cost: 3;
}

interface Smithy extends CardInfo {
  name: "Smithy";
  types: [typeof CardTypes.ACTION];
  cost: 4;
}

interface CouncilRoom extends CardInfo {
  name: "Council Room";
  types: [typeof CardTypes.ACTION];
  cost: 5;
}

interface Festival extends CardInfo {
  name: "Festival";
  types: [typeof CardTypes.ACTION];
  cost: 5;
}

interface Laboratory extends CardInfo {
  name: "Laboratory";
  types: [typeof CardTypes.ACTION];
  cost: 5;
}

interface Market extends CardInfo {
  name: "Market";
  types: [typeof CardTypes.ACTION];
  cost: 5;
}

interface Witch extends CardInfo {
  name: "Witch";
  types: [typeof CardTypes.ACTION];
  cost: 5;
}