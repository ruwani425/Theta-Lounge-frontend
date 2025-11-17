import React, { useState } from "react";
import {
  Flower,
  Star,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  Award,
  DollarSign,
  Clock,
  HeartHandshake,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Quote, // New icon for Testimonials
} from "lucide-react";

// --- Data Structures ---

// Mock data for the services section
const servicesData = [
  {
    title: "Swedish Massage",
    description:
      "Gentle, full-body massage that relaxes muscles and reduces stress.",
    // 💡 Image URL is pulled from the servicesData mock array
    image: "/GettyImages-2222455931-683x1024.jpg",
  },
  {
    title: "Deep Tissue",
    description:
      "Focused pressure to release deep tension and chronic muscle pain.",
    image: "/GettyImages-2222455863.webp",
  },
  {
    title: "Medical Massage",
    description:
      "Targeted therapy to support recovery from injuries or conditions.",
    image: "/GettyImages-2210243626.webp",
  },
  {
    title: "SPA Massage",
    description:
      "A soothing, sensory massage for total relaxation and self-care.",
    image: "/pexels-arina-krasnikova-6663372.webp",
  },
];

// Mock data for the massage benefits/FAQ section
const benefitsData = [
  {
    id: 1,
    title: "Relieves Muscle Tension",
    content: "Helps release tight muscles and restore natural mobility.",
    isDefaultOpen: true,
  },
  {
    id: 2,
    title: "Boosts Circulation",
    content:
      "Improves blood flow, aiding in recovery and delivering vital nutrients.",
  },
  {
    id: 3,
    title: "Reduces Stress & Anxiety",
    content:
      "Calms the nervous system, promoting a sense of peace and well-being.",
  },
  {
    id: 4,
    title: "Eases Chronic Pain",
    content:
      "Provides natural pain relief by addressing underlying muscular and joint issues.",
  },
  {
    id: 5,
    title: "Improves Sleep Quality",
    content:
      "Relaxation techniques help regulate sleep cycles, leading to deeper rest.",
  },
];

// Mock data for the testimonials section (images not used here, only text)
const testimonialsData = [
  {
    name: "Rebecca Lorenna",
    quote:
      "This place is peaceful, clean, and the energy is amazing. I felt relaxed the moment I arrived. Highly recommend to anyone needing real stress relief.",
  },
  {
    name: "Marcus Leroy",
    quote:
      "I've been to many massage studios, but this one stands out. You're not just a name on a schedule—you're treated with respect and genuine care.",
  },
  {
    name: "Maya Sanches",
    quote:
      "I look forward to my massage every week—it's the only time I truly disconnect and reset. The therapists are intuitive and professional. This place is magic.",
  },
];

// Mock data for the blog section
const blogData = [
  {
    category: "SPA",
    title: "A Healthy and Balanced Spa Experience for your Whole Body",
    image: "/GettyImages-489204244-801x1024.jpg",
  },
  {
    category: "MASSAGE THERAPY",
    title: "The Healing Power of Pregnancy Massage",
    image: "/GettyImages-200112735-001-801x1024.jpg",
  },
  {
    category: "MASSAGE",
    title: "Different Strokes for Different Folks: Customize Your Massage",
    image: "/GettyImages-1357320863-1-801x1024.jpg",
  },
];

// --- Sub Components ---

/**
 * Accordion item component for the Benefits section
 */
const BenefitAccordion: React.FC<{
  title: string;
  content: string;
  isOpen: boolean;
  setOpen: (id: number) => void;
  id: number;
}> = ({ title, content, isOpen, setOpen, id }) => (
  <div className="border-b border-light-blue-200">
    <button
      className="flex justify-between items-center w-full py-4 text-left font-semibold text-xl text-gray-800 hover:text-dark-blue-600 transition duration-150"
      onClick={() => setOpen(id)}
    >
      <span>{title}</span>
      {isOpen ? (
        <ChevronUp className="h-5 w-5 text-dark-blue-600" />
      ) : (
        <ChevronDown className="h-5 w-5 text-gray-400" />
      )}
    </button>
    {isOpen && (
      <div className="pb-4 text-gray-600">
        <p>{content}</p>
      </div>
    )}
  </div>
);

/**
 * Header and Navigation Component
 */
