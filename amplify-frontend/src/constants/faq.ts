export interface FAQItem {
    question: string;
    answer: string;
}

export const FAQS: FAQItem[] = [
    {
        question: "How do I join a campaign?",
        answer:
            "Browse available campaigns from the Discover page and tap Join Campaign. Once enrolled, the campaign will appear under My Campaigns where you can submit your reel.",
    },

    {
        question: "When will my reel be verified?",
        answer:
            "Our moderation team manually reviews every submission. Verification usually takes less than 24 hours after submission.",
    },

    {
        question: "Can I edit my submitted reel?",
        answer:
            "Currently, submitted reel links cannot be edited. If you've submitted the wrong link, please contact support as soon as possible.",
    },

    {
        question: "When do I receive rewards?",
        answer:
            "Rewards are processed after successful verification and once the campaign requirements have been fulfilled.",
    },

    {
        question: "Can I participate in multiple campaigns?",
        answer:
            "Yes. You can participate in multiple campaigns simultaneously provided you satisfy each campaign's eligibility requirements.",
    },

    {
        question: "Why was my submission rejected?",
        answer:
            "Submissions may be rejected if the reel is deleted, made private, uses incorrect audio, contains artificial engagement, or violates campaign guidelines.",
    },

    {
        question: "Can I delete my submission?",
        answer:
            "Once submitted, a reel cannot be removed through the app. Please contact support if you need assistance.",
    },

    {
        question: "What happens if I delete my reel before the campaign ends?",
        answer:
            "Deleting or making your reel private before campaign completion may result in rejection and forfeiture of any rewards.",
    },

    {
        question: "How are views counted?",
        answer:
            "Only genuine public views are considered. Artificial engagement, bots, or purchased views are not counted and may lead to disqualification.",
    },

    {
        question: "Do I receive payments inside the app?",
        answer:
            "No. DoorBeen currently does not provide in-app payment processing. Any rewards are handled outside the application by the campaign organizers.",
    },
];