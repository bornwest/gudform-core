import { QuestionType } from "@prisma/client";

export interface FormComponentField {
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  properties: Record<string, any>;
}

export interface FormComponent {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  category: string;
  fields: FormComponentField[];
}

const COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "Germany",
  "France",
  "Japan",
  "Brazil",
  "India",
  "Mexico",
  "Spain",
  "Italy",
  "Netherlands",
  "Sweden",
  "Switzerland",
  "South Korea",
  "Singapore",
  "New Zealand",
  "Ireland",
  "Portugal",
  "Norway",
  "Denmark",
  "Finland",
  "Belgium",
  "Austria",
  "Poland",
  "Czech Republic",
  "South Africa",
  "Argentina",
  "Chile",
  "Colombia",
  "Philippines",
  "Thailand",
  "Malaysia",
  "Indonesia",
  "Vietnam",
  "Nigeria",
  "Kenya",
  "Egypt",
  "Other",
];

export const FORM_COMPONENTS: FormComponent[] = [
  {
    id: "contact-details",
    name: "Contact Details",
    description: "Name, email, and phone number",
    icon: "contact",
    category: "Contact",
    fields: [
      {
        type: QuestionType.SHORT_TEXT,
        title: "Full Name",
        required: true,
        properties: { placeholder: "John Doe" },
      },
      {
        type: QuestionType.EMAIL,
        title: "Email Address",
        required: true,
        properties: { placeholder: "john@example.com" },
      },
      {
        type: QuestionType.PHONE,
        title: "Phone Number",
        required: false,
        properties: { placeholder: "+1 (555) 123-4567" },
      },
    ],
  },
  {
    id: "billing-address",
    name: "Billing Address",
    description: "Full billing address with country",
    icon: "creditCard",
    category: "Address",
    fields: [
      {
        type: QuestionType.SHORT_TEXT,
        title: "Street Address",
        required: true,
        properties: { placeholder: "123 Main St" },
      },
      {
        type: QuestionType.SHORT_TEXT,
        title: "City",
        required: true,
        properties: { placeholder: "New York" },
      },
      {
        type: QuestionType.SHORT_TEXT,
        title: "State / Province",
        required: true,
        properties: { placeholder: "NY" },
      },
      {
        type: QuestionType.SHORT_TEXT,
        title: "Zip / Postal Code",
        required: true,
        properties: { placeholder: "10001" },
      },
      {
        type: QuestionType.DROPDOWN,
        title: "Country",
        required: true,
        properties: { choices: COUNTRIES },
      },
    ],
  },
  {
    id: "shipping-address",
    name: "Shipping Address",
    description: "Full shipping address with country",
    icon: "truck",
    category: "Address",
    fields: [
      {
        type: QuestionType.SHORT_TEXT,
        title: "Shipping Street Address",
        required: true,
        properties: { placeholder: "123 Main St" },
      },
      {
        type: QuestionType.SHORT_TEXT,
        title: "Shipping City",
        required: true,
        properties: { placeholder: "New York" },
      },
      {
        type: QuestionType.SHORT_TEXT,
        title: "Shipping State / Province",
        required: true,
        properties: { placeholder: "NY" },
      },
      {
        type: QuestionType.SHORT_TEXT,
        title: "Shipping Zip / Postal Code",
        required: true,
        properties: { placeholder: "10001" },
      },
      {
        type: QuestionType.DROPDOWN,
        title: "Shipping Country",
        required: true,
        properties: { choices: COUNTRIES },
      },
    ],
  },
  {
    id: "personal-info",
    name: "Personal Info",
    description: "Name, date of birth, and gender",
    icon: "user",
    category: "Personal",
    fields: [
      {
        type: QuestionType.SHORT_TEXT,
        title: "Full Name",
        required: true,
        properties: { placeholder: "Jane Smith" },
      },
      {
        type: QuestionType.DATE,
        title: "Date of Birth",
        required: true,
        properties: {},
      },
      {
        type: QuestionType.DROPDOWN,
        title: "Gender",
        required: false,
        properties: {
          choices: ["Male", "Female", "Non-binary", "Prefer not to say"],
        },
      },
    ],
  },
  {
    id: "company-info",
    name: "Company Info",
    description: "Company name, job title, size, and industry",
    icon: "building",
    category: "Business",
    fields: [
      {
        type: QuestionType.SHORT_TEXT,
        title: "Company Name",
        required: true,
        properties: { placeholder: "Acme Inc." },
      },
      {
        type: QuestionType.SHORT_TEXT,
        title: "Job Title",
        required: false,
        properties: { placeholder: "Product Manager" },
      },
      {
        type: QuestionType.DROPDOWN,
        title: "Company Size",
        required: false,
        properties: {
          choices: [
            "1-10 employees",
            "11-50 employees",
            "51-200 employees",
            "201-1000 employees",
            "1000+ employees",
          ],
        },
      },
      {
        type: QuestionType.DROPDOWN,
        title: "Industry",
        required: false,
        properties: {
          choices: [
            "Technology",
            "Healthcare",
            "Finance",
            "Education",
            "Retail",
            "Manufacturing",
            "Marketing",
            "Consulting",
            "Non-profit",
            "Government",
            "Other",
          ],
        },
      },
    ],
  },
  {
    id: "social-profiles",
    name: "Social Profiles",
    description: "LinkedIn, Twitter/X, and website URLs",
    icon: "share2",
    category: "Contact",
    fields: [
      {
        type: QuestionType.SHORT_TEXT,
        title: "LinkedIn URL",
        required: false,
        properties: { placeholder: "https://linkedin.com/in/yourprofile" },
      },
      {
        type: QuestionType.SHORT_TEXT,
        title: "Twitter / X Handle",
        required: false,
        properties: { placeholder: "@yourhandle" },
      },
      {
        type: QuestionType.SHORT_TEXT,
        title: "Website",
        required: false,
        properties: { placeholder: "https://yourwebsite.com", format: "url" },
      },
    ],
  },
  {
    id: "event-registration",
    name: "Event Registration",
    description: "Name, email, dietary needs, and t-shirt size",
    icon: "calendar",
    category: "Personal",
    fields: [
      {
        type: QuestionType.SHORT_TEXT,
        title: "Full Name",
        required: true,
        properties: { placeholder: "Your full name" },
      },
      {
        type: QuestionType.EMAIL,
        title: "Email Address",
        required: true,
        properties: { placeholder: "you@example.com" },
      },
      {
        type: QuestionType.DROPDOWN,
        title: "Dietary Restrictions",
        required: false,
        properties: {
          choices: [
            "None",
            "Vegetarian",
            "Vegan",
            "Gluten-free",
            "Kosher",
            "Halal",
            "Other",
          ],
        },
      },
      {
        type: QuestionType.DROPDOWN,
        title: "T-Shirt Size",
        required: false,
        properties: {
          choices: ["XS", "S", "M", "L", "XL", "XXL"],
        },
      },
    ],
  },
  {
    id: "feedback-block",
    name: "Feedback Block",
    description: "Rating, open-ended feedback, and recommendation",
    icon: "messageCircle",
    category: "Feedback",
    fields: [
      {
        type: QuestionType.RATING,
        title: "Overall Rating",
        description: "How would you rate your experience?",
        required: true,
        properties: { maxRating: 5 },
      },
      {
        type: QuestionType.LONG_TEXT,
        title: "What went well?",
        required: false,
        properties: { placeholder: "Tell us what you enjoyed..." },
      },
      {
        type: QuestionType.LONG_TEXT,
        title: "What could improve?",
        required: false,
        properties: { placeholder: "Share your suggestions..." },
      },
      {
        type: QuestionType.YES_NO,
        title: "Would you recommend us to others?",
        required: true,
        properties: {},
      },
    ],
  },
  {
    id: "consent-agreements",
    name: "Consent & Agreements",
    description: "Terms, privacy policy, and marketing opt-in",
    icon: "shieldCheck",
    category: "Business",
    fields: [
      {
        type: QuestionType.YES_NO,
        title: "I agree to the Terms & Conditions",
        required: true,
        properties: {},
      },
      {
        type: QuestionType.YES_NO,
        title: "I agree to the Privacy Policy",
        required: true,
        properties: {},
      },
      {
        type: QuestionType.YES_NO,
        title: "I would like to receive marketing emails",
        required: false,
        properties: {},
      },
    ],
  },
];