const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 w-full bg-white bg-opacity-95 shadow-lg z-50 backdrop-blur-sm">
      {/* Container is now max-w-7xl mx-auto to match the intended content width */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        {/* Logo Section */}
        <div className="flex items-center space-x-2 text-xl font-serif text-gray-800">
          <Flower className="w-6 h-6 text-dark-blue-600" />
          <span className="font-bold tracking-wider">Flexora</span>
          <span className="text-sm text-gray-500 ml-4 hidden sm:inline">
            Physical Therapy
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="hidden lg:flex space-x-8 text-gray-600 font-medium">
          {["Home", "About", "Services", "Reviews", "Blog", "Contact us"].map(
            (item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                className="hover:text-dark-blue-600 transition duration-150"
              >
                {item}
              </a>
            )
          )}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          <button className="flex items-center justify-center p-2 rounded-full border border-gray-300 hover:bg-light-blue-100 transition duration-150">
            {/* 💡 Reverted star color to yellow-500 */}
            <Star className="w-5 h-5 text-yellow-500" />
          </button>
          <button className="flex items-center px-4 py-2 bg-dark-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-dark-blue-700 transition duration-300">
            <CalendarCheck className="w-5 h-5 mr-2" />
            Appointment
          </button>
          {/* Changed 'Buy now' button color from indigo-600 */}
          <button className="hidden sm:inline px-4 py-2 bg-dark-blue-600 text-white font-semibold rounded-full hover:bg-dark-blue-700 transition duration-300">
            Buy now
          </button>
        </div>
      </div>
    </header>
  );
};

/**
 * Hero Section
 */
const Hero: React.FC = () => {
  // 💡 Using a representative path relative to the public root folder
  const heroVideoUrl =
    "/pexels.com_video_woman-doing-a-back-massage-6628400.webm";
  const isPlaceholder = heroVideoUrl.includes("YOUR_");

  return (
    <section
      id="home"
      className="pt-24 min-h-[80vh] relative overflow-hidden flex justify-center items-center"
    >
      {/* Background Media Container (full width) */}
      <div className="absolute z-0 w-full h-full inset-0">
        {/* 💡 Background Video Element */}
        {!isPlaceholder && (
          <video
            autoPlay
            loop
            muted
            className="w-full h-full object-cover"
            // Fallback source is included for browser compatibility
          >
            <source src={heroVideoUrl} type="video/mp4" />
          </video>
        )}

        {/* Background Image Fallback or Placeholder */}
        <div
          className={`w-full h-full object-cover ${
            isPlaceholder ? "bg-cover bg-center" : ""
          }`}
          style={{
            // 💡 If no actual video URL is provided, replace this static image URL
            backgroundImage: isPlaceholder
              ? `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.2)), url('YOUR_HERO_STATIC_IMAGE_URL')`
              : "none",
          }}
        ></div>
      </div>

      {/* Dark Overlay for better text readability */}
      <div className="absolute z-10 inset-0 bg-black opacity-30"></div>

      {/* Content Container (max-w-7xl mx-auto for centering/fixed width) */}
      <div className="relative z-20 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-20 flex flex-col justify-center h-full">
        {/* === START OF REVERTED CONTENT === */}
        <div className="max-w-xl p-6">
          <h1 className="text-6xl font-serif font-bold text-white leading-tight mb-4">
            Massage for Your Body & Mind
          </h1>
          <p className="text-lg text-gray-200 mb-8">
            Make it a weekly ritual – relax, recharge, recover.
          </p>
          <button className="flex items-center px-6 py-3 bg-white text-dark-blue-600 font-semibold rounded-full shadow-xl hover:bg-gray-100 transition duration-300 transform hover:scale-105">
            <CalendarCheck className="w-5 h-5 mr-2" />
            Book Appointment
          </button>
          <div className="mt-8">
            <p className="text-sm text-gray-200">
              {/* 💡 Reverted star rating text color to yellow-500 */}
              <span className="text-yellow-500 text-xl">★★★★★</span> TRUSTED BY
              1000+ PATIENTS
            </p>
          </div>
        </div>

        {/* Footer/Strapline section visible in the screenshot, ensuring alignment */}
        <div className="absolute bottom-0 left-0 right-0 py-4 px-4 sm:px-6 lg:px-8 bg-black bg-opacity-30 text-white backdrop-blur-sm">
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm font-medium">
            <p>Reduced Pain</p>
            <p>Improved Circulation</p>
            <p>Reduced Stress</p>
            <p>Enhances Overall Well-being</p>
          </div>
        </div>
        {/* === END OF REVERTED CONTENT === */}
      </div>
    </section>
  );
};

/**
 * About Us Section with Image and Text Split
 */
