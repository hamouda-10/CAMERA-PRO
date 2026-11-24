const HIGGS_BASE =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_';

export function higgsUrl(id: string, width: number): string {
  const png = `${HIGGS_BASE}${id}.png`;
  return `https://images.higgs.ai/?default=1&output=webp&url=${encodeURIComponent(png)}&w=${width}&q=85`;
}

export const CAMERA_IDS = {
  cam1: '20261123_063459_193f84da-199e-41b5-8799-928ad67fd4e7',
  cam2: '20261123_063501_0cebf6fd-58cd-4cff-83c8-ecaa026bc315',
  cam3: '20261123_063500_3aaf0fbc-be7e-4aaa-b9e3-c05576fca584',
  cam4: '20261123_063501_5bb9fba1-e90d-42a3-86de-f3781bf93890',
  cam5: '20261123_063500_febed648-3445-48b8-8a77-95ed640de074',
  cam6: '20261123_063459_46765ae9-cef1-4d57-be66-cf4874b98c88',
} as const;

export const ACCESSORY_IDS = {
  a1: '20261123_063500_52268785-384c-458a-bba8-48e8e31dc1b7',
  a2: '20261123_063500_5da68034-0d53-430b-b2e7-125f951b8edd',
  a3: '20261123_063529_7e251229-2a86-4bf0-b1ce-a0c322b72a10',
  a4: '20261123_063528_42a9482e-5de3-463d-96c9-2a55aaa21c03',
  a5: '20261123_063528_3b261fd2-e255-4dad-8620-4a697efdf68d',
  a6: '20261123_063528_6371899e-449a-4370-a795-94acddce62ef',
  a7: '20261123_063529_160252d7-09c5-4e0f-99f4-8b7f443705d7',
  a8: '20261123_063528_8f1f255c-addc-4ec1-8c5e-4b04a91439ed',
} as const;

export const PHOTO_IDS = {
  p1: '20261123_063528_7094557c-58c4-4ba4-9166-0336dd238901',
  p2: '20261123_063529_aa416f7c-8fd5-4a58-bd98-25614addbb3f',
  p3: '20261123_063555_769d745e-3f9e-4c8d-a6d9-95f7f2da27f5',
  p4: '20261123_063554_53d93f22-8b9c-4147-8f61-a53f9d8785ce',
} as const;

export const PHOTO_META: Record<PhotoKey, { label: string; frame: string }> = {
  p1: { label: 'Berlin street with yellow tram', frame: '14A' },
  p2: { label: 'Rooftop portrait in late sun', frame: '22A' },
  p3: { label: 'Misty lake with rowing boat', frame: '07' },
  p4: { label: 'Morning paper in Mitte café', frame: '31A' },
};

export type AccessoryKey = keyof typeof ACCESSORY_IDS;
export type PhotoKey = keyof typeof PHOTO_IDS;
export type CameraAssetKey = keyof typeof CAMERA_IDS;

export interface SpecRow {
  label: string;
  value: string;
}

export type AccessoryPlacement = [AccessoryKey, number, number, number, number];

export interface CameraItem {
  kind: 'camera';
  id: string;
  index: number;
  assetKey: CameraAssetKey;
  name: string;
  type: string;
  year: number;
  maxAperture: string;
  price: number; // USD
  column: 0 | 1 | 2;
  scale: number;
  description: string;
  chips: [string, string, string];
  specs: SpecRow[];
  condition: [string, string, string];
  shots: [PhotoKey, PhotoKey, PhotoKey];
  accessories: AccessoryPlacement[];
}

export interface ExtraCatalogRow {
  id: string;
  name: string;
  type: string;
  year: number;
  price: number; // USD
  column: 0 | 1 | 2;
  tag: 'In stock' | 'Reserved' | 'Sold out' | 'Waitlist';
}

export type LensCategory = 'Rangefinder' | 'SLR Prime' | 'Telephoto' | 'Medium Format';

export interface LensItem {
  kind: 'lens';
  id: string;
  index: number;
  name: string;
  mount: string;
  category: LensCategory;
  focalLength: string;
  maxAperture: string;
  year: number;
  price: number; // USD
  image: string;
  grade: string;
  description: string;
  chips: [string, string, string];
  specs: SpecRow[];
  condition: [string, string, string];
  shots: [PhotoKey, PhotoKey, PhotoKey];
}

