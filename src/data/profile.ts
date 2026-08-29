export interface Education {
  institution: string;
  period: string;
  qualification: string;
  note?: string;
}

export interface Experience {
  role: string;
  organization: string;
  period?: string;
  highlights: string[];
}

export const profile = {
  name: "Dr. Brij Behari Dave",
  title: "Retired Civil Servant",
  tagline: "The World Today — Analysis without Noise",
  bio: "39 years' experience in administration in the State and the Center. Proficiency in International Finance. Retired as a Member of the Postal Services Board with 33 years in Central Service Group 'A' and 6 years in State Forest Service.",
  phone: "9414060441",
  email: "bbdave100@outlook.com",
  website: "https://bb4dave.wordpress.com",
  hobbies: ["Gardening", "Travelling", "Writing", "Listening to Music"],
  education: [
    {
      institution: "University of Jodhpur, Jodhpur",
      period: "1979–1980",
      qualification: "Master of Science (Organic Chemistry)",
    },
    {
      institution: "Forest Research Institute, Dehradun",
      period: "1981–1983",
      qualification: "PG Diploma in Forestry",
      note: "Silver Medal in Silviculture",
    },
    {
      institution: "Indian Institute of Management, Bangalore",
      period: "2004–2006",
      qualification: "PG Diploma in Management and Public Policy",
    },
    {
      institution: "Sardar Patel University, Anand",
      period: "2018",
      qualification: "Doctor of Philosophy",
    },
  ] satisfies Education[],
  experience: [
    {
      role: "Member, Postal Services Board",
      organization: "Indian Postal Service",
      period: "Retired",
      highlights: [
        "33 years of experience in Central Service Group 'A'",
        "6 years in State Forest Service",
        "Joined Indian Postal Service in 1986",
      ],
    },
  ] satisfies Experience[],
  skills: [
    "Microsoft Insider for Windows and Microsoft Office since 2014",
    "Research presentations at IIM Indore, management colleges in Guwahati, and Sardar Patel University, Anand",
    "Research papers published in National and International Journals",
    "International Finance",
    "Public administration and policy",
  ],
  researchStats: {
    affiliation: "NIL",
    researchGrant: "NIL",
  },
};
