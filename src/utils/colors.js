
const colors = {
    // ------------------------------------------------------------------
    // Black & gold theme (current site design). The groups further down
    // are the previous navy/lime palette, kept only for legacy components.
    // ------------------------------------------------------------------
    gold: {
        light: "#F7DE83",
        base: "#D9A93A",
        deep: "#A8741A",
    },

    theme: {
        bg: "#07070A", // page background
        bgDeep: "#050507", // footer
        ink: "#F6F1E4", // primary text (warm cream)
        muted: "#A9A496", // secondary text
        faint: "#6F6B60", // credits / fine print
        line: "rgba(246, 241, 228, 0.12)", // hairlines and borders
        glass: "rgba(18, 18, 22, 0.72)", // frosted cards
        surface: "#0D0D12", // phone body
        surfaceRaised: "#1D1D26", // phone cards
        phoneBorder: "#2A2A33",
        onGold: "#1A1303", // text on gold buttons
        success: "#6FE39A",
        toggle: "#35C46A",
    },

    // 3D scooter materials and studio lighting
    scooter: {
        body: "#E6D7B4", // cream pearl paint
        trim: "#D9A93A", // gold chrome
        rubber: "#141417",
        spoke: "#0B0B0E",
        lamp: "#FFF4D0",
        lampGlow: "#FFE29A",
    },
    light: {
        key: "#FFF1D6",
        rim: "#FFC45A",
        under: "#FFB83D",
        ambient: "#FFFFFF",
    },

    // Brand Colors (legacy)
    brand: {
        navy: "#071B2D",
        navyDark: "#041322",
        navyLight: "#102B43",
        lime: "#B9F34A",
        limeBright: "#C7F36B",
        limeDark: "#8FCB2F",
        cyan: "#5EE3F2", // secondary glow accent (intro particles)
    },

    // Background Colors
    background: {
        default: "#FFFFFF",
        subtle: "#F7F9FB",
        section: "#F1F5F8",
        dark: "#071B2D",
        darkAlt: "#0B2237",
    },

    // Text Colors
    text: {
        primary: "#101828",
        secondary: "#475467",
        muted: "#667085",
        inverse: "#FFFFFF",
        onLime: "#101828",
        link: "#087443",
    },

    // Button Colors
    button: {
        primary: "#B9F34A",
        primaryHover: "#A8E536",
        primaryActive: "#8FCB2F",
        secondary: "#071B2D",
        secondaryHover: "#102B43",
        disabled: "#D0D5DD",
    },

    // Border Colors
    border: {
        default: "#E4E7EC",
        strong: "#D0D5DD",
        focus: "#8FCB2F",
        dark: "#243B50",
    },

    // Vehicle Cards
    card: {
        background: "#FFFFFF",
        imageBackground: "#F1F5F8",
        shadow: "rgba(7, 27, 45, 0.08)",
    },

    // Vehicle Badges
    badge: {
        popularBackground: "#C7F36B",
        popularText: "#101828",
        premiumBackground: "#E8EDF2",
        premiumText: "#344054",
        electricBackground: "#DDF7E5",
        electricText: "#166534",
    },

    // Status Colors
    status: {
        success: "#15803D",
        successBackground: "#DCFCE7",
        warning: "#B45309",
        warningBackground: "#FEF3C7",
        error: "#B42318",
        errorBackground: "#FEE4E2",
        info: "#175CD3",
        infoBackground: "#D1E9FF",
    },

    // Footer Colors
    footer: {
        background: "#041322",
        heading: "#FFFFFF",
        text: "#D0D5DD",
        link: "#EAECF0",
    },

    // Hero Image Overlays
    overlay: {
        dark: "rgba(4, 19, 34, 0.72)",
        medium: "rgba(7, 27, 45, 0.45)",
    },
};

export default colors;