export type ShopProduct = CameraItem | LensItem;

export const CAMERAS: CameraItem[] = [
  {
    kind: 'camera',
    id: 'ranger-35',
    index: 0,
    assetKey: 'cam1',
    name: 'Ranger 35',
    type: 'Rangefinder',
    year: 1966,
    maxAperture: 'f/2',
    price: 960,
    column: 0,
    scale: 1,
    description:
      'A pocketable 35mm rangefinder with a bright-frame finder and a whisper-quiet leaf shutter. The camera street photographers keep for life.',
    chips: ['Rangefinder', '35mm', 'Leaf shutter'],
    specs: [
      { label: 'Format', value: '35mm film' },
      { label: 'Lens', value: '50mm f/2, fixed' },
      { label: 'Shutter', value: 'Leaf · 1s – 1/500' },
      { label: 'Metering', value: 'Selenium, coupled' },
      { label: 'Weight', value: '520 g' },
      { label: 'Made', value: '1966' },
    ],
    condition: ['Grade A · excellent', 'Seals replaced', 'Shutter timed'],
    shots: ['p1', 'p4', 'p2'],
    accessories: [
      ['a1', -0.66, -0.12, -22, 0.2],
      ['a3', 0.66, 0.2, 0, 0.2],
      ['a4', -0.52, 0.44, 24, 0.22],
      ['a6', 0.6, -0.4, 0, 0.24],
    ],
  },
  {
    kind: 'camera',
    id: 'okta-6x6',
    index: 1,
    assetKey: 'cam2',
    name: 'Okta 6×6',
    type: 'Twin-lens reflex',
    year: 1958,
    maxAperture: 'f/3.5',
    price: 1245,
    column: 2,
    scale: 1.42,
    description:
      'Look down into the ground glass and the world goes square. A medium format TLR with a sharp 75mm taking lens and a crank that feels like clockwork.',
    chips: ['Medium format', '120 film', 'Waist-level'],
    specs: [
      { label: 'Format', value: '6×6 cm on 120' },
      { label: 'Lens', value: '75mm f/3.5' },
      { label: 'Shutter', value: 'Leaf · 1s – 1/500' },
      { label: 'Finder', value: 'Waist-level, bright screen' },
      { label: 'Weight', value: '1,080 g' },
      { label: 'Made', value: '1958' },
    ],
    condition: ['Grade A · excellent', 'New focusing screen', 'Film counter checked'],
    shots: ['p3', 'p2', 'p1'],
    accessories: [
      ['a7', -0.6, -0.16, -14, 0.22],
      ['a5', 0.62, 0.06, 12, 0.24],
      ['a3', -0.46, 0.46, 0, 0.17],
      ['a8', 0.48, 0.48, 0, 0.17],
    ],
  },
  {
    kind: 'camera',
    id: 'norda-slr',
    index: 2,
    assetKey: 'cam3',
    name: 'Norda SLR',
    type: 'Single-lens reflex',
    year: 1974,
    maxAperture: 'f/1.8',
    price: 690,
    column: 1,
    scale: 1,
    description:
      'All-mechanical, built like a tank, with a split-prism finder that snaps into focus. The SLR we hand to every first-time film shooter.',
    chips: ['SLR', '35mm', 'Fully mechanical'],
    specs: [
      { label: 'Format', value: '35mm film' },
      { label: 'Lens', value: '50mm f/1.8' },
      { label: 'Shutter', value: 'Focal-plane · 1s – 1/1000' },
      { label: 'Metering', value: 'TTL match-needle' },
      { label: 'Weight', value: '740 g' },
      { label: 'Made', value: '1974' },
    ],
    condition: ['Grade A+ · near mint', 'Mirror foam new', 'Meter calibrated'],
    shots: ['p4', 'p1', 'p3'],
    accessories: [
      ['a2', -0.64, -0.22, 16, 0.2],
      ['a8', 0.62, 0.3, 0, 0.18],
      ['a4', 0.54, -0.44, -30, 0.22],
      ['a1', -0.56, 0.42, 38, 0.19],
    ],
  },
  {
    kind: 'camera',
    id: 'pip-90',
    index: 3,
    assetKey: 'cam4',
    name: 'Pip 90',
    type: 'Compact',
    year: 1994,
    maxAperture: 'f/3.5',
    price: 305,
    column: 0,
    scale: 1,
    description:
      'A champagne point-and-shoot with a sharp little zoom and a flash that makes every night out look like 1996.',
    chips: ['Compact', 'Autofocus', 'Zoom'],
    specs: [
      { label: 'Format', value: '35mm film' },
      { label: 'Lens', value: '38–90mm f/3.5–7.8' },
      { label: 'Exposure', value: 'Programmed AE' },
      { label: 'Flash', value: 'Built-in, red-eye' },
      { label: 'Weight', value: '285 g' },
      { label: 'Made', value: '1994' },
    ],
    condition: ['Grade A · excellent', 'Clean LCD', 'Battery included'],
    shots: ['p2', 'p1', 'p3'],
    accessories: [
      ['a1', -0.64, 0.08, 10, 0.19],
      ['a2', 0.64, -0.2, -26, 0.19],
      ['a4', -0.44, -0.48, 70, 0.2],
      ['a3', 0.52, 0.46, 0, 0.17],
    ],
  },
  {
    kind: 'camera',
    id: 'kino-8',
    index: 4,
    assetKey: 'cam5',
    name: 'Kino 8',
    type: 'Super 8 cine',
    year: 1971,
    maxAperture: 'f/1.8',
    price: 455,
    column: 1,
    scale: 1,
    description:
      'Home movies the way they should feel: grainy, golden and a little shaky. Power zoom, auto exposure and a viewfinder that hums.',
    chips: ['Super 8', 'Cine', 'Power zoom'],
    specs: [
      { label: 'Format', value: 'Super 8 cartridge' },
      { label: 'Lens', value: '8–40mm f/1.8 zoom' },
      { label: 'Speeds', value: '18 / 24 fps' },
      { label: 'Metering', value: 'Through-the-lens' },
      { label: 'Weight', value: '1,240 g' },
      { label: 'Made', value: '1971' },
    ],
    condition: ['Grade B+ · very good', 'Motor serviced', 'Zoom tested'],
    shots: ['p3', 'p4', 'p2'],
    accessories: [
      ['a6', -0.64, -0.2, 0, 0.24],
      ['a8', 0.62, 0.36, 0, 0.17],
      ['a4', 0.56, -0.46, 20, 0.22],
      ['a2', -0.52, 0.46, -40, 0.18],
    ],
  },
  {
    kind: 'camera',
    id: 'falta-6x9',
    index: 5,
    assetKey: 'cam6',
    name: 'Falta 6×9',
    type: 'Folding',
    year: 1953,
    maxAperture: 'f/4.5',
    price: 605,
    column: 2,
    scale: 1.2,
    description:
      'Unfold the bellows and you are holding the biggest negative that still fits in a coat pocket: eight huge frames on every roll.',
    chips: ['Folding', '120 film', '6×9 negatives'],
    specs: [
      { label: 'Format', value: '6×9 cm on 120' },
      { label: 'Lens', value: '105mm f/4.5' },
      { label: 'Shutter', value: 'Leaf · 1s – 1/250' },
      { label: 'Focus', value: 'Scale, front cell' },
      { label: 'Weight', value: '690 g' },
      { label: 'Made', value: '1953' },
    ],
    condition: ['Grade A · excellent', 'Bellows light-tight', 'Shutter timed'],
    shots: ['p1', 'p3', 'p4'],
    accessories: [
      ['a7', 0.62, -0.24, 20, 0.22],
      ['a5', -0.64, 0.1, -15, 0.24],
      ['a6', 0.56, 0.44, 0, 0.22],
      ['a3', -0.46, -0.48, 0, 0.16],
    ],
  },
];

