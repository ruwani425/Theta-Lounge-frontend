import React, { useState } from "react";
import {
  Flower,
  CalendarCheck,
  ChevronDown,
  Award,
  DollarSign,
  Clock,
  HeartHandshake,

  Quote, // New icon for Testimonials
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"; // 1. Import Framer Motion
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
} as const;

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const imageZoom = {
  hidden: { scale: 1.1, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { duration: 1.2 } }
};

// --- Data Structures (Same as before) ---
const coreBenefits = [
  {
    title: "Flat Fee",
    description: "Simple, transparent pricing. Our therapists appreciate tips, reviews, and referrals.",
    icon: DollarSign,
    position: "left-top",
  },
  {
    title: "Licensed & Trusted",
    description: "All therapists are licensed, insured, and highly experienced.",
    icon: Award,
    position: "right-top",
  },
  {
    title: "Easy Online Booking",
    description: "Same-day appointments often available. Book your massage in minutes.",
    icon: Clock,
    position: "left-bottom",
  },
  {
    title: "Eco-Friendly",
    description: "As a small, sustainable business, we offer personalized care with a lighter footprint.",
    icon: HeartHandshake,
    position: "right-bottom",
  },
];

const servicesData = [
  {
    title: "Swedish Massage",
    description:
      "Gentle, full-body massage that relaxes muscles and reduces stress.",
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
      <motion.div
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <ChevronDown className={`h-5 w-5 ${isOpen ? "text-dark-blue-600" : "text-gray-400"}`} />
      </motion.div>
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <p className="pb-4 text-gray-600">{content}</p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const Hero: React.FC = () => {
  const heroVideoUrl = "/Floating_Tank_Video_Generated.mp4";
  return (
    <section id="home" className="min-h-screen relative w-full overflow-hidden flex justify-center items-center">
      <div className="absolute z-0 w-full h-full inset-0">
        <video autoPlay loop muted className="w-full h-full object-cover">
          <source src={heroVideoUrl} type="video/mp4" />
        </video>
      </div>
      <div className="absolute z-10 inset-0 bg-black opacity-30"></div>

      <div className="relative z-20 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-20 flex flex-col justify-center h-full">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-xl p-6"
        >
          <motion.h1 variants={fadeInUp} className="text-6xl font-serif font-bold text-white leading-tight mb-4">
            Massage for Your Body & Mind
          </motion.h1>
          <motion.p variants={fadeInUp} className="text-lg text-gray-200 mb-8">
            Make it a weekly ritual – relax, recharge, recover.
          </motion.p>
          <motion.button 
            variants={fadeInUp}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center px-6 py-3 bg-white text-dark-blue-600 font-semibold rounded-full shadow-xl"
          >
            <CalendarCheck className="w-5 h-5 mr-2" />
            Book Appointment
          </motion.button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="absolute bottom-0 left-0 right-0 py-4 px-4 sm:px-6 lg:px-8 bg-black bg-opacity-30 text-white backdrop-blur-sm"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm font-medium">
              {["Reduced Pain", "Improved Circulation", "Reduced Stress", "Enhances Overall Well-being"].map((text, i) => (
                <motion.p 
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 + (i * 0.2) }}
                >
                  {text}
                </motion.p>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const AboutUs: React.FC = () => {
  return (
    <section className="py-20 relative bg-light-blue-50 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="lg:col-span-1 space-y-8 py-8"
          >
            {[
              { title: "Skilled, Caring Therapists", subtitle: "16+ Years of Experience", desc: "Our licensed professionals bring years of experience and a deep understanding of bodywork and wellness." },
              { title: "Inspired by Nature", subtitle: "Evening & Weekend Availability", desc: "We use gentle techniques, natural oils, and calming touch to help you feel restored and balanced." }
            ].map((item, i) => (
              <motion.div key={i} variants={fadeInUp} className="space-y-4">
                <div className="flex items-center">
                  <Flower className="w-5 h-5 text-dark-blue-600 mr-2" />
                  <span className="text-sm tracking-widest uppercase text-dark-blue-600 font-semibold">{item.subtitle}</span>
                </div>
                <div className="border-l-4 border-dark-blue-600 pl-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Center Column */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={imageZoom}
            className="lg:col-span-1 flex justify-center relative"
          >
             <div className="relative w-full max-w-sm h-[600px] overflow-hidden rounded-t-[50%] rounded-b-xl shadow-2xl">
                <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url('/GettyImages-1322320699-1.jpg')` }} />
                <div className="absolute inset-0 z-10 flex flex-col items-center pt-20 px-8 text-center text-white bg-black/20">
                  <p className="text-sm tracking-widest uppercase mb-4">WHO WE ARE</p>
                  <h2 className="text-4xl font-serif font-bold leading-tight">Professional Care, Inspired by Nature</h2>
                </div>
             </div>
          </motion.div>

          {/* Right Column */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="lg:col-span-1 space-y-8 py-8"
          >
            {[
              { title: "A Trusted Local Studio", subtitle: "A Trusted Local Studio", desc: "We've helped thousands of clients reduce stress and manage pain with care that makes a difference." },
              { title: "More Than Massage", subtitle: "More Than Massage", desc: "Our peaceful space is designed for calm, comfort, and care – a quiet moment of relief in your day." }
            ].map((item, i) => (
              <motion.div key={i} variants={fadeInUp} className="space-y-4">
                <div className="flex items-center justify-end">
                  <span className="text-sm tracking-widest uppercase text-dark-blue-600 font-semibold">{item.subtitle}</span>
                  <Flower className="w-5 h-5 text-dark-blue-600 ml-2" />
                </div>
                <div className="border-r-4 border-dark-blue-600 pr-4 text-right">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const Services: React.FC = () => {
  return (
    <section id="services" className="py-20 bg-light-blue-50 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="flex justify-between items-end mb-12"
        >
          <div>
            <p className="text-sm tracking-widest uppercase text-dark-blue-600 font-semibold mb-2">Services</p>
            <h2 className="text-5xl font-serif font-bold text-gray-900">Begin Your Journey to Better Health</h2>
          </div>
          <button className="px-6 py-2 bg-light-blue-200 text-dark-blue-800 rounded-full hover:bg-light-blue-300">View All</button>
        </motion.div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {servicesData.map((service, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              whileHover={{ y: -10 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="relative h-64 bg-cover bg-center" style={{ backgroundImage: `url(${service.image})` }}>
                <div className="absolute bottom-4 left-4 p-2 bg-white rounded-full shadow-md">
                  <Flower className="w-4 h-4 text-dark-blue-600" />
                </div>
              </div>
              <div className="p-6 text-center">
                <h3 className="text-xl font-semibold font-serif text-gray-900 mb-2">{service.title}</h3>
                <p className="text-sm text-gray-600">{service.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

/**
 * Reviews/Testimonials Section (No background image needed)
 */
const Reviews: React.FC = () => {
  return (
    <section id="reviews" className="py-20 bg-light-blue-50 w-full">
      {" "}
      {/* Use lightest background */}
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

  const benefitImageUrl = "/GettyImages-1208634923.jpg";

  const benefitBackgroundUrl = "/pattern_bg.jpg";
  const hasBackground = benefitBackgroundUrl.includes("YOUR_") === false;

  return (
    <section className="py-20 bg-white w-full">
      {" "}
      {/* Use white background */}
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
const WhyChooseUs: React.FC = () => {
  return (
    <section id="why-choose-us" className="py-20 bg-light-blue-50 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <p className="text-sm tracking-widest uppercase text-dark-blue-600 font-semibold mb-4">WHY CHOOSE US?</p>
            <h2 className="text-5xl font-serif font-bold text-gray-900 mb-12">Care That Goes Beyond the Massage</h2>
        </motion.div>

        <div className="relative flex justify-center py-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="absolute top-0 w-full max-w-4xl h-96 border-t-2 border-x-2 border-light-blue-200 rounded-t-full"
          />

          <motion.img
            initial={{ y: 100, opacity: 0 }}
            whileInView={{ y: -20, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 50 }}
            src="/pexels-arina-krasnikova-6663372-1.jpg"
            className="w-96 h-[500px] object-cover rounded-full shadow-2xl z-10"
            style={{ clipPath: "polygon(0% 20%, 50% 0%, 100% 20%, 100% 100%, 0% 100%)" }}
          />

          {/* Benefit Blocks */}
          {coreBenefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -100 : 100 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 + (index * 0.1) }}
              className={`absolute w-64 text-left p-4 z-20 hidden sm:block ${
                benefit.position === "left-top" ? "top-10 left-10" : 
                benefit.position === "right-top" ? "top-10 right-10 text-right" : 
                benefit.position === "left-bottom" ? "bottom-10 left-10" : 
                "bottom-10 right-10 text-right"
              }`}
            >
              <div className={`flex items-center mb-2 ${benefit.position.includes("right") ? "justify-end" : "justify-start"}`}>
                {benefit.position.includes("left") && <benefit.icon className="w-5 h-5 text-dark-blue-600 mr-2" />}
                <h3 className="text-xl font-semibold text-gray-900">{benefit.title}</h3>
                {benefit.position.includes("right") && <benefit.icon className="w-5 h-5 text-dark-blue-600 ml-2" />}
              </div>
              <p className="text-sm text-gray-600">{benefit.description}</p>
            </motion.div>
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
      image: "/GettyImages-1324943018-2-1024x600.jpg",
    },
    {
      name: "Lisa Simonelli",
      title: "MASSAGE THERAPIST",
      image: "/GettyImages-sb10064081j-002-1024x600.jpg",
    },
  ];

  return (
    <section id="therapist" className="py-20 bg-light-blue-50 w-full">
      {" "}
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
    <section id="blog" className="py-20 bg-white w-full">
      {" "}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {blogData.map((post, index) => (
            <div key={index} className="space-y-4">
              <div
                className="h-64 bg-cover bg-center rounded-xl shadow-lg"
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
  const ctaVideoUrl =
    "/pexels.com_video_woman-doing-a-back-massage-6628400.webm";

  return (
    <section
      id="cta-wait"
      className="py-20 relative overflow-hidden flex justify-center items-center w-full" // Added w-full
      style={{ minHeight: "400px" }}
    >
      <div className="absolute z-0 w-full h-full inset-0">
        <video
          autoPlay
          loop
          muted
          playsInline 
          className="w-full h-full object-cover"
        >
          <source src={ctaVideoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <div
        className="absolute z-10 w-full h-full inset-0"
        style={{
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
 * Main wrapper for the Floating Theraphy homepage.
 */
const HomePage: React.FC = () => {
  const CustomStyle = `
    /* ** CRITICAL FIX: RESET BODY/HTML MARGINS ** */
    html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        overflow-x: hidden; 
    }

    /* CUSTOM COLOR PALETTE MAPPING */
    /* Based on #035C84 (Darkest Blue) and #94CCE7 (Lightest Blue) */
    .text-dark-blue-600 { color: #035C84; } /* Primary/Main Dark Blue */
    .bg-dark-blue-600 { background-color: #035C84; }
    .hover\\:bg-dark-blue-700:hover { background-color: #0873A1; } /* Medium Blue (Hover/Accent) */
    .text-dark-blue-800 { color: #003F5C; } /* Used for highest contrast text, based on #035C84 shade */
    .border-dark-blue-600 { border-color: #035C84; } /* Added for border-l-4 in AboutUs */
    .border-dark-blue-700 { border-color: #0873A1; } /* Border color matching medium blue */
    
    .text-light-blue-400 { color: #2DA0CC; } /* Lighter Blue (Link/Icon color) */
    .hover\\:text-dark-blue-600:hover { color: #035C84; } /* Primary blue for hover */

    /* Light Blue Backgrounds */
    .bg-light-blue-50 { background-color: #F0F8FF; } /* Very light/Off-white background - based on #94CCE7 light tint */
    .bg-light-blue-100 { background-color: #E6F3FF; } /* Pale blue (used for hover on light items) */
    .bg-light-blue-200 { background-color: #94CCE7; } /* Pale Blue (Button Background/Border) */
    .hover\\:bg-light-blue-300:hover { background-color: #79BDE1; } /* Slightly darker light blue for hover */
    .border-light-blue-200 { border-color: #94CCE7; } /* Border for review cards */
    
    /* Star Ratings */
    .text-yellow-500 { color: #F59E0B; } 
    
    .font-serif { font-family: 'Georgia', serif; }
  `;

  
    return (
    <div className="min-h-screen bg-white w-full">
      <style dangerouslySetInnerHTML={{ __html: CustomStyle }} />
      <main>
        <Hero /> 
        <AboutUs /> 
        <Services />
        <WhyChooseUs /> 
        <BenefitsFAQ />
        <MeetOurTherapist /> 
        <CtaWhyWait />
        <Reviews />
        <Blog />
      </main>
    </div>
  );
};

export default HomePage;