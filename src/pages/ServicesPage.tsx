import React from "react";
import { Flower } from "lucide-react";
import { motion, type Variants } from "framer-motion";

// --- Animation Variants ---
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: "easeOut" } 
  }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

// --- Color Palette & Assets ---
const COLORS = {
  lightestBlue: "#94CCE7",
  lightBlue: "#2DA0CC",
  mediumBlue: "#0873A1",
  darkBlue: "#035C84",
  white: "#FFFFFF",
  bgLight: "#F0F8FF",
};

// --- Types & Data ---
interface ServiceItem {
  id: string;
  title: string;
  description: string;
  image: string;
  isHighlighted?: boolean;
}

interface ServiceSectionData {
  id: string;
  categoryTitle: string;
  subTitle?: string;
  description: string;
  services: ServiceItem[];
}

const servicesData: ServiceSectionData[] = [
  {
    id: "chiropractic",
    categoryTitle: "Chiropractic Care",
    subTitle: "OUR CORE FOCUS",
    description:
      "Spinal health is at the heart of everything we do. Our chiropractic services restore alignment, relieve pain, and improve mobility.",
    services: [
      {
        id: "c1",
        title: "Chiropractic Care",
        description: "Restores alignment, improves mobility, supports lasting health.",
        image: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "c2",
        title: "Chronic Pain",
        description: "Reduces discomfort, restores movement, improves daily life.",
        image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "c3",
        title: "Sport Injuries",
        description: "Speeds recovery, prevents setbacks, enhances performance.",
        image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "c4",
        title: "Posture Correction",
        description: "Relieves strain, improves alignment, supports balance.",
        image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        isHighlighted: true,
      },
    ],
  },
  {
    id: "massage",
    categoryTitle: "Massage Therapy",
    subTitle: "COMPLEMENTARY",
    description:
      "To support your chiropractic care, we also offer massage therapies that relax muscles, release tension, and promote faster recovery.",
    services: [
      {
        id: "m1",
        title: "Swedish Massage",
        description: "Gentle relaxation to reduce stress and improve circulation.",
        image: "https://images.unsplash.com/photo-1519824145371-296894a0daa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "m2",
        title: "Deep Tissue",
        description: "Targets deep muscle layers to release chronic tension.",
        image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "m3",
        title: "Medical Massage",
        description: "Focused techniques to address specific medical conditions.",
        image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "m4",
        title: "SPA Massage",
        description: "Luxurious treatments designed for pure relaxation.",
        image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: "physical",
    categoryTitle: "Physical Therapy",
    subTitle: "REHABILITATIVE",
    description:
      "For patients needing extra support, physical therapy works hand in hand with chiropractic adjustments to rebuild strength and restore mobility.",
    services: [
      {
        id: "p1",
        title: "Physical Therapy",
        description: "We help you move better, feel stronger, and get back to life.",
        image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "p2",
        title: "Orthopedic Rehab",
        description: "Relief and recovery through personalized, holistic care.",
        image: "https://images.unsplash.com/photo-1591343395082-e120087004b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "p3",
        title: "Occupational Therapy",
        description: "OT that restores function and independence — personalized.",
        image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "p4",
        title: "Sports Injury Rehab",
        description: "Recover stronger with targeted, holistic rehab for athletes.",
        image: "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        isHighlighted: true,
      },
    ],
  },
];

// --- Component: Service Card ---
const ServiceCard: React.FC<{ item: ServiceItem }> = ({ item }) => {
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -12 }}
      className={`
        group relative flex flex-col rounded-2xl overflow-hidden 
        bg-white shadow-sm transition-all duration-300 hover:shadow-xl
        w-full max-w-md mx-auto sm:max-w-none
        ${item.isHighlighted ? `ring-4 ring-[${COLORS.lightestBlue}] shadow-md` : ""}
      `}
    >
      <div className="relative h-56 sm:h-64 overflow-hidden">
        <img
          src={item.image}
          alt={item.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
      </div>

      <div className="relative px-5 pb-8 pt-10 text-center flex-grow flex flex-col items-center">
        <motion.div 
          initial={{ y: 0 }}
          whileHover={{ y: -5, rotate: 10 }}
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white p-2 rounded-full z-10 shadow-sm"
        >
          <div className="bg-white rounded-full p-3 border border-gray-50"> 
            <Flower 
              size={24} 
              color={COLORS.darkBlue} 
              className="fill-current opacity-80"
            />
          </div>
        </motion.div>

        <h3 className="text-xl sm:text-2xl font-serif font-bold mb-3" style={{ color: COLORS.darkBlue }}>
          {item.title}
        </h3>
        
        <p className="text-gray-600 text-sm sm:text-base font-sans leading-relaxed">
          {item.description}
        </p>
      </div>
    </motion.div>
  );
};

// --- Main Page Component ---
const ServicesPage: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-white flex flex-col overflow-x-hidden">
      
      {/* --- Header Section --- */}
      <div className="relative w-full px-4 sm:px-6 pt-32 pb-20 md:pt-48 md:pb-28 text-center overflow-hidden">
        <video
          src="https://videos.pexels.com/video-files/9694443/9694443-hd_1920_1080_25fps.mp4"
          loop preload="none" muted playsInline autoPlay
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#3a7ca5]/90 to-[#1B4965]/90"></div>

        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative z-10 max-w-4xl mx-auto"
        >
          <motion.h1 
            variants={fadeInUp}
            className="text-5xl sm:text-6xl md:text-7xl font-serif font-bold mb-6 leading-tight text-white"
          >
            Our Services
          </motion.h1>
          <motion.p 
            variants={fadeInUp}
            className="text-base sm:text-lg uppercase tracking-[0.3em] mb-8 text-blue-100 font-bold"
          >
            Begin Your Journey to Better Health
          </motion.p>
          <motion.p 
            variants={fadeInUp}
            className="text-base sm:text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto"
          >
            At Floating Theraphy, <strong>chiropractic care</strong> is at the center of everything we do. 
            We restore balance, relieve pain, and help your body function at its best.
          </motion.p>
        </motion.div>
      </div>

      {/* --- Service Categories Loop --- */}
      {servicesData.map((section, index) => (
        <motion.section 
          key={section.id} 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className={`w-full py-16 md:py-24 ${index % 2 !== 0 ? 'bg-gray-50' : 'bg-white'}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Section Header */}
            <motion.div variants={fadeInUp} className="text-center mb-12 md:mb-20">
              {section.subTitle && (
                <p 
                  className="uppercase tracking-[0.2em] text-xs font-bold mb-4"
                  style={{ color: COLORS.lightBlue }}
                >
                  {section.subTitle}
                </p>
              )}
              <h2 
                className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-6"
                style={{ color: COLORS.darkBlue }}
              >
                {section.categoryTitle}
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
                {section.description}
              </p>
            </motion.div>

            {/* Cards Grid */}
            <motion.div 
              variants={staggerContainer}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10"
            >
              {section.services.map((item) => (
                <ServiceCard key={item.id} item={item} />
              ))}
            </motion.div>
          </div>
        </motion.section>
      ))}

      <div className="h-12 md:h-20 bg-white"></div>
    </div>
  );
};

export default ServicesPage;