export const EXTRA_CATALOG_ROWS: ExtraCatalogRow[] = [
  {
    id: 'tomo-half',
    name: 'Tomo Half',
    type: 'Half-frame',
    year: 1965,
    price: 335,
    column: 0,
    tag: 'Reserved',
  },
  {
    id: 'brio-35',
    name: 'Brio 35',
    type: 'Compact',
    year: 1989,
    price: 175,
    column: 0,
    tag: 'In stock',
  },
  {
    id: 'velo-400',
    name: 'Velo 400',
    type: 'Instant',
    year: 1978,
    price: 205,
    column: 1,
    tag: 'Sold out',
  },
  {
    id: 'luma-6x7',
    name: 'Luma 6×7',
    type: 'Medium format SLR',
    year: 1982,
    price: 1825,
    column: 2,
    tag: 'Waitlist',
  },
];

export const LENSES: LensItem[] = [
  {
    kind: 'lens',
    id: 'kron-35-f2',
    index: 0,
    name: 'Kron 35mm f/2',
    mount: 'Leica M-Mount',
    category: 'Rangefinder',
    focalLength: '35mm',
    maxAperture: 'f/2',
    year: 1968,
    price: 1380,
    image: '/src/assets/images/lens_kron_35mm_1795478715600.jpg',
    grade: 'Grade A+ · near mint',
    description:
      'Eight-element German rangefinder glass with a classic focusing tab and crisp edge-to-edge micro-contrast. Collimated on our optical bench.',
    chips: ['M-Mount', '35mm', 'Manual focus'],
    specs: [
      { label: 'Mount', value: 'Leica M bayonet' },
      { label: 'Optical formula', value: '8 elements / 6 groups' },
      { label: 'Aperture', value: 'f/2 – f/16 · 10 blades' },
      { label: 'Min. focus', value: '0.7 m' },
      { label: 'Filter thread', value: 'E39 (39mm)' },
      { label: 'Weight', value: '245 g' },
    ],
    condition: ['Zero haze or fungus', 'Helicoid freshly damped', 'Aperture blades oil-free'],
    shots: ['p1', 'p4', 'p2'],
  },
  {
    kind: 'lens',
    id: 'noctis-50-f14',
    index: 1,
    name: 'Noctis 50mm f/1.4',
    mount: 'Nikon F · AI',
    category: 'SLR Prime',
    focalLength: '50mm',
    maxAperture: 'f/1.4',
    year: 1976,
    price: 340,
    image: '/src/assets/images/lens_noctis_50mm_1795478716441.jpg',
    grade: 'Grade A · excellent',
    description:
      'Fast multi-coated standard prime with silky wide-open glow at f/1.4 and razor sharpness by f/2.8. Built with a knurled all-metal focus barrel.',
    chips: ['Nikon F', '50mm', 'Fast prime'],
    specs: [
      { label: 'Mount', value: 'Nikon F bayonet (AI)' },
      { label: 'Optical formula', value: '7 elements / 6 groups' },
      { label: 'Aperture', value: 'f/1.4 – f/16 · 7 blades' },
      { label: 'Min. focus', value: '0.45 m' },
      { label: 'Filter thread', value: '52mm' },
      { label: 'Weight', value: '250 g' },
    ],
    condition: ['Clean multi-coating', 'Snappy stop-down lever', 'Focus throw buttery'],
    shots: ['p4', 'p2', 'p1'],
  },
  {
    kind: 'lens',
    id: 'velvet-85-f2',
    index: 2,
    name: 'Velvet 85mm f/2',
    mount: 'Nikon F · AI',
    category: 'Telephoto',
    focalLength: '85mm',
    maxAperture: 'f/2',
    year: 1977,
    price: 495,
    image: '/src/assets/images/lens_velvet_85mm_1795478724599.jpg',
    grade: 'Grade A · excellent',
    description:
      'Compact portrait telephoto prized for smooth background falloff and warm skin rendition on both color negative and black-and-white film.',
    chips: ['Portrait', '85mm', 'Multi-coated'],
    specs: [
      { label: 'Mount', value: 'Nikon F bayonet (AI)' },
      { label: 'Optical formula', value: '5 elements / 5 groups' },
      { label: 'Aperture', value: 'f/2 – f/22 · 7 blades' },
      { label: 'Min. focus', value: '0.85 m' },
      { label: 'Filter thread', value: '52mm' },
      { label: 'Weight', value: '310 g' },
    ],
    condition: ['Clear internal glass', 'Aperture detents crisp', 'Bench collimated'],
    shots: ['p2', 'p4', 'p3'],
  },
  {
    kind: 'lens',
    id: 'strasse-28-f28',
    index: 3,
    name: 'Strasse 28mm f/2.8',
    mount: 'M42 / F-Mount',
    category: 'SLR Prime',
    focalLength: '28mm',
    maxAperture: 'f/2.8',
    year: 1969,
    price: 295,
    image: '/src/assets/images/lens_strasse_28mm_1795478718201.jpg',
    grade: 'Grade A · excellent',
    description:
      'Wide-angle street workhorse with a generous depth-of-field scale for effortless zone focusing. Chrome nose ring and deep contrast.',
    chips: ['Wide angle', '28mm', 'Zone focus'],
    specs: [
      { label: 'Mount', value: 'Nikon F / M42 adapter incl.' },
      { label: 'Optical formula', value: '7 elements / 7 groups' },
      { label: 'Aperture', value: 'f/2.8 – f/16 · 6 blades' },
      { label: 'Min. focus', value: '0.3 m' },
      { label: 'Filter thread', value: '52mm' },
      { label: 'Weight', value: '240 g' },
    ],
    condition: ['Zero balsam separation', 'Clean chrome rim', 'Focus grease renewed'],
    shots: ['p1', 'p3', 'p2'],
  },
  {
    kind: 'lens',
    id: 'fern-135-f28',
    index: 4,
    name: 'Fern 135mm f/2.8',
    mount: 'Nikon F · Non-AI/AI',
    category: 'Telephoto',
    focalLength: '135mm',
    maxAperture: 'f/2.8',
    year: 1973,
    price: 260,
    image: '/src/assets/images/lens_fern_135mm_1795478718858.jpg',
    grade: 'Grade A- · very good',
    description:
      'Classic medium telephoto with a built-in slide-out metal hood and diamond-knurled focusing barrel. Compresses architecture and distant light cleanly.',
    chips: ['Telephoto', '135mm', 'Built-in hood'],
    specs: [
      { label: 'Mount', value: 'Nikon F bayonet' },
      { label: 'Optical formula', value: '4 elements / 4 groups' },
      { label: 'Aperture', value: 'f/2.8 – f/22 · 7 blades' },
      { label: 'Min. focus', value: '1.5 m' },
      { label: 'Filter thread', value: '52mm' },
      { label: 'Weight', value: '435 g' },
    ],
    condition: ['Hood slides tightly', 'Glass spotless', 'Dry aperture iris'],
    shots: ['p3', 'p1', 'p4'],
  },
  {
    kind: 'lens',
    id: 'quadro-80-f28',
    index: 5,
    name: 'Quadro 80mm f/2.8',
    mount: 'V-System 6×6',
    category: 'Medium Format',
    focalLength: '80mm',
    maxAperture: 'f/2.8',
    year: 1964,
    price: 1120,
    image: '/src/assets/images/lens_quadro_80mm_1795478717890.jpg',
    grade: 'Grade A+ · near mint',
    description:
      'Legendary chrome Planar-formula medium format lens with an integrated Compur leaf shutter that syncs flash at every speed up to 1/500.',
    chips: ['Medium format', '80mm', 'Leaf shutter'],
    specs: [
      { label: 'Mount', value: 'V-System 6×6 bayonet' },
      { label: 'Optical formula', value: '7 elements / 5 groups' },
      { label: 'Shutter', value: 'Synchro-Compur 1s – 1/500' },
      { label: 'Min. focus', value: '0.9 m' },
      { label: 'Filter mount', value: 'Bayonet 50' },
      { label: 'Weight', value: '510 g' },
    ],
    condition: ['Leaf shutter timed', 'Coatings pristine', 'EV lock calibrated'],
    shots: ['p3', 'p2', 'p4'],
  },
];

export const COLUMN_TITLES = [
  'RANGEFINDER & COMPACT',
  'SLR & CINE',
  'MEDIUM FORMAT',
] as const;

export function getKitAddonPrice(basePrice: number): number {
  return Math.round((basePrice * 0.07 + 20) / 5) * 5;
}

export function getWarrantyPrice(product: ShopProduct): number {
  return product.kind === 'lens' ? 35 : 42;
}

export function getProductImage(product: ShopProduct, width: number): string {
  if (product.kind === 'camera') {
    return higgsUrl(CAMERA_IDS[product.assetKey], width);
  }
  return product.image;
}

export function formatUSD(amount: number): string {
  return `$${Math.round(amount).toLocaleString('en-US')}`;
}
