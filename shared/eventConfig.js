/**
 * @file eventConfig.js
 * @description Centralized Single Source of Truth for DECEPTION Event Rules & Settings
 */

export const EVENT_CONFIG = {
  name: "DECEPTION",
  slug: "deception",
  status: "ACTIVE",
  tagline: "ONE OF YOU ISN'T WHO THEY SEEM..",
  warningQuote: "TRUST NO ONE",
  organizer: "AI DEVELOPERS GROUP (ADG)",
  collaboration: "ADG x Mosaic",
  eventDateDisplay: "16, 17 OCT 2026",
  startDate: "2026-10-16",
  endDate: "2026-10-17",
  venue: "Room 028",
  college: "St. Francis Institute of Technology (SFIT)",
  
  teamConfig: {
    minPlayers: 5,
    maxPlayers: 6
  },

  participantConfig: {
    requireCollegeEmail: true,
    collegeEmailDomain: "@student.sfit.ac.in",
    requireCollegeId: true,
    branches: [ "AIML", "CMPN", "INFT", "EXTC", "ELEC", "MECH", "ECS", "OTHER"],
    years: ["FE", "SE", "TE", "BE"]
  },

  registrationConfig: {
    allowMultipleTeams: true,
    registrationOpen: true,
    // DEFAULTS ONLY. The live values come from PER_HEAD_AMOUNT / CURRENCY in .env and
    // are substituted by the server before this config reaches the browser, so the fee
    // never has to be changed in more than one place.
    perHeadAmount: 100,
    currency: "INR"
  },

  fourPillars: [
    {
      id: "tasks",
      number: "01",
      title: "COMPLETE YOUR TASKS",
      subtitle: "Execute Objectives",
      description: "Work across tech labs and stations in Room 028 completing tasks before time expires.",
      color: "#E5005A", // Magenta
      icon: "Search"
    },
    {
      id: "watch",
      number: "02",
      title: "WATCH THE OTHERS",
      subtitle: "Observe Behavior",
      description: "Track player movements, monitor stations, and note who lingers where without doing work.",
      color: "#F4C430", // Yellow
      icon: "Eye"
    },
    {
      id: "suspect",
      number: "03",
      title: "FIND OUT THE SUSPICIOUS PLAYER",
      subtitle: "Uncover Deception",
      description: "Identify anomalies in task reports, false alibis, and subtle sabotage clues.",
      color: "#00AFC6", // Cyan
      icon: "UserX"
    },
    {
      id: "vote",
      number: "04",
      title: "VOTE BEFORE THE IMPOSTER WINS",
      subtitle: "Emergency Meeting",
      description: "Gather round the meeting desk, debate the evidence, and cast your decisive team vote.",
      color: "#4CAF50", // Green
      icon: "Vote"
    }
  ],

  rules: [
    {
      category: "Team Composition",
      rule: "Teams must register with strictly 5 or 6 participants."
    },
    {
      category: "Eligibility & Email Verification",
      rule: "All student participants from SFIT must register with their official college email ending in @student.sfit.ac.in."
    },
    {
      category: "College ID Verification",
      rule: "Valid college identity cards must be uploaded during registration and physically presented at Room 028 desk on event day."
    },
    {
      category: "Game Mechanics & Fair Play",
      rule: "Assigned roles (Crew vs Imposter) are strictly secret. Communicating role identity outside emergency meetings results in immediate team disqualification."
    },
    {
      category: "Emergency Meetings",
      rule: "Each team gets limited emergency meetings per match round. Once called, all physical movement freezes and discussion commences."
    },
    {
      category: "Registration Fee & Confirmation",
      rule: "Registration fee is {{CURRENCY}} {{PER_HEAD}} per participant, so a squad of 5 pays {{TEAM_5}} and a squad of 6 pays {{TEAM_6}}. Members may pay individually or one person may pay for the whole squad. The entrance pass with verification QR is issued only once the full squad amount is confirmed."
    }
  ],

  faqs: [
    {
      q: "Who can participate in DECEPTION?",
      a: "All engineering and technology students from SFIT and other colleges are eligible to participate. One team leader must register on behalf of a squad consisting of 5 to 6 players."
    },
    {
      q: "How many players are strictly required per team?",
      a: "Each team must consist of exactly 5 or 6 players, including one team leader who will serve as the single point of contact and register on behalf of the entire team."
    },
    {
      q: "What email format is required for registration?",
      a: "SFIT participants must use their official college email address ending in `@student.sfit.ac.in`. Non-SFIT participants may use any valid email address for registration."
    },
    {
      q: "What documents must be uploaded?",
      a: "A clear photo or scan of each player's college ID card is required to prevent proxy participation and verify student status."
    },
    {
      q: "How does payment work?",
      a: "After filling team details and player cards, you proceed to payment. The fee is {{CURRENCY}} {{PER_HEAD}} per participant ({{TEAM_5}} for a squad of 5, {{TEAM_6}} for a squad of 6). Pay by UPI, then submit your UTR reference and the amount you paid. Each member who pays should submit their own reference."
    },
    {
      q: "When will I receive our team ticket and QR pass?",
      a: "As soon as payment status becomes PAID (instant for online payment or upon admin approval for manual UPI), your ticket PDF with entry QR code and receipt will be generated and emailed to the team leader."
    },
    {
      q: "Where and when is the event happening?",
      a: "DECEPTION takes place on 16th and 17th October 2026 at St. Francis Institute of Technology (SFIT), Room 028."
    }
  ]
};

export default EVENT_CONFIG;
