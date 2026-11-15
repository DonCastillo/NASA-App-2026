import type { ArticleRef } from '../types'

// Background articles in plan/articles/, with their original pages (from each file's front matter).
// Generated from the front matter; src/data/articles.test.ts fails if this list and the files drift apart.
export const ARTICLES: Record<string, ArticleRef> = {
  archer: { title: 'ARCHeR', url: 'https://www.nasa.gov/reference/archer/', agency: 'NASA' },
  'artemis-ii-standard-measures': {
    title: 'Artemis II Standard Measures',
    url: 'https://www.nasa.gov/reference/artemis-ii-standard-measures/',
    agency: 'NASA',
  },
  'astronauts-spines-under-scrutiny': {
    title: 'Astronauts’ Spines Under Scrutiny',
    url: 'https://www.nasa.gov/missions/station/astronauts-spines-under-scrutiny/',
    agency: 'NASA',
  },
  'b-complex': {
    title: 'B-Complex',
    url: 'https://www.nasa.gov/reference/b-complex/',
    agency: 'NASA',
  },
  'benefits-of-space-exploration': {
    title: 'Benefits of space exploration',
    url: 'https://www.asc-csa.gc.ca/eng/about/everyday-benefits-of-space-exploration/',
    agency: 'CSA',
  },
  'brain-fluid-pressure': {
    title: 'Brain Fluid Pressure',
    url: 'https://www.nasa.gov/reference/brain-fluid-pressure/',
    agency: 'NASA',
  },
  'can-space-gardening-help-astronauts-cope-with-isolation': {
    title: 'Can Space Gardening Help Astronauts Cope With Isolation?',
    url: 'https://www.nasa.gov/humans-in-space/can-space-gardening-help-astronauts-cope-with-isolation/',
    agency: 'NASA',
  },
  'canadian-experiments-on-the-international-space-station': {
    title: 'Canadian experiments on the International Space Station',
    url: 'https://www.asc-csa.gc.ca/eng/iss/science/experiments.asp',
    agency: 'CSA',
  },
  cipher: { title: 'CIPHER', url: 'https://www.nasa.gov/reference/cipher/', agency: 'NASA' },
  'enhanced-diet-may-help-astronauts-adapt-to-spaceflight': {
    title: 'Enhanced Diet May Help Astronauts Adapt to Spaceflight',
    url: 'https://www.nasa.gov/missions/station/enhanced-diet-may-help-astronauts-adapt-to-spaceflight/',
    agency: 'NASA',
  },
  'how-does-spaceflight-change-food-appeal': {
    title: 'How Does Spaceflight Change Food Appeal?',
    url: 'https://www.nasa.gov/humans-in-space/how-does-spaceflight-change-food-appeal/',
    agency: 'NASA',
  },
  'human-research-program-omics-archive': {
    title: 'Human Research Program Omics Archive',
    url: 'https://www.nasa.gov/reference/omics-archive/',
    agency: 'NASA',
  },
  'immune-biomarkers': {
    title: 'Immune Biomarkers',
    url: 'https://www.nasa.gov/reference/immune-biomarkers/',
    agency: 'NASA',
  },
  'international-space-station': {
    title: 'International Space Station',
    url: 'https://www.asc-csa.gc.ca/eng/iss/',
    agency: 'CSA',
  },
  'little-transistor-records-radiation-levels': {
    title: 'Little transistor records radiation levels',
    url: 'https://www.asc-csa.gc.ca/eng/iss/evarm.asp',
    agency: 'CSA',
  },
  'monitoring-radiation-for-astronaut-health': {
    title: 'Monitoring radiation for astronaut health',
    url: 'https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp',
    agency: 'CSA',
  },
  'mosfet-radiation-monitoring-system-and-matroshka-r': {
    title: 'MOSFET radiation monitoring system and Matroshka-R',
    url: 'https://www.asc-csa.gc.ca/eng/astronauts/space-medicine/mosfet.asp',
    agency: 'CSA',
  },
  'payload-telescience-operations-centre': {
    title: 'Payload Telescience Operations Centre',
    url: 'https://www.asc-csa.gc.ca/eng/iss/payload-telescience-operations-centre.asp',
    agency: 'CSA',
  },
  'radi-n2-tracking-space-radiation-and-its-risks': {
    title: 'Radi-N2: Tracking space radiation and its risks',
    url: 'https://www.asc-csa.gc.ca/eng/sciences/radi-n2.asp',
    agency: 'CSA',
  },
  'researchers-put-space-garden-microbes-under-the-microscope': {
    title: 'Researchers Put Space Garden Microbes Under the Microscope',
    url: 'https://www.nasa.gov/missions/station/researchers-put-space-garden-microbes-under-the-microscope/',
    agency: 'NASA',
  },
  'risk-from-inadequate-sleep-and-irregular-schedules': {
    title: 'Risk from Inadequate Sleep and Irregular Schedules',
    url: 'https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/',
    agency: 'NASA',
  },
  'risk-of-altered-immune-system-responses': {
    title: 'Risk of Altered Immune System Responses',
    url: 'https://www.nasa.gov/reference/risk-of-altered-immune-system-responses/',
    agency: 'NASA',
  },
  'risk-of-altered-sensorimotor-and-vestibular-function': {
    title: 'Risk of Altered Sensorimotor and Vestibular Function',
    url: 'https://www.nasa.gov/reference/risk-of-altered-sensorimotor-and-vestibular-function/',
    agency: 'NASA',
  },
  'risk-of-behavioral-changes-and-psychiatric-disorders': {
    title: 'Risk of behavioral changes and psychiatric disorders',
    url: 'https://www.nasa.gov/reference/risk-of-behavioral-conditions-and-psychiatric-disorders/',
    agency: 'NASA',
  },
  'risk-of-cardiovascular-adaptations': {
    title: 'Risk of Cardiovascular Adaptations',
    url: 'https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/',
    agency: 'NASA',
  },
  'risk-of-decompression-sickness': {
    title: 'Risk of Decompression Sickness',
    url: 'https://www.nasa.gov/reference/risk-of-decompression-sickness/',
    agency: 'NASA',
  },
  'risk-of-host-microorganism-interactions': {
    title: 'Risk of Host-Microorganism Interactions',
    url: 'https://www.nasa.gov/reference/risk-of-host-microorganism-interactions/',
    agency: 'NASA',
  },
  'risk-of-hypoxia': {
    title: 'Risk of Hypoxia',
    url: 'https://www.nasa.gov/reference/risk-of-hypoxia/',
    agency: 'NASA',
  },
  'risk-of-inadequate-food-and-nutrition': {
    title: 'Risk of Inadequate Food and Nutrition',
    url: 'https://www.nasa.gov/reference/risk-of-inadequate-food-and-nutrition/',
    agency: 'NASA',
  },
  'risk-of-inadequate-systems-operations-support': {
    title: 'Risk of inadequate systems operations support',
    url: 'https://www.nasa.gov/reference/risk-of-inadequate-systems-operations-support/',
    agency: 'NASA',
  },
  'risk-of-inadequate-teamwork': {
    title: 'Risk of inadequate teamwork',
    url: 'https://www.nasa.gov/reference/risk-of-inadequate-teamwork/',
    agency: 'NASA',
  },
  'risk-of-injury-and-compromised-performance-from-spacewalks': {
    title: 'Risk of Injury and Compromised Performance from Spacewalks',
    url: 'https://www.nasa.gov/reference/risk-of-injury-and-compromised-performance-from-extravehicular-activity-eva/',
    agency: 'NASA',
  },
  'risk-of-injury-from-dynamic-loads': {
    title: 'Risk of injury from dynamic loads',
    url: 'https://www.nasa.gov/reference/risk-of-injury-from-dynamic-loads/',
    agency: 'NASA',
  },
  'risk-of-radiation-induced-cancers': {
    title: 'Risk of radiation-induced cancers',
    url: 'https://www.nasa.gov/reference/risk-of-radiation-induced-cancers/',
    agency: 'NASA',
  },
  'risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness': {
    title: 'Risk of Reduced Cardiorespiratory and Musculoskeletal Fitness',
    url: 'https://www.nasa.gov/reference/risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/',
    agency: 'NASA',
  },
  'risk-of-spaceflight-associated-neuro-ocular-syndrome-sans': {
    title: 'Risk of Spaceflight Associated Neuro-ocular Syndrome (SANS)',
    url: 'https://www.nasa.gov/reference/risk-of-spaceflight-associated-neuro-ocular-syndrome-sans/',
    agency: 'NASA',
  },
  'risk-of-spaceflight-induced-bone-changes': {
    title: 'Risk of Spaceflight-Induced Bone Changes',
    url: 'https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/',
    agency: 'NASA',
  },
  'scientists-probe-how-long-term-spaceflight-alters-immunity': {
    title: 'Scientists Probe How Long-Term Spaceflight Alters Immunity',
    url: 'https://www.nasa.gov/missions/station/scientists-probe-how-long-term-spaceflight-alters-immunity/',
    agency: 'NASA',
  },
  'simulating-manual-piloting-for-moon-landings': {
    title: 'Simulating Manual Piloting for Moon Landings',
    url: 'https://www.nasa.gov/reference/simulating-manual-piloting-for-moon-landings/',
    agency: 'NASA',
  },
  'spacecraft-occupant-protection': {
    title: 'Spacecraft Occupant Protection',
    url: 'https://www.nasa.gov/reference/spacecraft-occupant-protection/',
    agency: 'NASA',
  },
  'spinal-fluid-biomarkers': {
    title: 'Spinal Fluid Biomarkers',
    url: 'https://www.nasa.gov/reference/spinal-fluid-biomarkers/',
    agency: 'NASA',
  },
  'standard-measures': {
    title: 'Standard Measures',
    url: 'https://www.nasa.gov/reference/standard-measures/',
    agency: 'NASA',
  },
  'tempus-pro': {
    title: 'Tempus Pro',
    url: 'https://www.nasa.gov/reference/tempus-pro/',
    agency: 'NASA',
  },
  'testing-technologies': {
    title: 'Testing technologies',
    url: 'https://www.asc-csa.gc.ca/eng/iss/testing-technologies.asp',
    agency: 'CSA',
  },
  'thigh-cuff': {
    title: 'Thigh Cuff',
    url: 'https://www.nasa.gov/reference/thigh-cuff/',
    agency: 'NASA',
  },
  'venous-haemostasis': {
    title: 'Venous Haemostasis',
    url: 'https://www.nasa.gov/reference/venous-haemostasis/',
    agency: 'NASA',
  },
  'why-do-we-conduct-science-experiments-in-space': {
    title: 'Why do we conduct science experiments in space?',
    url: 'https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp',
    agency: 'CSA',
  },
  'zero-t2': { title: 'Zero T2', url: 'https://www.nasa.gov/reference/zero-t2/', agency: 'NASA' },
}

/** Sources that are not articles (no public page in the plan) */
export const OTHER_SOURCES: Record<string, ArticleRef> = {
  'challenge-statement': { title: 'NASA Space Apps 2026 challenge statement', agency: 'NASA' },
}