const AboutUs: React.FC = () => {
  // 💡 Your custom image URL for the central subject image
  const centerImageUrl = "/GettyImages-1322320699-1.jpg";

  // 💡 Your custom URL for the subtle background pattern
  const backgroundPattern = "/pattern_bg.jpg";
  const hasPattern = backgroundPattern.includes("YOUR_") === false;

  return (
    <section
      id="about"
      className="py-20 relative bg-light-blue-50"
      style={{
        // Apply background pattern if available
        backgroundImage: hasPattern ? `url(${backgroundPattern})` : "none",
        backgroundSize: "cover",
      }}
    >
      {/* Container is max-w-7xl mx-auto to contain the content width */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Text Column */}
          <div className="lg:col-span-1 space-y-8 py-8">
            <div className="space-y-4">
              <div className="flex items-center">
                <Flower className="w-5 h-5 text-dark-blue-600 mr-2" />
                <span className="text-sm tracking-widest uppercase text-dark-blue-600 font-semibold">
                  16+ Years of Experience
                </span>
              </div>
              <div className="border-l-4 border-dark-blue-600 pl-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  Skilled, Caring Therapists
                </h3>
                <p className="text-gray-600">
                  Our licensed professionals bring years of experience and a
                  deep understanding of bodywork and wellness.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <Flower className="w-5 h-5 text-dark-blue-600 mr-2" />
                <span className="text-sm tracking-widest uppercase text-dark-blue-600 font-semibold">
                  Evening & Weekend Availability
                </span>
              </div>
              <div className="border-l-4 border-dark-blue-600 pl-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  Inspired by Nature
                </h3>
                <p className="text-gray-600">
                  We use gentle techniques, natural oils, and calming touch to
                  help you feel restored and balanced.
                </p>
              </div>
            </div>
          </div>

          {/* Center Image Column - Complex rounded shape */}
          <div className="lg:col-span-1 flex justify-center relative">
            <div className="relative w-full max-w-sm h-[600px] sm:max-w-md lg:max-w-none lg:w-[400px] mx-auto">
              {/* Background Arch/Shape Container */}
              <div
                className="absolute inset-0 z-0 rounded-t-[50%] rounded-b-xl transform -translate-y-4 shadow-2xl overflow-hidden"
                style={{ backgroundColor: "#E6F3FF" /* Light blue fallback */ }}
              >
                {/* 💡 CENTRAL IMAGE APPLIED HERE AS BACKGROUND */}
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${centerImageUrl})` }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).onerror = null;
                    (e.target as HTMLImageElement).src =
                      "https://placehold.co/500x750/F0F8FF/000?text=Care";
                  }}
                ></div>
              </div>

              {/* Text Overlay for the Center Image */}
              <div className="absolute inset-0 z-10 flex flex-col items-center pt-20 pb-8 px-8 text-center text-white">
                <p className="text-sm tracking-widest uppercase mb-4">
                  WHO WE ARE
                </p>
                <h2 className="text-4xl font-serif font-bold leading-tight mb-6">
                  Professional Care, Inspired by Nature
                </h2>
                {/* Space holder that was previously the image */}
                <div className="w-full h-full"></div>
              </div>
            </div>
          </div>

          {/* Right Text Column */}
          <div className="lg:col-span-1 space-y-8 py-8">
            <div className="space-y-4">
              <div className="flex items-center">
                <Flower className="w-5 h-5 text-dark-blue-600 mr-2" />
                <span className="text-sm tracking-widest uppercase text-dark-blue-600 font-semibold">
                  A Trusted Local Studio
                </span>
              </div>
              <div className="border-r-4 border-dark-blue-600 pr-4 text-right">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  A Trusted Local Studio
                </h3>
                <p className="text-gray-600">
                  We've helped thousands of clients reduce stress, manage pain,
                  and feel better with care that truly makes a difference.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-end">
                <span className="text-sm tracking-widest uppercase text-dark-blue-600 font-semibold">
                  More Than Massage
                </span>
                <Flower className="w-5 h-5 text-dark-blue-600 ml-2" />
              </div>
              <div className="border-r-4 border-dark-blue-600 pr-4 text-right">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  More Than Massage
                </h3>
                <p className="text-gray-600">
                  Our peaceful space is designed for calm, comfort, and care –
                  offering a quiet moment of relief in your busy, demanding day.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Services Section
 */
const Services: React.FC = () => {
  return (
    <section id="services" className="py-20 bg-light-blue-50">
      {" "}
      {/* Changed bg-gray-50 to light-blue-50 */}
      {/* Container is max-w-7xl mx-auto to contain the content width */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <p className="text-sm tracking-widest uppercase text-dark-blue-600 font-semibold mb-2">
              Services
            </p>
            <h2 className="text-5xl font-serif font-bold text-gray-900">
              Begin Your Journey to Better Health
            </h2>
          </div>
          <button className="px-6 py-2 bg-light-blue-200 text-dark-blue-800 rounded-full hover:bg-light-blue-300 transition duration-150">
            View All
          </button>
        </div>

        {/* Service Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {servicesData.map((service, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg overflow-hidden transition duration-300 hover:shadow-2xl"
            >
              {/* Image with rounded bottom corners to match screenshot aesthetic */}
              <div
                className="relative h-64 bg-cover bg-center rounded-t-xl"
                // 💡 Image URL is pulled from the servicesData mock array
                style={{ backgroundImage: `url(${service.image})` }}
                onError={(e) => {
                  (e.target as HTMLImageElement).onerror = null;
                  (e.target as HTMLImageElement).src =
                    "https://placehold.co/400x500/F0F8FF/000?text=Flexora+Service";
                }}
              >
                {/* Plus icon overlay - simple stylized element */}
                <div className="absolute bottom-4 left-4 p-2 bg-white rounded-full shadow-md">
                  <Flower className="w-4 h-4 text-dark-blue-600" />
                </div>
              </div>

              <div className="p-6 text-center">
                <h3 className="text-xl font-semibold font-serif text-gray-900 mb-2">
                  {service.title}
                </h3>
                <p className="text-sm text-gray-600">{service.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/**
 * Reviews/Testimonials Section (No background image needed)
 */
const Reviews: React.FC = () => {
  return (
    <section id="reviews" className="py-20 bg-light-blue-50">
      {/* Container is max-w-7xl mx-auto to contain the content width */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm tracking-widest uppercase text-dark-blue-600 font-semibold mb-2">
            Reviews
          </p>
          <h2 className="text-5xl font-serif font-bold text-gray-900">
            What Our Clients Say About Us
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Review Card 1 (Left) */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-light-blue-200">
            <Quote className="w-8 h-8 text-dark-blue-600 mb-4 transform -scale-x-100" />
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              After a sports injury, I was worried I'd never regain full
              mobility. The chiropractic care I received here not only helped me
              recover faster, but also strengthened areas I hadn't even realized
              were weak.
            </p>
            <p className="font-semibold text-dark-blue-800 uppercase text-sm tracking-wider">
              Elena Donovan
            </p>
          </div>

          {/* Center Column: Rating and Second Review */}
          <div className="lg:col-span-1 flex flex-col items-center justify-between space-y-8">
            {/* Rating Box */}
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-light-blue-200 w-full text-center">
              <p className="text-6xl font-bold font-serif text-dark-blue-600 mb-2">
                4.9
              </p>
              <div className="text-yellow-500 text-3xl mb-2">
                {/* 💡 Reverted star rating text color to yellow-500 */}
                ★★★★★
              </div>
              <p className="text-sm text-gray-600">220+ Reviews on Google</p>
              <button className="mt-4 px-4 py-2 bg-light-blue-200 text-dark-blue-800 rounded-full text-sm hover:bg-light-blue-300 transition duration-150">
                Read All Reviews
              </button>
            </div>

            {/* Review 2 (Middle Top) */}
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-light-blue-200 w-full">
              <Quote className="w-8 h-8 text-dark-blue-600 mb-4 transform -scale-x-100" />
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                I've been to many massage studios, but this one stands out.
                You're not just a name on a schedule—you're treated with respect
                and genuine care.
              </p>
              <p className="font-semibold text-dark-blue-800 uppercase text-sm tracking-wider">
                Marcus Leroy
              </p>
            </div>
          </div>

          {/* Main Review Card 3 (Right) */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-light-blue-200">
            <Quote className="w-8 h-8 text-dark-blue-600 mb-4 transform -scale-x-100" />
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              I've struggled with back pain for years, and after just a few
              sessions here, I feel like a new person. The space is calming, the
              therapists are incredibly skilled, and I always leave feeling
              refreshed and pain-free.
            </p>
            <p className="font-semibold text-dark-blue-800 uppercase text-sm tracking-wider">
              Sophie Daniele
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Benefits/FAQ Section with Image Split
 */
const BenefitsFAQ: React.FC = () => {
  const [openBenefitId, setOpenBenefitId] = useState(1);

  const toggleBenefit = (id: number) => {
    setOpenBenefitId(openBenefitId === id ? 0 : id);
  };

  // 💡 Your custom image URL for the main subject image
  const benefitImageUrl = "/GettyImages-1208634923.jpg";

  // 💡 NEW MARKER: URL for the background pattern/texture *behind* the main image
  const benefitBackgroundUrl = "/pattern_bg.jpg";
  const hasBackground = benefitBackgroundUrl.includes("YOUR_") === false;

  return (
    <section className="py-20 bg-white">
      {/* Container is max-w-7xl mx-auto to contain the content width */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Image Column (Left on Desktop) */}
          <div className="lg:order-1 relative">
            {/* Background texture/pattern box */}
            <div
              className="absolute inset-0 rounded-xl"
              style={{
                backgroundColor: hasBackground ? "transparent" : "#E6F3FF", // Fallback color
                backgroundImage: hasBackground
                  ? `url('${benefitBackgroundUrl}')`
                  : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            ></div>

            <div className="relative p-6">
              <img
                // 💡 Image source here
                src={benefitImageUrl}
                alt="Therapy benefits visualization"
                className="w-full h-auto object-cover rounded-xl shadow-2xl"
                style={{ clipPath: "polygon(0 0, 100% 0, 100% 90%, 0% 100%)" }}
                onError={(e) => {
                  (e.target as HTMLImageElement).onerror = null;
                  (e.target as HTMLImageElement).src =
                    "https://placehold.co/600x800/F0F8FF/000?text=Therapy+Benefit";
                }}
              />
            </div>
          </div>

          {/* Text & Accordion Column (Right on Desktop) */}
          <div className="lg:order-2 space-y-12 pt-10">
            <div>
              <p className="text-sm tracking-widest uppercase text-dark-blue-600 font-semibold mb-2">
                MASSAGE AND YOUR BODY
              </p>
              <h2 className="text-5xl font-serif font-bold text-gray-900">
                How Massage Therapy Transforms Your Body
              </h2>
            </div>

            {/* Accordion */}
            <div className="space-y-4">
              {benefitsData.map((benefit) => (
                <BenefitAccordion
                  key={benefit.id}
                  id={benefit.id}
                  title={benefit.title}
                  content={benefit.content}
                  isOpen={openBenefitId === benefit.id}
                  setOpen={toggleBenefit}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Why Choose Us Section
 */
const WhyChooseUs: React.FC = () => {
  // 💡 MARKER: REPLACE THIS URL with your central 'Why Choose Us' image
  const centerImageUrl = "/pexels-arina-krasnikova-6663372-1.jpg";

  // Data for the 4 core benefits
  const coreBenefits = [
    {
      title: "Flat Fee",
      description:
        "Simple, transparent pricing. Our therapists appreciate tips, reviews, and referrals.",
      icon: DollarSign,
      position: "left-top",
    },
    {
      title: "Licensed & Trusted",
      description:
        "All therapists are licensed, insured, and highly experienced.",
      icon: Award,
      position: "right-top",
    },
    {
      title: "Easy Online Booking",
      description:
        "Same-day appointments often available. Book your massage in minutes.",
      icon: Clock,
      position: "left-bottom",
    },
    {
      title: "Eco-Friendly",
      description:
        "As a small, sustainable business, we offer personalized care with a lighter footprint.",
      icon: HeartHandshake,
      position: "right-bottom",
    },
  ];

  return (
    <section id="why-choose-us" className="py-20 bg-light-blue-50">
      {" "}
      {/* Changed bg-gray-50 to light-blue-50 */}
      {/* Container is max-w-7xl mx-auto to contain the content width */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm tracking-widest uppercase text-dark-blue-600 font-semibold mb-4">
          WHY CHOOSE US?
        </p>
        <h2 className="text-5xl font-serif font-bold text-gray-900 mb-12">
          Care That Goes Beyond the Massage
        </h2>

        {/* Central Arch Layout */}
        <div className="relative flex justify-center py-10">
          {/* Decorative Arch (Mimicking the semi-circle effect) */}
          <div className="absolute top-0 w-full max-w-4xl h-96 border-t-2 border-x-2 border-light-blue-200 rounded-t-full"></div>

          {/* Central Image with rounded clip-path */}
          <img
            // 💡 Image source here
            src={centerImageUrl}
            alt="Central massage image"
            className="w-96 h-[500px] object-cover rounded-full shadow-2xl z-10"
            style={{
              clipPath: "polygon(0% 20%, 50% 0%, 100% 20%, 100% 100%, 0% 100%)",
              transform: "translateY(-20px)",
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).onerror = null;
              (e.target as HTMLImageElement).src =
                "https://placehold.co/500x700/F0F8FF/000?text=Why+Choose+Us";
            }}
          />

          {/* Benefit Blocks positioned around the image */}
          {coreBenefits.map((benefit, index) => (
            <div
              key={index}
              className={`absolute w-64 text-left p-4 z-20 ${
                benefit.position === "left-top"
                  ? "top-10 left-0 lg:left-10"
                  : benefit.position === "right-top"
                  ? "top-10 right-0 lg:right-10 text-right"
                  : benefit.position === "left-bottom"
                  ? "bottom-10 left-0 lg:left-10"
                  : "bottom-10 right-0 lg:right-10 text-right"
              } hidden sm:block`}
            >
              <div
                className={`flex items-center mb-2 ${
                  benefit.position.includes("right")
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                {benefit.position.includes("left") && (
                  <benefit.icon className="w-5 h-5 text-dark-blue-600 mr-2" />
                )}
                <h3 className="text-xl font-semibold text-gray-900">
                  {benefit.title}
                </h3>
                {benefit.position.includes("right") && (
                  <benefit.icon className="w-5 h-5 text-dark-blue-600 ml-2" />
                )}
              </div>
              <p className="text-sm text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/**
 * Meet Our Therapist Section
 */
const MeetOurTherapist: React.FC = () => {
  const therapists = [
    {
      name: "Hana Gregson",
      title: "FOUNDER / MASSAGE THERAPIST",
      // 💡 REPLACE THIS URL with Hana's image
      image: "/GettyImages-1324943018-2-1024x600.jpg",
    },
    {
      name: "Lisa Simonelli",
      title: "MASSAGE THERAPIST",
      // 💡 REPLACE THIS URL with Lisa's image
      image: "/GettyImages-sb10064081j-002-1024x600.jpg",
    },
  ];

  return (
    <section id="therapist" className="py-20 bg-light-blue-50">
      {/* Container is max-w-7xl mx-auto to contain the content width */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Introduction Column */}
          <div className="lg:col-span-1 space-y-6">
            <p className="text-sm tracking-widest uppercase text-dark-blue-600 font-semibold">
              Our Therapist
            </p>
            <h2 className="text-5xl font-serif font-bold text-gray-900">
              Meet Our Therapist
            </h2>
            <p className="text-lg text-gray-600">
              Every therapist is carefully vetted and background-checked to
              ensure your safety, comfort, and expert care.
            </p>
            <button className="px-6 py-3 border border-dark-blue-600 text-dark-blue-800 rounded-full hover:bg-white transition duration-150 font-medium">
              Meet the Team
            </button>
          </div>

          {/* Therapist Cards Grid */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
            {therapists.map((therapist, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-xl overflow-hidden"
              >
                <div
                  className="h-80 w-full bg-cover bg-center"
                  // 💡 Image source here
                  style={{ backgroundImage: `url(${therapist.image})` }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).onerror = null;
                    (e.target as HTMLImageElement).src =
                      "https://placehold.co/400x550/F0F8FF/000?text=Therapist";
                  }}
                ></div>
                <div className="p-6 text-center">
                  <h3 className="text-2xl font-semibold font-serif text-gray-900">
                    {therapist.name}
                  </h3>
                  <p className="text-sm tracking-wider uppercase text-dark-blue-600 mt-1">
                    {therapist.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Blog Section
 */
const Blog: React.FC = () => {
  return (
    <section id="blog" className="py-20 bg-white">
      {/* Container is max-w-7xl mx-auto to contain the content width */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <h2 className="text-5xl font-serif font-bold text-gray-900">
            Therapist Tips & Wellness Wisdom
          </h2>
          <button className="px-6 py-2 bg-light-blue-200 text-dark-blue-800 rounded-full hover:bg-light-blue-300 transition duration-150">
            Read All
          </button>
        </div>

        {/* Blog Post Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {blogData.map((post, index) => (
            <div key={index} className="space-y-4">
              <div
                className="h-64 bg-cover bg-center rounded-xl shadow-lg"
                // 💡 Image source here
                style={{ backgroundImage: `url(${post.image})` }}
                onError={(e) => {
                  (e.target as HTMLImageElement).onerror = null;
                  (e.target as HTMLImageElement).src =
                    "https://placehold.co/400x300/F0F8FF/000?text=Blog+Post";
                }}
              ></div>
              <p className="text-xs tracking-widest uppercase text-dark-blue-600 font-semibold pt-2">
                {post.category}
              </p>
              <h3 className="text-xl font-semibold font-serif text-gray-900 hover:text-dark-blue-600 transition duration-150 cursor-pointer">
                {post.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/**
 * Call to Action Section (Why Wait to Feel Better?)
 */ const CtaWhyWait: React.FC = () => {
  // 💡 URL for the background video (relative path from public folder)
  const ctaVideoUrl =
    "/pexels.com_video_woman-doing-a-back-massage-6628400.webm";

  return (
    <section
      id="cta-wait"
      // Use 'relative' for the content to be positioned relative to this section
      className="py-20 relative overflow-hidden flex justify-center items-center"
      style={{ minHeight: "400px" }}
    >
      {/* Background Media Container (full width) - z-0 */}
      <div className="absolute z-0 w-full h-full inset-0">
        {/* 💡 Background Video Element */}
        {/* 'fixed' positioning is applied via 'backgroundAttachment: "fixed"' style on the video's wrapper or by making the video fixed. 
            For a full-width background video in a container, a combination of 'absolute' on the video wrapper
            and 'background-attachment: fixed' on a *covering* element is often used, but here, 
            simply keeping the video within the absolute container and using object-cover is cleaner.
            We ensure the video itself acts as the background. 
        */}

        <video
          autoPlay
          loop
          muted
          playsInline // Important for mobile devices
          className="w-full h-full object-cover"
          style={
            {
              // REMOVED: background-color and background-image from here.
              // They were obscuring the video. The gradient is moved to a separate overlay <div>.
              // backgroundAttachment: "fixed", // Not necessary here, the video is within the section.
            }
          }
        >
          <source src={ctaVideoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* 💡 NEW: Dedicated Overlay Div (z-10) */}
      <div
        className="absolute z-10 w-full h-full inset-0"
        style={{
          // This applies a fixed, dark, semi-transparent overlay *over* the video (z-0)
          // but *under* the main content (z-20)
          backgroundColor: "rgba(0, 0, 0, 0.5)", // Dark overlay
        }}
      ></div>

      {/* Content Container (max-w-7xl mx-auto for centering/fixed width) - z-20 */}
      <div className="relative z-20 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 text-center py-10">
        <h2 className="text-5xl font-serif font-bold text-white mb-4">
          Why Wait to Feel Better?
        </h2>
        <p className="text-xl text-gray-200 mb-8">
          Start your journey to relaxation and wellness today.
        </p>

        {/* ... buttons remain the same ... */}
        <div className="flex flex-wrap justify-center items-center space-x-4">
          {/* Call button */}
          <button className="flex items-center px-6 py-3 bg-white text-dark-blue-600 font-semibold rounded-full shadow-xl hover:bg-gray-100 transition duration-300 transform hover:scale-105">
            {/* <Phone className="w-5 h-5 mr-2" /> */}
            (422) 820 820
          </button>
          <span className="text-white text-lg">or</span>
          {/* Appointment button */}
          <button className="flex items-center px-6 py-3 bg-dark-blue-600 text-white font-semibold rounded-full shadow-xl hover:bg-dark-blue-700 transition duration-300 transform hover:scale-105">
            {/* <CalendarCheck className="w-5 h-5 mr-2" /> */}
            Book Appointment
          </button>
        </div>
      </div>
    </section>
  );
};
/**
 * Appointment Booking and Footer Section
 */
const AppointmentFooter: React.FC = () => {
  return (
    <footer
      className="relative py-20 bg-cover bg-center text-white"
      // 💡 Ensure background stretches full width
      style={{ backgroundColor: "#035C84" }}
    >
      {/* Container is max-w-7xl mx-auto to contain the content width */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column: Stay Connected & Footer Menu */}
          <div className="space-y-10">
            {/* Stay Connected (Newsletter) */}
            <div className="space-y-4">
              <h3 className="text-3xl font-serif font-bold text-white">
                Stay Connected
              </h3>
              <p className="text-gray-300">
                Never miss our special massage offers and the latest wellness
                news!
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <input
                  type="email"
                  placeholder="Email Address"
                  className="px-4 py-3 w-full sm:w-2/3 rounded-full text-gray-800 focus:outline-none focus:ring-2 focus:ring-light-blue-200"
                />
                <button className="px-6 py-3 bg-light-blue-200 text-dark-blue-800 font-semibold rounded-full hover:bg-light-blue-300 transition duration-300 w-full sm:w-1/3">
                  Send
                </button>
              </div>
            </div>

            {/* Menu & Services Links */}
            <div className="grid grid-cols-2 gap-8 pt-8">
              <div>
                <h4 className="text-xl font-semibold mb-4 text-light-blue-400">
                  Menu
                </h4>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>
                    <a href="#about" className="hover:text-light-blue-400">
                      About
                    </a>
                  </li>
                  <li>
                    <a href="#reviews" className="hover:text-light-blue-400">
                      Reviews
                    </a>
                  </li>
                  <li>
                    <a href="#blog" className="hover:text-light-blue-400">
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="#contact" className="hover:text-light-blue-400">
                      Contact
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-xl font-semibold mb-4 text-light-blue-400">
                  Services
                </h4>
                <ul className="space-y-2 text-gray-300 text-sm">
                  {servicesData.map((service, index) => (
                    <li key={index}>
                      <a
                        href={`#service-${index}`}
                        className="hover:text-light-blue-400"
                      >
                        {service.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column: Appointment Booking Card */}
          <div className="flex justify-end lg:justify-start">
            <div className="bg-white p-8 rounded-2xl shadow-2xl text-gray-800 max-w-sm w-full">
              <h3 className="text-2xl font-serif font-bold mb-6">
                Book an Appointment
              </h3>

              {/* Contact Details */}
              <ul className="space-y-4 text-sm">
                <li className="flex items-start">
                  <MapPin className="w-4 h-4 mr-3 mt-1 text-dark-blue-600 flex-shrink-0" />
                  <span>200 Sutter St Suite 602 San Francisco</span>
                </li>
                <li className="flex items-start">
                  <Clock className="w-4 h-4 mr-3 mt-1 text-dark-blue-600 flex-shrink-0" />
                  <span>Mon–Thu 7:30 AM–7:30 PM / Fri–Day 8:00 AM–4:30 PM</span>
                </li>
                <li className="flex items-start">
                  <Mail className="w-4 h-4 mr-3 mt-1 text-dark-blue-600 flex-shrink-0" />
                  <span>contact@flexora.com</span>
                </li>
              </ul>

              <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-200">
                <button className="flex items-center px-4 py-2 bg-light-blue-200 text-dark-blue-800 rounded-full hover:bg-light-blue-300 transition duration-300">
                  <CalendarCheck className="w-4 h-4 mr-2" />
                  Book Now
                </button>
                <div className="text-lg font-semibold text-dark-blue-800">
                  (422) 820 820
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Strip */}
      <div className="relative border-t border-dark-blue-700 mt-12 pt-6 text-center text-sm text-gray-300">
        {/* 💡 Container is max-w-7xl mx-auto to contain the content width */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <p>&copy; {new Date().getFullYear()} Flexora. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-light-blue-400">
              Terms of Service
            </a>
            <a href="#" className="hover:text-light-blue-400">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// --- Main App Component (Wrapper) ---

/**
 * Main wrapper for the Flexora homepage.
 * Uses a palette of soft blues to match the calming, professional theme.
 */
const HomePage: React.FC = () => {
  // Define custom colors based on the screenshot aesthetic (soft neutrals/earth tones)
  const CustomStyle = `
    /* Custom Blue Color Palette (Based on IMG-20251116-WA0010.jpg) */
    .text-dark-blue-600 { color: #035C84; }
    .bg-dark-blue-600 { background-color: #035C84; }
    .hover\\:bg-dark-blue-700:hover { background-color: #0873A1; } /* Medium Blue */
    .text-dark-blue-800 { color: #003F5C; } /* Darker shade for text contrast */
    .bg-dark-blue-800 { background-color: #003F5C; } /* Darkest background */
    .border-dark-blue-700 { border-color: #003F5C; } /* Border color matching dark background */

    .text-light-blue-400 { color: #94CCE7; } /* Light accent color for links/titles in dark sections */
    .hover\\:text-dark-blue-600:hover { color: #035C84; } /* Primary blue for hover */

    /* Light Blue Backgrounds */
    .bg-light-blue-50 { background-color: #F0F8FF; } /* Very light blue/off-white */
    .bg-light-blue-100 { background-color: #E6F3FF; } /* Pale blue */
    .bg-light-blue-200 { background-color: #94CCE7; } /* Light blue for button background */
    .hover\\:bg-light-blue-300:hover { background-color: #79BDE1; } /* Slightly darker light blue for hover */
    .border-light-blue-200 { border-color: #94CCE7; } /* Border for review cards */
    
    /* Reintroducing standard yellow for star ratings */
    .text-yellow-500 { color: #F59E0B; } 


    .font-serif { font-family: 'Georgia', serif; }
  `;

  return (
    <div className="min-h-screen bg-white">
      {/* Inject custom styles for the color theme */}
      <style dangerouslySetInnerHTML={{ __html: CustomStyle }} />
      <Header />
      <main>
        {/* --- SECTION ORDER UPDATED AS PER YOUR REQUEST --- */}
        <Hero /> {/* 1. Massage for Your Body & Mind */}
        <AboutUs /> {/* 2. Professional Care, Inspired by Nature */}
        <Services /> {/* 3. Begin Your Journey to Better Health */}
        <WhyChooseUs /> {/* 4. Care That Goes Beyond the Massage */}
        <BenefitsFAQ /> {/* 5. How Massage Therapy Transforms Your Body */}
        <MeetOurTherapist /> {/* 6. Meet Our Therapist */}
        <CtaWhyWait /> {/* 7. Why Wait to Feel Better? */}
        <Reviews /> {/* 8. What Our Clients Say About Us */}
        <Blog /> {/* 9. Therapist Tips & Wellness Wisdom */}
      </main>
      <AppointmentFooter /> {/* 10. Stay Connected... */}
    </div>
  );
};

export default HomePage;
