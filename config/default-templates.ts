import type { TemplateFormData } from "@/lib/types/template";

export interface DefaultTemplate {
  slug: string;
  name: string;
  description: string;
  longDescription: string;
  icon: string;
  category: string;
  formData: TemplateFormData;
}

export const DEFAULT_TEMPLATES: DefaultTemplate[] = [
  // ──────────────────────────────────────────────
  // 1. Customer Satisfaction Survey (FEEDBACK)
  // ──────────────────────────────────────────────
  {
    slug: "customer-satisfaction-survey",
    name: "Customer Satisfaction Survey",
    description: "Measure how satisfied your customers are with your product or service.",
    longDescription:
      "Gather actionable insights about your customers' experience with this comprehensive satisfaction survey. It covers overall ratings, open-ended feedback on strengths and areas for improvement, and a Net Promoter Score to track loyalty over time.",
    icon: "😊",
    category: "FEEDBACK",
    formData: {
      title: "Customer Satisfaction Survey",
      description: "We value your feedback. Please take a moment to share your experience with us.",
      themeColor: "#4F46E5",
      backgroundColor: "#ffffff",
      themeMode: "LIGHT",
      showProgressBar: true,
      questions: [
        {
          type: "WELCOME_SCREEN",
          title: "Welcome to Our Customer Satisfaction Survey",
          description: "Your honest feedback helps us improve. This survey takes about 2 minutes to complete.",
          required: false,
          properties: {
            buttonText: "Get Started",
          },
          logic: [],
        },
        {
          type: "RATING",
          title: "How would you rate your overall experience with us?",
          description: "1 being very poor, 5 being excellent.",
          required: true,
          properties: {
            maxRating: 5,
          },
          logic: [],
        },
        {
          type: "LONG_TEXT",
          title: "What did we do well?",
          description: "Tell us about the highlights of your experience.",
          required: false,
          properties: {
            placeholder: "Share what you enjoyed most...",
          },
          logic: [],
        },
        {
          type: "LONG_TEXT",
          title: "What could we improve?",
          description: "We appreciate constructive feedback to help us get better.",
          required: false,
          properties: {
            placeholder: "Tell us how we can do better...",
          },
          logic: [],
        },
        {
          type: "SCALE",
          title: "How likely are you to recommend us to a friend or colleague?",
          description: null,
          required: true,
          properties: {
            minValue: 0,
            maxValue: 10,
            minLabel: "Not at all likely",
            maxLabel: "Extremely likely",
          },
          logic: [],
        },
        {
          type: "THANK_YOU_SCREEN",
          title: "Thank You for Your Feedback!",
          description: "Your responses help us serve you better. We truly appreciate your time.",
          required: false,
          properties: {},
          logic: [],
        },
      ],
    },
  },

  // ──────────────────────────────────────────────
  // 2. Employee Feedback Form (FEEDBACK)
  // ──────────────────────────────────────────────
  {
    slug: "employee-feedback-form",
    name: "Employee Feedback Form",
    description: "Collect anonymous feedback from employees about their workplace experience.",
    longDescription:
      "Empower your team to share candid feedback about management, work environment, and company culture. This anonymous form helps HR teams identify areas of improvement and track employee sentiment across departments.",
    icon: "👔",
    category: "FEEDBACK",
    formData: {
      title: "Employee Feedback Form",
      description: "Your feedback is anonymous and helps us build a better workplace.",
      themeColor: "#0EA5E9",
      backgroundColor: "#ffffff",
      themeMode: "LIGHT",
      showProgressBar: true,
      questions: [
        {
          type: "WELCOME_SCREEN",
          title: "Employee Feedback Survey",
          description: "All responses are anonymous. Please be honest and constructive in your feedback.",
          required: false,
          properties: {
            buttonText: "Begin Survey",
          },
          logic: [],
        },
        {
          type: "DROPDOWN",
          title: "Which department do you work in?",
          description: null,
          required: true,
          properties: {
            choices: [
              "Engineering",
              "Marketing",
              "Sales",
              "Human Resources",
              "Finance",
              "Operations",
              "Customer Support",
              "Design",
              "Other",
            ],
          },
          logic: [],
        },
        {
          type: "RATING",
          title: "How satisfied are you with your direct manager?",
          description: "Consider communication, support, and leadership.",
          required: true,
          properties: {
            maxRating: 5,
          },
          logic: [],
        },
        {
          type: "RATING",
          title: "How would you rate your work environment?",
          description: "Consider tools, office space, remote work support, and team dynamics.",
          required: true,
          properties: {
            maxRating: 5,
          },
          logic: [],
        },
        {
          type: "LONG_TEXT",
          title: "Do you have any suggestions for improving the workplace?",
          description: "Feel free to share ideas about processes, culture, or anything else.",
          required: false,
          properties: {
            placeholder: "Share your suggestions here...",
          },
          logic: [],
        },
        {
          type: "YES_NO",
          title: "Would you recommend this company as a great place to work?",
          description: null,
          required: true,
          properties: {},
          logic: [],
        },
        {
          type: "THANK_YOU_SCREEN",
          title: "Thank You for Your Feedback!",
          description: "Your input is valuable and will be reviewed by the leadership team.",
          required: false,
          properties: {},
          logic: [],
        },
      ],
    },
  },

  // ──────────────────────────────────────────────
  // 3. Event Registration Form (REGISTRATION)
  // ──────────────────────────────────────────────
  {
    slug: "event-registration-form",
    name: "Event Registration Form",
    description: "Let attendees register for your upcoming event quickly and easily.",
    longDescription:
      "Streamline your event planning with this registration form that captures attendee details, session preferences, and dietary requirements. Perfect for conferences, workshops, meetups, and corporate events of any size.",
    icon: "🎟️",
    category: "REGISTRATION",
    formData: {
      title: "Event Registration",
      description: "Secure your spot at our upcoming event. Fill in your details below.",
      themeColor: "#8B5CF6",
      backgroundColor: "#ffffff",
      themeMode: "LIGHT",
      showProgressBar: true,
      questions: [
        {
          type: "WELCOME_SCREEN",
          title: "Register for Our Event",
          description: "We're excited to have you join us! Registration only takes a minute.",
          required: false,
          properties: {
            buttonText: "Register Now",
          },
          logic: [],
        },
        {
          type: "SHORT_TEXT",
          title: "What is your full name?",
          description: null,
          required: true,
          properties: {
            placeholder: "Enter your full name",
          },
          logic: [],
        },
        {
          type: "EMAIL",
          title: "What is your email address?",
          description: "We'll send your confirmation and event details here.",
          required: true,
          properties: {
            placeholder: "you@example.com",
          },
          logic: [],
        },
        {
          type: "PHONE",
          title: "What is your phone number?",
          description: "For day-of event communications only.",
          required: false,
          properties: {
            placeholder: "+1 (555) 000-0000",
          },
          logic: [],
        },
        {
          type: "MULTIPLE_CHOICE",
          title: "Which session would you like to attend?",
          description: "Select the session that interests you most.",
          required: true,
          properties: {
            choices: [
              "Morning Keynote (9:00 AM)",
              "Workshop A: Getting Started (10:30 AM)",
              "Workshop B: Advanced Topics (10:30 AM)",
              "Afternoon Panel Discussion (2:00 PM)",
              "Networking Session (4:00 PM)",
            ],
            allowMultiple: false,
          },
          logic: [],
        },
        {
          type: "DROPDOWN",
          title: "Do you have any dietary restrictions?",
          description: null,
          required: false,
          properties: {
            choices: [
              "None",
              "Vegetarian",
              "Vegan",
              "Gluten-Free",
              "Halal",
              "Kosher",
              "Nut Allergy",
              "Other",
            ],
          },
          logic: [],
        },
        {
          type: "THANK_YOU_SCREEN",
          title: "You're Registered!",
          description: "Check your email for a confirmation with all the event details. See you there!",
          required: false,
          properties: {},
          logic: [],
        },
      ],
    },
  },

  // ──────────────────────────────────────────────
  // 4. Job Application Form (APPLICATION)
  // ──────────────────────────────────────────────
  {
    slug: "job-application-form",
    name: "Job Application Form",
    description: "Accept job applications with resume uploads and candidate details.",
    longDescription:
      "Simplify your hiring process with this professional job application form. Candidates can provide their contact information, upload a resume and cover letter, and indicate their earliest start date. Ideal for companies of any size looking to standardize their application intake.",
    icon: "💼",
    category: "APPLICATION",
    formData: {
      title: "Job Application",
      description: "Apply for a position at our company. We look forward to learning about you.",
      themeColor: "#059669",
      backgroundColor: "#ffffff",
      themeMode: "LIGHT",
      showProgressBar: true,
      questions: [
        {
          type: "WELCOME_SCREEN",
          title: "Apply to Join Our Team",
          description: "Thank you for your interest! Please complete the following application. It should take about 5 minutes.",
          required: false,
          properties: {
            buttonText: "Start Application",
          },
          logic: [],
        },
        {
          type: "SHORT_TEXT",
          title: "What is your full name?",
          description: null,
          required: true,
          properties: {
            placeholder: "Enter your full name",
          },
          logic: [],
        },
        {
          type: "EMAIL",
          title: "What is your email address?",
          description: "We'll use this to follow up on your application.",
          required: true,
          properties: {
            placeholder: "you@example.com",
          },
          logic: [],
        },
        {
          type: "PHONE",
          title: "What is your phone number?",
          description: null,
          required: true,
          properties: {
            placeholder: "+1 (555) 000-0000",
          },
          logic: [],
        },
        {
          type: "FILE_UPLOAD",
          title: "Please upload your resume",
          description: "Accepted formats: PDF, DOC, DOCX. Maximum size: 10MB.",
          required: true,
          properties: {
            acceptedFileTypes: [".pdf", ".doc", ".docx"],
            maxFileSize: 10,
          },
          logic: [],
        },
        {
          type: "LONG_TEXT",
          title: "Cover Letter",
          description: "Tell us why you're interested in this role and what you would bring to the team.",
          required: false,
          properties: {
            placeholder: "Write your cover letter here...",
          },
          logic: [],
        },
        {
          type: "DATE",
          title: "What is your earliest available start date?",
          description: null,
          required: true,
          properties: {},
          logic: [],
        },
        {
          type: "THANK_YOU_SCREEN",
          title: "Application Submitted!",
          description: "Thank you for applying. Our hiring team will review your application and get back to you within 5-7 business days.",
          required: false,
          properties: {},
          logic: [],
        },
      ],
    },
  },

  // ──────────────────────────────────────────────
  // 5. Contact Us Form (CONTACT)
  // ──────────────────────────────────────────────
  {
    slug: "contact-us-form",
    name: "Contact Us Form",
    description: "A simple form for customers and visitors to get in touch with your team.",
    longDescription:
      "Make it easy for anyone to reach you with this clean and straightforward contact form. It captures the essentials: name, email, subject, and message, so your team can respond promptly and effectively.",
    icon: "📬",
    category: "CONTACT",
    formData: {
      title: "Contact Us",
      description: "Have a question or want to get in touch? Fill out the form below and we'll get back to you shortly.",
      themeColor: "#F59E0B",
      backgroundColor: "#ffffff",
      themeMode: "LIGHT",
      showProgressBar: true,
      questions: [
        {
          type: "WELCOME_SCREEN",
          title: "Get in Touch",
          description: "We'd love to hear from you. Send us a message and we'll respond as soon as possible.",
          required: false,
          properties: {
            buttonText: "Contact Us",
          },
          logic: [],
        },
        {
          type: "SHORT_TEXT",
          title: "What is your name?",
          description: null,
          required: true,
          properties: {
            placeholder: "Enter your full name",
          },
          logic: [],
        },
        {
          type: "EMAIL",
          title: "What is your email address?",
          description: "We'll reply to this address.",
          required: true,
          properties: {
            placeholder: "you@example.com",
          },
          logic: [],
        },
        {
          type: "SHORT_TEXT",
          title: "Subject",
          description: "Briefly describe what your message is about.",
          required: true,
          properties: {
            placeholder: "e.g. Question about pricing",
          },
          logic: [],
        },
        {
          type: "LONG_TEXT",
          title: "Your Message",
          description: null,
          required: true,
          properties: {
            placeholder: "Type your message here...",
          },
          logic: [],
        },
        {
          type: "THANK_YOU_SCREEN",
          title: "Message Sent!",
          description: "Thank you for reaching out. We typically respond within 24 hours.",
          required: false,
          properties: {},
          logic: [],
        },
      ],
    },
  },

  // ──────────────────────────────────────────────
  // 6. Product Order Form (ORDER)
  // ──────────────────────────────────────────────
  {
    slug: "product-order-form",
    name: "Product Order Form",
    description: "Collect product orders with customer details and shipping information.",
    longDescription:
      "Accept product orders through a structured form that captures customer contact info, product selection, quantity, and shipping address. Great for small businesses, pop-up shops, or pre-order campaigns that need a simple ordering flow.",
    icon: "📦",
    category: "ORDER",
    formData: {
      title: "Product Order Form",
      description: "Place your order below. We'll confirm availability and send you a receipt.",
      themeColor: "#EC4899",
      backgroundColor: "#ffffff",
      themeMode: "LIGHT",
      showProgressBar: true,
      questions: [
        {
          type: "WELCOME_SCREEN",
          title: "Place Your Order",
          description: "Browse our products and place your order in just a few steps.",
          required: false,
          properties: {
            buttonText: "Start Order",
          },
          logic: [],
        },
        {
          type: "SHORT_TEXT",
          title: "What is your full name?",
          description: null,
          required: true,
          properties: {
            placeholder: "Enter your full name",
          },
          logic: [],
        },
        {
          type: "EMAIL",
          title: "What is your email address?",
          description: "We'll send your order confirmation here.",
          required: true,
          properties: {
            placeholder: "you@example.com",
          },
          logic: [],
        },
        {
          type: "DROPDOWN",
          title: "Which product would you like to order?",
          description: null,
          required: true,
          properties: {
            choices: [
              "Product A - Basic Plan",
              "Product B - Standard Plan",
              "Product C - Premium Plan",
              "Product D - Enterprise Plan",
            ],
          },
          logic: [],
        },
        {
          type: "NUMBER",
          title: "Quantity",
          description: "How many units would you like to order?",
          required: true,
          properties: {
            placeholder: "1",
            validation: {
              min: 1,
              max: 100,
            },
          },
          logic: [],
        },
        {
          type: "SHORT_TEXT",
          title: "Shipping Address",
          description: "Please provide your full shipping address including city, state, and zip code.",
          required: true,
          properties: {
            placeholder: "123 Main St, City, State, ZIP",
          },
          logic: [],
        },
        {
          type: "THANK_YOU_SCREEN",
          title: "Order Received!",
          description: "Thank you for your order. You'll receive a confirmation email with tracking details shortly.",
          required: false,
          properties: {},
          logic: [],
        },
      ],
    },
  },

  // ──────────────────────────────────────────────
  // 7. Newsletter Signup (LEAD_GENERATION)
  // ──────────────────────────────────────────────
  {
    slug: "newsletter-signup",
    name: "Newsletter Signup",
    description: "Grow your mailing list with a quick and engaging signup form.",
    longDescription:
      "Convert visitors into subscribers with this lightweight newsletter signup form. Capture names, email addresses, and content interests so you can deliver personalized updates. Perfect for blogs, SaaS companies, and media outlets.",
    icon: "📰",
    category: "LEAD_GENERATION",
    formData: {
      title: "Join Our Newsletter",
      description: "Stay up to date with our latest news, tips, and exclusive offers.",
      themeColor: "#6366F1",
      backgroundColor: "#F8FAFC",
      themeMode: "LIGHT",
      showProgressBar: true,
      questions: [
        {
          type: "WELCOME_SCREEN",
          title: "Subscribe to Our Newsletter",
          description: "Get the best content delivered straight to your inbox. No spam, unsubscribe anytime.",
          required: false,
          properties: {
            buttonText: "Subscribe",
          },
          logic: [],
        },
        {
          type: "SHORT_TEXT",
          title: "What is your first name?",
          description: "So we can personalize your emails.",
          required: false,
          properties: {
            placeholder: "Enter your first name",
          },
          logic: [],
        },
        {
          type: "EMAIL",
          title: "What is your email address?",
          description: null,
          required: true,
          properties: {
            placeholder: "you@example.com",
          },
          logic: [],
        },
        {
          type: "MULTIPLE_CHOICE",
          title: "What topics interest you?",
          description: "Select all that apply so we can tailor content for you.",
          required: false,
          properties: {
            choices: [
              "Product Updates",
              "Industry News",
              "Tips & Tutorials",
              "Case Studies",
              "Company Announcements",
            ],
            allowMultiple: true,
          },
          logic: [],
        },
        {
          type: "THANK_YOU_SCREEN",
          title: "You're Subscribed!",
          description: "Welcome aboard! Check your inbox for a confirmation email.",
          required: false,
          properties: {},
          logic: [],
        },
      ],
    },
  },

  // ──────────────────────────────────────────────
  // 8. Course Enrollment Form (EDUCATION)
  // ──────────────────────────────────────────────
  {
    slug: "course-enrollment-form",
    name: "Course Enrollment Form",
    description: "Enroll students into courses with preference and experience tracking.",
    longDescription:
      "Manage course enrollments with this structured form that captures student information, course selection, and prior experience. Whether you run online classes, bootcamps, or in-person training sessions, this template helps you organize your students effectively.",
    icon: "🎓",
    category: "EDUCATION",
    formData: {
      title: "Course Enrollment",
      description: "Enroll in one of our courses. Fill in the details below to secure your spot.",
      themeColor: "#0891B2",
      backgroundColor: "#ffffff",
      themeMode: "LIGHT",
      showProgressBar: true,
      questions: [
        {
          type: "WELCOME_SCREEN",
          title: "Enroll in a Course",
          description: "Take the next step in your learning journey. Enrollment is quick and easy.",
          required: false,
          properties: {
            buttonText: "Enroll Now",
          },
          logic: [],
        },
        {
          type: "SHORT_TEXT",
          title: "What is your full name?",
          description: null,
          required: true,
          properties: {
            placeholder: "Enter your full name",
          },
          logic: [],
        },
        {
          type: "EMAIL",
          title: "What is your email address?",
          description: "Course materials and updates will be sent here.",
          required: true,
          properties: {
            placeholder: "you@example.com",
          },
          logic: [],
        },
        {
          type: "DROPDOWN",
          title: "Which course would you like to enroll in?",
          description: null,
          required: true,
          properties: {
            choices: [
              "Introduction to Programming",
              "Data Science Fundamentals",
              "UX/UI Design Basics",
              "Digital Marketing 101",
              "Project Management Essentials",
              "Advanced Web Development",
            ],
          },
          logic: [],
        },
        {
          type: "DROPDOWN",
          title: "What is your current experience level?",
          description: null,
          required: true,
          properties: {
            choices: [
              "Complete Beginner",
              "Some Experience",
              "Intermediate",
              "Advanced",
            ],
          },
          logic: [],
        },
        {
          type: "LONG_TEXT",
          title: "What are your goals for this course?",
          description: "Knowing your goals helps us tailor the learning experience.",
          required: false,
          properties: {
            placeholder: "Describe what you hope to achieve...",
          },
          logic: [],
        },
        {
          type: "THANK_YOU_SCREEN",
          title: "Enrollment Complete!",
          description: "You're all set. We'll send you course details and next steps via email.",
          required: false,
          properties: {},
          logic: [],
        },
      ],
    },
  },

  // ──────────────────────────────────────────────
  // 9. Patient Intake Form (HEALTHCARE)
  // ──────────────────────────────────────────────
  {
    slug: "patient-intake-form",
    name: "Patient Intake Form",
    description: "Collect essential patient information before their first visit.",
    longDescription:
      "Digitize your patient onboarding process with this intake form that captures personal details, date of birth, contact information, and medical history basics like allergies and current medications. Designed to save time for both patients and healthcare providers.",
    icon: "🏥",
    category: "HEALTHCARE",
    formData: {
      title: "Patient Intake Form",
      description: "Please fill out this form before your appointment so we can serve you better.",
      themeColor: "#10B981",
      backgroundColor: "#ffffff",
      themeMode: "LIGHT",
      showProgressBar: true,
      questions: [
        {
          type: "WELCOME_SCREEN",
          title: "New Patient Intake",
          description: "Welcome! Please complete this form before your first visit. Your information is kept confidential.",
          required: false,
          properties: {
            buttonText: "Begin",
          },
          logic: [],
        },
        {
          type: "SHORT_TEXT",
          title: "What is your full name?",
          description: "As it appears on your ID or insurance card.",
          required: true,
          properties: {
            placeholder: "Enter your full legal name",
          },
          logic: [],
        },
        {
          type: "DATE",
          title: "What is your date of birth?",
          description: null,
          required: true,
          properties: {},
          logic: [],
        },
        {
          type: "EMAIL",
          title: "What is your email address?",
          description: "For appointment reminders and health records access.",
          required: true,
          properties: {
            placeholder: "you@example.com",
          },
          logic: [],
        },
        {
          type: "PHONE",
          title: "What is your phone number?",
          description: "In case we need to reach you about your appointment.",
          required: true,
          properties: {
            placeholder: "+1 (555) 000-0000",
          },
          logic: [],
        },
        {
          type: "LONG_TEXT",
          title: "Do you have any allergies?",
          description: "Please list any known allergies including medications, food, and environmental.",
          required: false,
          properties: {
            placeholder: "e.g. Penicillin, peanuts, pollen...",
          },
          logic: [],
        },
        {
          type: "LONG_TEXT",
          title: "Are you currently taking any medications?",
          description: "Please list all prescription and over-the-counter medications with dosages.",
          required: false,
          properties: {
            placeholder: "e.g. Lisinopril 10mg daily, Vitamin D 1000IU...",
          },
          logic: [],
        },
        {
          type: "THANK_YOU_SCREEN",
          title: "Intake Form Submitted",
          description: "Thank you for completing the form. Our team will review your information before your appointment.",
          required: false,
          properties: {},
          logic: [],
        },
      ],
    },
  },

  // ──────────────────────────────────────────────
  // 10. Bug Report Form (FEEDBACK)
  // ──────────────────────────────────────────────
  {
    slug: "bug-report-form",
    name: "Bug Report Form",
    description: "Help users report software bugs with structured details and screenshots.",
    longDescription:
      "Enable your users to submit detailed bug reports with severity classification, reproduction steps, and screenshot attachments. This structured format helps your development team triage and resolve issues faster.",
    icon: "🐛",
    category: "FEEDBACK",
    formData: {
      title: "Bug Report",
      description: "Found a bug? Help us fix it by providing as much detail as possible.",
      themeColor: "#EF4444",
      backgroundColor: "#ffffff",
      themeMode: "LIGHT",
      showProgressBar: true,
      questions: [
        {
          type: "WELCOME_SCREEN",
          title: "Report a Bug",
          description: "Thank you for helping us improve. A detailed report helps us fix the issue faster.",
          required: false,
          properties: {
            buttonText: "Report Bug",
          },
          logic: [],
        },
        {
          type: "EMAIL",
          title: "What is your email address?",
          description: "So we can follow up when the bug is resolved.",
          required: true,
          properties: {
            placeholder: "you@example.com",
          },
          logic: [],
        },
        {
          type: "DROPDOWN",
          title: "How severe is this bug?",
          description: null,
          required: true,
          properties: {
            choices: ["Critical", "High", "Medium", "Low"],
          },
          logic: [],
        },
        {
          type: "SHORT_TEXT",
          title: "Bug Summary",
          description: "Provide a brief one-line summary of the issue.",
          required: true,
          properties: {
            placeholder: "e.g. Login button unresponsive on mobile",
          },
          logic: [],
        },
        {
          type: "LONG_TEXT",
          title: "Steps to Reproduce",
          description: "List the exact steps to reproduce this bug so our team can investigate.",
          required: true,
          properties: {
            placeholder: "1. Go to...\n2. Click on...\n3. Observe...",
          },
          logic: [],
        },
        {
          type: "FILE_UPLOAD",
          title: "Upload a screenshot or screen recording",
          description: "Visual evidence helps us understand the issue quickly. Accepted formats: PNG, JPG, GIF, MP4.",
          required: false,
          properties: {
            acceptedFileTypes: [".png", ".jpg", ".jpeg", ".gif", ".mp4"],
            maxFileSize: 25,
          },
          logic: [],
        },
        {
          type: "THANK_YOU_SCREEN",
          title: "Bug Report Submitted",
          description: "Thank you for reporting this issue. Our engineering team will investigate and keep you updated.",
          required: false,
          properties: {},
          logic: [],
        },
      ],
    },
  },

  // ──────────────────────────────────────────────
  // 11. Wedding RSVP (REGISTRATION)
  // ──────────────────────────────────────────────
  {
    slug: "wedding-rsvp",
    name: "Wedding RSVP",
    description: "Collect RSVPs for your wedding with guest count and meal preferences.",
    longDescription:
      "Make managing your guest list effortless with this elegant wedding RSVP form. Guests can confirm their attendance, specify the number of additional guests, note dietary restrictions, and even suggest a song for the reception playlist.",
    icon: "💒",
    category: "REGISTRATION",
    formData: {
      title: "Wedding RSVP",
      description: "We're getting married! Please let us know if you can celebrate with us.",
      themeColor: "#D946EF",
      backgroundColor: "#FDF4FF",
      themeMode: "LIGHT",
      showProgressBar: true,
      questions: [
        {
          type: "WELCOME_SCREEN",
          title: "You're Invited!",
          description: "We would be honored to have you at our wedding. Please RSVP by filling out this form.",
          required: false,
          properties: {
            buttonText: "RSVP Now",
          },
          logic: [],
        },
        {
          type: "SHORT_TEXT",
          title: "What is your full name?",
          description: "As it appears on your invitation.",
          required: true,
          properties: {
            placeholder: "Enter your full name",
          },
          logic: [],
        },
        {
          type: "YES_NO",
          title: "Will you be attending?",
          description: null,
          required: true,
          properties: {},
          logic: [],
        },
        {
          type: "NUMBER",
          title: "How many additional guests will you be bringing?",
          description: "Not including yourself.",
          required: false,
          properties: {
            placeholder: "0",
            validation: {
              min: 0,
              max: 5,
            },
          },
          logic: [],
        },
        {
          type: "DROPDOWN",
          title: "Do you have any dietary restrictions?",
          description: null,
          required: false,
          properties: {
            choices: [
              "None",
              "Vegetarian",
              "Vegan",
              "Gluten-Free",
              "Dairy-Free",
              "Nut Allergy",
              "Other",
            ],
          },
          logic: [],
        },
        {
          type: "SHORT_TEXT",
          title: "Any song requests for the reception?",
          description: "Help us build the ultimate playlist!",
          required: false,
          properties: {
            placeholder: "e.g. Dancing Queen by ABBA",
          },
          logic: [],
        },
        {
          type: "THANK_YOU_SCREEN",
          title: "Thank You for Your RSVP!",
          description: "We can't wait to celebrate with you. More details will be sent closer to the date.",
          required: false,
          properties: {},
          logic: [],
        },
      ],
    },
  },

  // ──────────────────────────────────────────────
  // 12. Restaurant Reservation (REGISTRATION)
  // ──────────────────────────────────────────────
  {
    slug: "restaurant-reservation",
    name: "Restaurant Reservation",
    description: "Allow guests to book a table at your restaurant online.",
    longDescription:
      "Let your guests reserve a table with ease using this online booking form. Capture essential reservation details including contact information, preferred date, and party size. A professional way to manage your dining room capacity.",
    icon: "🍽️",
    category: "REGISTRATION",
    formData: {
      title: "Restaurant Reservation",
      description: "Book your table with us. We look forward to serving you.",
      themeColor: "#B45309",
      backgroundColor: "#ffffff",
      themeMode: "LIGHT",
      showProgressBar: true,
      questions: [
        {
          type: "WELCOME_SCREEN",
          title: "Reserve a Table",
          description: "Secure your dining experience by filling in the details below.",
          required: false,
          properties: {
            buttonText: "Book a Table",
          },
          logic: [],
        },
        {
          type: "SHORT_TEXT",
          title: "Name for the reservation",
          description: null,
          required: true,
          properties: {
            placeholder: "Enter the name for the reservation",
          },
          logic: [],
        },
        {
          type: "EMAIL",
          title: "What is your email address?",
          description: "We'll send your reservation confirmation here.",
          required: true,
          properties: {
            placeholder: "you@example.com",
          },
          logic: [],
        },
        {
          type: "PHONE",
          title: "What is your phone number?",
          description: "In case we need to contact you about your reservation.",
          required: true,
          properties: {
            placeholder: "+1 (555) 000-0000",
          },
          logic: [],
        },
        {
          type: "DATE",
          title: "What date would you like to reserve?",
          description: null,
          required: true,
          properties: {},
          logic: [],
        },
        {
          type: "NUMBER",
          title: "Party size",
          description: "How many guests including yourself?",
          required: true,
          properties: {
            placeholder: "2",
            validation: {
              min: 1,
              max: 20,
            },
          },
          logic: [],
        },
        {
          type: "THANK_YOU_SCREEN",
          title: "Reservation Confirmed!",
          description: "Your table is booked. Check your email for the confirmation details. Bon appetit!",
          required: false,
          properties: {},
          logic: [],
        },
      ],
    },
  },

  // ──────────────────────────────────────────────
  // 13. Volunteer Signup (REGISTRATION)
  // ──────────────────────────────────────────────
  {
    slug: "volunteer-signup",
    name: "Volunteer Signup",
    description: "Recruit volunteers by collecting availability and skill information.",
    longDescription:
      "Attract and organize volunteers with this signup form that captures contact details, availability preferences, and relevant skills. Whether you're running a nonprofit, community event, or charitable campaign, this form helps you build a reliable volunteer base.",
    icon: "🤝",
    category: "REGISTRATION",
    formData: {
      title: "Volunteer Signup",
      description: "Join our team of volunteers and make a difference in the community.",
      themeColor: "#16A34A",
      backgroundColor: "#ffffff",
      themeMode: "LIGHT",
      showProgressBar: true,
      questions: [
        {
          type: "WELCOME_SCREEN",
          title: "Become a Volunteer",
          description: "Thank you for your interest in volunteering! Let us know about your availability and skills.",
          required: false,
          properties: {
            buttonText: "Sign Up",
          },
          logic: [],
        },
        {
          type: "SHORT_TEXT",
          title: "What is your full name?",
          description: null,
          required: true,
          properties: {
            placeholder: "Enter your full name",
          },
          logic: [],
        },
        {
          type: "EMAIL",
          title: "What is your email address?",
          description: "We'll send volunteer schedules and updates here.",
          required: true,
          properties: {
            placeholder: "you@example.com",
          },
          logic: [],
        },
        {
          type: "PHONE",
          title: "What is your phone number?",
          description: null,
          required: false,
          properties: {
            placeholder: "+1 (555) 000-0000",
          },
          logic: [],
        },
        {
          type: "MULTIPLE_CHOICE",
          title: "When are you available to volunteer?",
          description: "Select all that apply.",
          required: true,
          properties: {
            choices: ["Weekdays", "Weekends", "Both"],
            allowMultiple: false,
          },
          logic: [],
        },
        {
          type: "LONG_TEXT",
          title: "What skills or experience can you bring?",
          description: "This helps us match you with the right opportunities.",
          required: false,
          properties: {
            placeholder: "e.g. Event planning, first aid certified, bilingual...",
          },
          logic: [],
        },
        {
          type: "THANK_YOU_SCREEN",
          title: "Thank You for Signing Up!",
          description: "Welcome to the team. We'll be in touch soon with volunteer opportunities.",
          required: false,
          properties: {},
          logic: [],
        },
      ],
    },
  },

  // ──────────────────────────────────────────────
  // 14. Exit Interview (HR)
  // ──────────────────────────────────────────────
  {
    slug: "exit-interview",
    name: "Exit Interview",
    description: "Conduct structured exit interviews to understand why employees leave.",
    longDescription:
      "Gain valuable insights from departing employees with this exit interview form. It covers department, tenure, reasons for leaving, satisfaction levels, and open-ended feedback. The data helps HR teams identify retention issues and improve the employee experience.",
    icon: "🚪",
    category: "HR",
    formData: {
      title: "Exit Interview",
      description: "We value your honest feedback as you transition out of the company.",
      themeColor: "#7C3AED",
      backgroundColor: "#ffffff",
      themeMode: "LIGHT",
      showProgressBar: true,
      questions: [
        {
          type: "WELCOME_SCREEN",
          title: "Exit Interview",
          description: "Your candid feedback will help us improve the experience for current and future employees. All responses are confidential.",
          required: false,
          properties: {
            buttonText: "Begin Interview",
          },
          logic: [],
        },
        {
          type: "DROPDOWN",
          title: "Which department did you work in?",
          description: null,
          required: true,
          properties: {
            choices: [
              "Engineering",
              "Marketing",
              "Sales",
              "Human Resources",
              "Finance",
              "Operations",
              "Customer Support",
              "Design",
              "Executive",
              "Other",
            ],
          },
          logic: [],
        },
        {
          type: "DROPDOWN",
          title: "How long were you with the company?",
          description: null,
          required: true,
          properties: {
            choices: [
              "Less than 6 months",
              "6 months - 1 year",
              "1 - 2 years",
              "2 - 5 years",
              "5 - 10 years",
              "More than 10 years",
            ],
          },
          logic: [],
        },
        {
          type: "DROPDOWN",
          title: "What is the primary reason you are leaving?",
          description: null,
          required: true,
          properties: {
            choices: [
              "Better opportunity elsewhere",
              "Compensation and benefits",
              "Work-life balance",
              "Career growth limitations",
              "Management/leadership",
              "Company culture",
              "Relocation",
              "Personal reasons",
              "Other",
            ],
          },
          logic: [],
        },
        {
          type: "RATING",
          title: "How would you rate your overall experience at the company?",
          description: "1 being very poor, 5 being excellent.",
          required: true,
          properties: {
            maxRating: 5,
          },
          logic: [],
        },
        {
          type: "LONG_TEXT",
          title: "Is there anything else you'd like to share with us?",
          description: "Any additional feedback, suggestions, or comments are welcome.",
          required: false,
          properties: {
            placeholder: "Share your thoughts...",
          },
          logic: [],
        },
        {
          type: "YES_NO",
          title: "Would you consider returning to the company in the future?",
          description: null,
          required: true,
          properties: {},
          logic: [],
        },
        {
          type: "THANK_YOU_SCREEN",
          title: "Thank You and Best Wishes",
          description: "We appreciate your honesty and wish you all the best in your next chapter.",
          required: false,
          properties: {},
          logic: [],
        },
      ],
    },
  },

  // ──────────────────────────────────────────────
  // 15. Net Promoter Score (SURVEY)
  // ──────────────────────────────────────────────
  {
    slug: "net-promoter-score",
    name: "Net Promoter Score",
    description: "Measure customer loyalty with the classic NPS survey format.",
    longDescription:
      "Track your Net Promoter Score with this focused, three-question survey. It captures the NPS rating on a 0-10 scale, asks for the reasoning behind the score, and offers a follow-up option. A proven metric used by leading companies worldwide to gauge customer loyalty.",
    icon: "📊",
    category: "SURVEY",
    formData: {
      title: "Net Promoter Score Survey",
      description: "One quick question to help us understand how we're doing.",
      themeColor: "#2563EB",
      backgroundColor: "#ffffff",
      themeMode: "LIGHT",
      showProgressBar: true,
      questions: [
        {
          type: "WELCOME_SCREEN",
          title: "We'd Love Your Feedback",
          description: "This takes less than a minute. Your response helps us improve.",
          required: false,
          properties: {
            buttonText: "Start",
          },
          logic: [],
        },
        {
          type: "SCALE",
          title: "On a scale of 0-10, how likely are you to recommend us to a friend or colleague?",
          description: null,
          required: true,
          properties: {
            minValue: 0,
            maxValue: 10,
            minLabel: "Not at all likely",
            maxLabel: "Extremely likely",
          },
          logic: [],
        },
        {
          type: "LONG_TEXT",
          title: "What is the primary reason for your score?",
          description: "Your feedback helps us understand what we're doing well and where we can improve.",
          required: false,
          properties: {
            placeholder: "Tell us more about your experience...",
          },
          logic: [],
        },
        {
          type: "YES_NO",
          title: "May we follow up with you about your feedback?",
          description: null,
          required: false,
          properties: {},
          logic: [],
        },
        {
          type: "THANK_YOU_SCREEN",
          title: "Thank You!",
          description: "Your feedback is incredibly valuable to us. Thank you for taking the time.",
          required: false,
          properties: {},
          logic: [],
        },
      ],
    },
  },

  // ──────────────────────────────────────────────
  // 16. Market Research Survey (SURVEY)
  // ──────────────────────────────────────────────
  {
    slug: "market-research-survey",
    name: "Market Research Survey",
    description: "Gather market insights about demographics, preferences, and price sensitivity.",
    longDescription:
      "Understand your target market better with this comprehensive research survey. It covers demographics, industry segmentation, product awareness, satisfaction levels, and price sensitivity. Use the insights to inform product development, marketing strategy, and competitive positioning.",
    icon: "🔍",
    category: "SURVEY",
    formData: {
      title: "Market Research Survey",
      description: "Help us understand the market better by sharing your perspective.",
      themeColor: "#0D9488",
      backgroundColor: "#ffffff",
      themeMode: "LIGHT",
      showProgressBar: true,
      questions: [
        {
          type: "WELCOME_SCREEN",
          title: "Market Research Survey",
          description: "Your insights help shape better products and services. This survey takes about 3 minutes.",
          required: false,
          properties: {
            buttonText: "Take the Survey",
          },
          logic: [],
        },
        {
          type: "DROPDOWN",
          title: "What is your age range?",
          description: null,
          required: true,
          properties: {
            choices: [
              "18-24",
              "25-34",
              "35-44",
              "45-54",
              "55-64",
              "65+",
            ],
          },
          logic: [],
        },
        {
          type: "DROPDOWN",
          title: "What industry do you work in?",
          description: null,
          required: true,
          properties: {
            choices: [
              "Technology",
              "Healthcare",
              "Finance & Banking",
              "Education",
              "Retail & E-commerce",
              "Manufacturing",
              "Media & Entertainment",
              "Government",
              "Non-profit",
              "Other",
            ],
          },
          logic: [],
        },
        {
          type: "MULTIPLE_CHOICE",
          title: "Which of the following products are you aware of?",
          description: "Select all that apply.",
          required: true,
          properties: {
            choices: [
              "Product A",
              "Product B",
              "Product C",
              "Product D",
              "None of the above",
            ],
            allowMultiple: true,
          },
          logic: [],
        },
        {
          type: "RATING",
          title: "How satisfied are you with the products currently available in the market?",
          description: "1 being very dissatisfied, 5 being very satisfied.",
          required: true,
          properties: {
            maxRating: 5,
          },
          logic: [],
        },
        {
          type: "SCALE",
          title: "How sensitive are you to price when choosing a product in this category?",
          description: null,
          required: true,
          properties: {
            minValue: 1,
            maxValue: 10,
            minLabel: "Price doesn't matter",
            maxLabel: "Price is the main factor",
          },
          logic: [],
        },
        {
          type: "LONG_TEXT",
          title: "Any additional comments or insights you'd like to share?",
          description: null,
          required: false,
          properties: {
            placeholder: "Share any additional thoughts...",
          },
          logic: [],
        },
        {
          type: "THANK_YOU_SCREEN",
          title: "Thank You for Your Input!",
          description: "Your responses will help us better understand market trends and needs.",
          required: false,
          properties: {},
          logic: [],
        },
      ],
    },
  },

  // ──────────────────────────────────────────────
  // 17. Quiz Template (QUIZ)
  // ──────────────────────────────────────────────
  {
    slug: "quiz-template",
    name: "Quiz Template",
    description: "Create engaging quizzes with multiple question types for fun or education.",
    longDescription:
      "Build interactive quizzes for education, training, or entertainment purposes. This template includes a mix of multiple-choice, yes/no, and dropdown questions to keep participants engaged. Customize the questions to fit any topic or subject area.",
    icon: "❓",
    category: "QUIZ",
    formData: {
      title: "Knowledge Quiz",
      description: "Test your knowledge with this quick quiz. Good luck!",
      themeColor: "#EA580C",
      backgroundColor: "#FFF7ED",
      themeMode: "LIGHT",
      showProgressBar: true,
      questions: [
        {
          type: "WELCOME_SCREEN",
          title: "Ready to Test Your Knowledge?",
          description: "This quiz has 4 questions. Answer to the best of your ability!",
          required: false,
          properties: {
            buttonText: "Start Quiz",
          },
          logic: [],
        },
        {
          type: "SHORT_TEXT",
          title: "What is your name?",
          description: "So we can personalize your results.",
          required: true,
          properties: {
            placeholder: "Enter your name",
          },
          logic: [],
        },
        {
          type: "MULTIPLE_CHOICE",
          title: "Question 1: Which planet is known as the Red Planet?",
          description: null,
          required: true,
          properties: {
            choices: ["Venus", "Mars", "Jupiter", "Saturn"],
            allowMultiple: false,
          },
          logic: [],
        },
        {
          type: "MULTIPLE_CHOICE",
          title: "Question 2: What is the largest ocean on Earth?",
          description: null,
          required: true,
          properties: {
            choices: [
              "Atlantic Ocean",
              "Indian Ocean",
              "Pacific Ocean",
              "Arctic Ocean",
            ],
            allowMultiple: false,
          },
          logic: [],
        },
        {
          type: "YES_NO",
          title: "Question 3: Is the Great Wall of China visible from space with the naked eye?",
          description: null,
          required: true,
          properties: {},
          logic: [],
        },
        {
          type: "DROPDOWN",
          title: "Question 4: In which year did the first moon landing occur?",
          description: null,
          required: true,
          properties: {
            choices: ["1965", "1967", "1969", "1971"],
          },
          logic: [],
        },
        {
          type: "THANK_YOU_SCREEN",
          title: "Quiz Complete!",
          description: "Thanks for taking the quiz. Check back for your results!",
          required: false,
          properties: {},
          logic: [],
        },
      ],
    },
  },

  // ──────────────────────────────────────────────
  // 18. Donation Form (ORDER)
  // ──────────────────────────────────────────────
  {
    slug: "donation-form",
    name: "Donation Form",
    description: "Accept donations with optional recurring contribution options.",
    longDescription:
      "Make it simple for supporters to contribute to your cause with this donation form. Donors provide their contact info, choose a donation amount, and can opt into recurring contributions. Ideal for nonprofits, fundraisers, and charitable organizations.",
    icon: "❤️",
    category: "ORDER",
    formData: {
      title: "Make a Donation",
      description: "Your generosity makes a difference. Every contribution counts.",
      themeColor: "#DC2626",
      backgroundColor: "#ffffff",
      themeMode: "LIGHT",
      showProgressBar: true,
      questions: [
        {
          type: "WELCOME_SCREEN",
          title: "Support Our Mission",
          description: "Thank you for considering a donation. Your contribution directly supports our work in the community.",
          required: false,
          properties: {
            buttonText: "Donate Now",
          },
          logic: [],
        },
        {
          type: "SHORT_TEXT",
          title: "What is your full name?",
          description: "For your donation receipt.",
          required: true,
          properties: {
            placeholder: "Enter your full name",
          },
          logic: [],
        },
        {
          type: "EMAIL",
          title: "What is your email address?",
          description: "We'll send your tax-deductible receipt here.",
          required: true,
          properties: {
            placeholder: "you@example.com",
          },
          logic: [],
        },
        {
          type: "NUMBER",
          title: "Donation Amount ($)",
          description: "Enter the amount you'd like to donate.",
          required: true,
          properties: {
            placeholder: "50",
            validation: {
              min: 1,
            },
          },
          logic: [],
        },
        {
          type: "YES_NO",
          title: "Would you like to make this a recurring monthly donation?",
          description: "Recurring donations provide sustained support for our programs.",
          required: true,
          properties: {},
          logic: [],
        },
        {
          type: "THANK_YOU_SCREEN",
          title: "Thank You for Your Generosity!",
          description: "Your donation makes a real impact. You'll receive a receipt via email shortly.",
          required: false,
          properties: {},
          logic: [],
        },
      ],
    },
  },

  // ──────────────────────────────────────────────
  // 19. Membership Application (APPLICATION)
  // ──────────────────────────────────────────────
  {
    slug: "membership-application",
    name: "Membership Application",
    description: "Process membership applications with tier selection and referral tracking.",
    longDescription:
      "Onboard new members with this application form that captures personal details, preferred membership tier, and referral source. Works for professional associations, clubs, gyms, coworking spaces, or any membership-based organization.",
    icon: "🏅",
    category: "APPLICATION",
    formData: {
      title: "Membership Application",
      description: "Apply to become a member. Fill in your details and choose your membership tier.",
      themeColor: "#CA8A04",
      backgroundColor: "#ffffff",
      themeMode: "LIGHT",
      showProgressBar: true,
      questions: [
        {
          type: "WELCOME_SCREEN",
          title: "Join Our Community",
          description: "Become a member and unlock exclusive benefits, resources, and networking opportunities.",
          required: false,
          properties: {
            buttonText: "Apply Now",
          },
          logic: [],
        },
        {
          type: "SHORT_TEXT",
          title: "What is your full name?",
          description: null,
          required: true,
          properties: {
            placeholder: "Enter your full name",
          },
          logic: [],
        },
        {
          type: "EMAIL",
          title: "What is your email address?",
          description: "Member communications and benefits will be sent here.",
          required: true,
          properties: {
            placeholder: "you@example.com",
          },
          logic: [],
        },
        {
          type: "PHONE",
          title: "What is your phone number?",
          description: null,
          required: false,
          properties: {
            placeholder: "+1 (555) 000-0000",
          },
          logic: [],
        },
        {
          type: "DROPDOWN",
          title: "Which membership tier are you interested in?",
          description: null,
          required: true,
          properties: {
            choices: [
              "Basic - Free",
              "Silver - $9.99/month",
              "Gold - $19.99/month",
              "Platinum - $49.99/month",
            ],
          },
          logic: [],
        },
        {
          type: "SHORT_TEXT",
          title: "How did you hear about us?",
          description: "Referral name, social media, search engine, etc.",
          required: false,
          properties: {
            placeholder: "e.g. Referred by Jane Smith",
          },
          logic: [],
        },
        {
          type: "THANK_YOU_SCREEN",
          title: "Application Received!",
          description: "Thank you for applying. We'll review your application and get back to you within 48 hours.",
          required: false,
          properties: {},
          logic: [],
        },
      ],
    },
  },

  // ──────────────────────────────────────────────
  // 20. Workshop Feedback (FEEDBACK)
  // ──────────────────────────────────────────────
  {
    slug: "workshop-feedback",
    name: "Workshop Feedback",
    description: "Collect post-workshop feedback on content quality, delivery, and experience.",
    longDescription:
      "Improve your workshops and training sessions with targeted feedback from attendees. This form covers overall satisfaction, content quality, presenter effectiveness, and whether attendees would return. Use the insights to refine future sessions and measure your impact.",
    icon: "🎤",
    category: "FEEDBACK",
    formData: {
      title: "Workshop Feedback",
      description: "Help us improve by sharing your thoughts on the workshop you attended.",
      themeColor: "#9333EA",
      backgroundColor: "#ffffff",
      themeMode: "LIGHT",
      showProgressBar: true,
      questions: [
        {
          type: "WELCOME_SCREEN",
          title: "Workshop Feedback Survey",
          description: "Thank you for attending! Your feedback helps us make future workshops even better.",
          required: false,
          properties: {
            buttonText: "Give Feedback",
          },
          logic: [],
        },
        {
          type: "SHORT_TEXT",
          title: "Which workshop did you attend?",
          description: null,
          required: true,
          properties: {
            placeholder: "Enter the workshop name",
          },
          logic: [],
        },
        {
          type: "RATING",
          title: "How would you rate the workshop overall?",
          description: "1 being poor, 5 being excellent.",
          required: true,
          properties: {
            maxRating: 5,
          },
          logic: [],
        },
        {
          type: "RATING",
          title: "How would you rate the quality of the content?",
          description: "Consider relevance, depth, and clarity of the material presented.",
          required: true,
          properties: {
            maxRating: 5,
          },
          logic: [],
        },
        {
          type: "LONG_TEXT",
          title: "Do you have any suggestions or recommendations?",
          description: "What topics would you like covered? How could the format be improved?",
          required: false,
          properties: {
            placeholder: "Share your suggestions...",
          },
          logic: [],
        },
        {
          type: "YES_NO",
          title: "Would you attend another workshop from us?",
          description: null,
          required: true,
          properties: {},
          logic: [],
        },
        {
          type: "THANK_YOU_SCREEN",
          title: "Thank You for Your Feedback!",
          description: "We appreciate your time. Your input directly shapes our upcoming workshops.",
          required: false,
          properties: {},
          logic: [],
        },
      ],
    },
  },
];
